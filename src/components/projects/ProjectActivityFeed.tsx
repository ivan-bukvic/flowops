import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName } from "@/lib/utils";
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
  Upload,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface EventRow {
  id: string;
  type: string;
  metadata: Record<string, any> | null;
  actor_user_id: string | null;
  created_at: string;
}

interface LogRow {
  id: string;
  status: string;
  event_id: string | null;
  action_type: string;
}

type EventTone = "success" | "danger" | "neutral";

const eventIcons: Record<string, React.ElementType> = {
  PROJECT_CREATED: FolderPlus,
  PROJECT_UPDATED: FolderEdit,
  PROJECT_DELETED: FolderMinus,
  PROJECT_MEMBER_ADDED: UserPlus,
  PROJECT_MEMBER_REMOVED: UserMinus,
  PROJECT_MEMBER_UPDATED: UserPlus,
  DOCUMENT_UPLOADED: Upload,
};

const eventVerbs: Record<string, string> = {
  PROJECT_CREATED: "created the project",
  PROJECT_UPDATED: "updated the project",
  PROJECT_DELETED: "deleted the project",
  PROJECT_MEMBER_ADDED: "added a member to the project",
  PROJECT_MEMBER_REMOVED: "removed a member from the project",
  PROJECT_MEMBER_UPDATED: "updated a member's role",
  DOCUMENT_UPLOADED: "uploaded a document",
};

const eventTones: Record<string, EventTone> = {
  PROJECT_CREATED: "success",
  PROJECT_UPDATED: "neutral",
  PROJECT_DELETED: "danger",
  PROJECT_MEMBER_ADDED: "success",
  PROJECT_MEMBER_REMOVED: "danger",
  PROJECT_MEMBER_UPDATED: "neutral",
  DOCUMENT_UPLOADED: "neutral",
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

function getEntityName(type: string, metadata: Record<string, any> | null): string | null {
  const m = metadata ?? {};
  if (type === "DOCUMENT_UPLOADED") return (m.document_name as string) ?? null;
  return null;
}

interface Props {
  orgId: string;
  projectId: string;
}

const ProjectActivityFeed = ({ orgId, projectId }: Props) => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, type, metadata, actor_user_id, created_at")
        .eq("org_id", orgId)
        .filter("metadata->>project_id", "eq", projectId)
        .order("created_at", { ascending: false });

      const rows = (data as EventRow[]) ?? [];

      const actorIds = [
        ...new Set(rows.map((e) => e.actor_user_id).filter(Boolean)),
      ] as string[];
      const nameMap: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", actorIds);
        (profiles ?? []).forEach((p: any) => {
          nameMap[p.id] = getDisplayName(p);
        });
      }

      let logRows: LogRow[] = [];
      if (rows.length > 0) {
        const eventIds = rows.map((e) => e.id);
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
        setEvents(rows);
        setActorNames(nameMap);
        setLogs(logRows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, projectId]);

  const grouped = useMemo(() => {
    return events.map((evt) => {
      const actions = logs.filter((l) => l.event_id === evt.id);
      let status: "completed" | "failed" | "pending" | "neutral" = "neutral";
      if (actions.length > 0) {
        if (actions.some((a) => a.status === "failed")) status = "failed";
        else if (actions.every((a) => a.status === "completed")) status = "completed";
        else status = "pending";
      }
      return { evt, actions, status };
    });
  }, [events, logs]);

  const sections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const buckets: { label: string; items: typeof grouped }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "Earlier", items: [] },
    ];

    grouped.forEach((g) => {
      const d = new Date(g.evt.created_at);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      if (dayStart.getTime() === today.getTime()) buckets[0].items.push(g);
      else if (dayStart.getTime() === yesterday.getTime()) buckets[1].items.push(g);
      else buckets[2].items.push(g);
    });

    return buckets.filter((b) => b.items.length > 0);
  }, [grouped]);

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
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-border/80 bg-card">
        <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mb-4">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-[15px] font-semibold text-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          Project activity will appear here as members, documents, and automations are added.
        </p>
      </div>
    );
  }

  const sections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const buckets: { label: string; items: typeof grouped }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "Earlier", items: [] },
    ];

    grouped.forEach((g) => {
      const d = new Date(g.evt.created_at);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      if (dayStart.getTime() === today.getTime()) buckets[0].items.push(g);
      else if (dayStart.getTime() === yesterday.getTime()) buckets[1].items.push(g);
      else buckets[2].items.push(g);
    });

    return buckets.filter((b) => b.items.length > 0);
  }, [grouped]);

  const renderCard = ({ evt, actions, status }: (typeof grouped)[number]) => {
    const Icon = eventIcons[evt.type] ?? Zap;
    const tone: EventTone = eventTones[evt.type] ?? "neutral";
    const actorLabel = evt.actor_user_id
      ? actorNames[evt.actor_user_id] ?? "Unknown User"
      : "System";
    const verb = eventVerbs[evt.type] ?? evt.type.replace(/_/g, " ").toLowerCase();
    const entityName = getEntityName(evt.type, evt.metadata);
    const hasActions = actions.length > 0;
    const isCompleted = status === "completed";
    const isFailed = status === "failed";

    const iconTone =
      tone === "success"
        ? { bg: "bg-[hsl(160,84%,39%,0.1)]", text: "text-[hsl(160,84%,39%)]" }
        : tone === "danger"
        ? { bg: "bg-[hsl(0,84%,60%,0.1)]", text: "text-[hsl(0,84%,60%)]" }
        : { bg: "bg-primary/10", text: "text-primary" };

    const leftBorder =
      tone === "success"
        ? "border-l-2 border-l-[hsl(160,84%,39%)]"
        : tone === "danger"
        ? "border-l-2 border-l-[hsl(0,84%,60%)]"
        : "border-l-2 border-l-primary/60";

    const statusBadge = isCompleted
      ? "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]"
      : isFailed
      ? "bg-[hsl(0,84%,60%,0.08)] text-[hsl(0,84%,60%)]"
      : "bg-muted text-muted-foreground";

    return (
      <div
        key={evt.id}
        className={`relative rounded-lg border border-border/80 bg-card ${leftBorder} hover:bg-accent/20 transition-colors`}
      >
        <div className="flex items-start gap-4 px-5 py-4">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${iconTone.bg}`}
          >
            <Icon className={`h-[18px] w-[18px] ${iconTone.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-foreground leading-snug">
                  <span className="font-semibold">{actorLabel}</span> {verb}
                  {entityName && (
                    <span className="font-semibold text-primary"> "{entityName}"</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {new Date(evt.created_at).toLocaleString("en-US", {
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

            {hasActions && (
              <ul className="mt-3 space-y-1.5">
                {actions.map((a) => {
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
                      <span className="text-foreground/80">
                        {actionLabels[a.action_type] ??
                          a.action_type.replace(/_/g, " ").toLowerCase()}
                      </span>
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
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {sections.map((section, idx) => (
        <div key={section.label} className={idx === 0 ? "" : "mt-7"}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
            {section.label}
          </h4>
          <div className="space-y-3">{section.items.map(renderCard)}</div>
        </div>
      ))}
    </div>
  );
};

export default ProjectActivityFeed;
