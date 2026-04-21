import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Mail,
  MessageSquare,
  Calendar,
  Globe,
  FileText,
  FolderPlus,
  FolderEdit,
  FolderMinus,
  UserPlus,
  UserMinus,
  Building2,
  Crown,
  Upload,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface EventRow {
  id: string;
  type: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface LogRow {
  id: string;
  status: string;
  event_id: string | null;
  action_type: string;
}

interface TimelineGroup {
  event_id: string;
  event_type: string;
  created_at: string;
  metadata: Record<string, any> | null;
  actions: LogRow[];
  status: "completed" | "failed" | "pending" | "neutral";
}

const eventIcons: Record<string, React.ElementType> = {
  PROJECT_CREATED: FolderPlus,
  PROJECT_UPDATED: FolderEdit,
  PROJECT_DELETED: FolderMinus,
  MEMBER_ADDED: UserPlus,
  MEMBER_REMOVED: UserMinus,
  PROJECT_MEMBER_ADDED: UserPlus,
  PROJECT_MEMBER_REMOVED: UserMinus,
  WORKSPACE_CREATED: Building2,
  OWNERSHIP_TRANSFERRED: Crown,
  DOCUMENT_UPLOADED: Upload,
};

const eventLabels: Record<string, string> = {
  PROJECT_CREATED: "Project created",
  PROJECT_UPDATED: "Project updated",
  PROJECT_DELETED: "Project deleted",
  MEMBER_ADDED: "Member added",
  MEMBER_REMOVED: "Member removed",
  PROJECT_MEMBER_ADDED: "Member added to project",
  PROJECT_MEMBER_REMOVED: "Member removed from project",
  WORKSPACE_CREATED: "Workspace created",
  OWNERSHIP_TRANSFERRED: "Ownership transferred",
  DOCUMENT_UPLOADED: "Document uploaded",
};

const actionIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SLACK_MESSAGE: MessageSquare,
  GOOGLE_CALENDAR_EVENT: Calendar,
  WEBHOOK: Globe,
  LOG: FileText,
};

const actionLabels: Record<string, string> = {
  EMAIL: "Email sent",
  SLACK_MESSAGE: "Slack message sent",
  GOOGLE_CALENDAR_EVENT: "Calendar event created",
  WEBHOOK: "Webhook fired",
  LOG: "Logged",
};

const formatEvent = (type: string, metadata: Record<string, any> | null) => {
  const base = eventLabels[type] ?? type.replace(/_/g, " ").toLowerCase();
  const name =
    metadata?.project_name ?? metadata?.org_name ?? metadata?.document_name;
  if (name && (type.startsWith("PROJECT_") || type === "WORKSPACE_CREATED" || type === "DOCUMENT_UPLOADED")) {
    if (type === "PROJECT_CREATED") return `Project "${name}" created`;
    if (type === "PROJECT_UPDATED") return `Project "${name}" updated`;
    if (type === "PROJECT_DELETED") return `Project "${name}" deleted`;
    if (type === "DOCUMENT_UPLOADED") return `Document "${name}" uploaded`;
    if (type === "WORKSPACE_CREATED") return `Workspace "${name}" created`;
  }
  return base;
};

const formatAction = (type: string) =>
  actionLabels[type] ?? type.replace(/_/g, " ").toLowerCase();

interface Props {
  orgId: string;
  limit?: number;
}

