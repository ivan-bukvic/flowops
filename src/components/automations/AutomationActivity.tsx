import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Activity,
  Mail,
  MessageSquare,
  Calendar,
  Globe,
  FileText,
  Search,
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

interface LogRow {
  id: string;
  status: string;
  created_at: string;
  event_type: string;
  action_type: string;
  event_id: string | null;
  last_error: string | null;
}

interface TimelineGroup {
  event_id: string;
  event_type: string;
  created_at: string;
  actions: LogRow[];
  status: "completed" | "failed" | "pending";
}

const actionIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SLACK_MESSAGE: MessageSquare,
  GOOGLE_CALENDAR_EVENT: Calendar,
  WEBHOOK: Globe,
  LOG: FileText,
};

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

const actionLabels: Record<string, string> = {
  EMAIL: "Email sent",
  SLACK_MESSAGE: "Slack message sent",
  GOOGLE_CALENDAR_EVENT: "Calendar event created",
  WEBHOOK: "Webhook fired",
  LOG: "Logged",
};

const formatEvent = (type: string) =>
  eventLabels[type] ??
  type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatAction = (type: string) =>
  actionLabels[type] ?? type.replace(/_/g, " ").toLowerCase();

const AutomationActivity = () => {
  const { selectedOrgId } = useOrg();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const fetchActivity = useCallback(async () => {
    if (!selectedOrgId) return;
    setError(false);
    try {
      const { data, error: queryError } = await supabase
        .from("automation_logs")
        .select(
          "id, status, created_at, event_id, last_error, automation_rules!inner(action_type, org_id), events(type)"
        )
        .eq("automation_rules.org_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (queryError) throw queryError;

      const mapped = (data ?? []).map((r: any) => ({
        id: r.id,
        status: r.status ?? "pending",
        created_at: r.created_at,
        event_type: r.events?.type ?? "—",
        action_type: r.automation_rules?.action_type ?? "—",
        event_id: r.event_id,
        last_error: r.last_error,
      }));
      setRows(mapped);
    } catch {
      setError(true);
      setRows([]);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    setLoading(true);
    fetchActivity().finally(() => setLoading(false));
  }, [fetchActivity]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivity();
    setRefreshing(false);
  };

  // Group logs by event_id
  const groups = useMemo<TimelineGroup[]>(() => {
    const map = new Map<string, TimelineGroup>();
    for (const row of rows) {
      const key = row.event_id ?? row.id;
      if (!map.has(key)) {
        map.set(key, {
          event_id: key,
          event_type: row.event_type,
          created_at: row.created_at,
          actions: [],
          status: "completed",
        });
      }
      const g = map.get(key)!;
      g.actions.push(row);
      // earliest event time = use the latest created_at as group time (newest first already)
      if (new Date(row.created_at).getTime() > new Date(g.created_at).getTime()) {
        g.created_at = row.created_at;
      }
    }
    // Determine overall status
    for (const g of map.values()) {
      if (g.actions.some((a) => a.status === "failed")) g.status = "failed";
      else if (g.actions.every((a) => a.status === "completed")) g.status = "completed";
      else g.status = "pending";
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [rows]);

  const filteredGroups = groups.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (eventFilter !== "all" && g.event_type !== eventFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const eventText = formatEvent(g.event_type).toLowerCase();
      const actionsText = g.actions.map((a) => formatAction(a.action_type).toLowerCase()).join(" ");
      if (!eventText.includes(q) && !actionsText.includes(q)) return false;
    }
    return true;
  });

  if (error) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        Failed to load automation activity.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 px-5 py-5 rounded-lg border border-border bg-card"
          >
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-22 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 rounded-lg border border-border bg-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search timeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {Object.entries(eventLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-muted-foreground hover:text-foreground gap-1.5 h-9 px-3"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      {/* Empty state */}
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mb-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {groups.length === 0 ? "No automation activity yet" : "No results match your filters"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {groups.length === 0
              ? "Automation executions will appear here once triggered."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="relative space-y-3">
          {/* Subtle vertical timeline line */}
          <div className="absolute left-[27px] top-3 bottom-3 w-px bg-border/60 pointer-events-none" />

          {filteredGroups.map((group) => {
            const EventIcon = eventIcons[group.event_type] ?? Zap;
            const isFailed = group.status === "failed";
            const isCompleted = group.status === "completed";

            const iconTone = isCompleted
              ? { bg: "bg-[hsl(160,84%,39%,0.1)]", text: "text-[hsl(160,84%,39%)]", ring: "ring-[hsl(160,84%,39%,0.2)]" }
              : isFailed
              ? { bg: "bg-[hsl(0,84%,60%,0.1)]", text: "text-[hsl(0,84%,60%)]", ring: "ring-[hsl(0,84%,60%,0.2)]" }
              : { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border" };

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

            return (
              <div
                key={group.event_id}
                className={`relative rounded-lg border border-border bg-card animate-in fade-in slide-in-from-bottom-1 duration-300 ${leftBorder}`}
              >
                <div className="flex items-start gap-4 px-5 py-4">
                  {/* Event icon */}
                  <div
                    className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background ${iconTone.bg}`}
                  >
                    <EventIcon className={`h-[18px] w-[18px] ${iconTone.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-foreground leading-tight">
                          {formatEvent(group.event_type)}
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
                    </div>

                    {/* Actions */}
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AutomationActivity;