const ActivityTimeline = ({ orgId, limit = 8 }: Props) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: evData } = await supabase
        .from("events")
        .select("id, type, created_at, metadata")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);

      const evRows = (evData ?? []) as EventRow[];

      let logRows: LogRow[] = [];
      if (evRows.length > 0) {
        const eventIds = evRows.map((e) => e.id);
        const { data: lData } = await supabase
          .from("automation_logs")
          .select("id, status, event_id, automation_rules!inner(action_type, org_id)")
          .eq("automation_rules.org_id", orgId)
          .in("event_id", eventIds);

        logRows = ((lData ?? []) as any[]).map((r) => ({
          id: r.id,
          status: r.status ?? "pending",
          event_id: r.event_id,
          action_type: r.automation_rules?.action_type ?? "—",
        }));
      }

      if (!cancelled) {
        setEvents(evRows);
        setLogs(logRows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, limit]);

  const groups = useMemo<TimelineGroup[]>(() => {
    return events.map((evt) => {
      const actions = logs.filter((l) => l.event_id === evt.id);
      let status: TimelineGroup["status"] = "neutral";
      if (actions.length > 0) {
        if (actions.some((a) => a.status === "failed")) status = "failed";
        else if (actions.every((a) => a.status === "completed")) status = "completed";
        else status = "pending";
      }
      return {
        event_id: evt.id,
        event_type: evt.type,
        created_at: evt.created_at,
        metadata: evt.metadata,
        actions,
        status,
      };
    });
  }, [events, logs]);

  const handleNavigate = (g: TimelineGroup) => {
    const projectId = g.metadata?.project_id as string | undefined;
    const documentId = g.metadata?.document_id as string | undefined;
    if (g.event_type === "DOCUMENT_UPLOADED" && documentId) {
      navigate(`/documents/${documentId}`);
    } else if (projectId) {
      navigate(`/projects/${projectId}`);
    } else if (g.event_type.startsWith("PROJECT_")) {
      navigate("/projects");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 px-5 py-4 rounded-lg border border-border/80 bg-card"
          >
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center rounded-lg border border-border/80 bg-card">
        <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mb-4">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-[15px] font-semibold text-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          Create a project or automation to see activity here.
        </p>
        <button
          onClick={() => navigate("/projects")}
          className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {/* Subtle vertical timeline line */}
      <div className="absolute left-[27px] top-3 bottom-3 w-px bg-border/60 pointer-events-none" />

      {groups.map((group) => {
        const EventIcon = eventIcons[group.event_type] ?? Zap;
        const isFailed = group.status === "failed";
        const isCompleted = group.status === "completed";
        const hasActions = group.actions.length > 0;

        const iconTone = isCompleted
          ? { bg: "bg-[hsl(160,84%,39%,0.1)]", text: "text-[hsl(160,84%,39%)]" }
          : isFailed
          ? { bg: "bg-[hsl(0,84%,60%,0.1)]", text: "text-[hsl(0,84%,60%)]" }
          : { bg: "bg-muted", text: "text-muted-foreground" };

        const leftBorder = isCompleted
          ? "border-l-2 border-l-[hsl(160,84%,39%)]"
          : isFailed
          ? "border-l-2 border-l-[hsl(0,84%,60%)]"
          : "";

        const statusBadge = isCompleted
          ? "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]"
          : isFailed
          ? "bg-[hsl(0,84%,60%,0.08)] text-[hsl(0,84%,60%)]"
          : "bg-muted text-muted-foreground";

        const canNavigate =
          !!group.metadata?.project_id ||
          !!group.metadata?.document_id ||
          group.event_type.startsWith("PROJECT_");

        return (
          <div
            key={group.event_id}
            onClick={canNavigate ? () => handleNavigate(group) : undefined}
            className={`relative rounded-lg border border-border/80 bg-card animate-in fade-in slide-in-from-bottom-1 duration-300 ${leftBorder} ${
              canNavigate ? "cursor-pointer hover:border-primary/30 hover:bg-accent/20 transition-colors" : ""
            }`}
          >
            <div className="flex items-start gap-4 px-5 py-4">
              <div
                className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background ${iconTone.bg}`}
              >
                <EventIcon className={`h-[18px] w-[18px] ${iconTone.text}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-foreground leading-tight">
                      {formatEvent(group.event_type, group.metadata)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {new Date(group.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {hasActions && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusBadge}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isFailed ? (
                        <XCircle className="h-3 w-3" />
                      ) : null}
                      {isCompleted ? "Completed" : isFailed ? "Failed" : "Pending"}
                    </span>
                  )}
                </div>

                {hasActions ? (
                  <ul className="mt-3 space-y-1.5">
                    {group.actions.map((a) => {
                      const ActionIcon = actionIcons[a.action_type] ?? FileText;
                      const aFailed = a.status === "failed";
                      const aPending = a.status !== "completed" && a.status !== "failed";
                      return (
                        <li
                          key={a.id}
                          className="flex items-center gap-2 text-[13px] text-muted-foreground"
                        >
                          <span className="text-muted-foreground/60 select-none">→</span>
                          <ActionIcon className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                          <span className="text-foreground/80">{formatAction(a.action_type)}</span>
                          {aFailed && (
                            <span className="text-[hsl(0,84%,60%)] font-medium">— Failed</span>
                          )}
                          {aPending && (
                            <span className="text-muted-foreground italic">— Pending</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12px] text-muted-foreground/70 italic">
                    No automations triggered
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
