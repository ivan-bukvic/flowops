import { useEffect, useState, useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

interface ActivityRow {
  id: string;
  status: string;
  created_at: string;
  event_type: string;
  action_type: string;
  rule_id: string | null;
  event_id: string | null;
  result_json: any;
  last_error: string | null;
}

const statusStyles: Record<string, { classes: string; label: string }> = {
  completed: {
    classes: "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]",
    label: "Completed",
  },
  failed: {
    classes: "bg-[hsl(0,84%,60%,0.08)] text-[hsl(0,84%,60%)]",
    label: "Failed",
  },
  pending: {
    classes: "bg-muted text-muted-foreground",
    label: "Pending",
  },
  processing: {
    classes: "bg-[hsl(217,91%,60%,0.08)] text-[hsl(217,91%,60%)]",
    label: "Processing",
  },
};

const actionIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SLACK_MESSAGE: MessageSquare,
  GOOGLE_CALENDAR_EVENT: Calendar,
  WEBHOOK: Globe,
  LOG: FileText,
};

const eventLabels: Record<string, string> = {
  PROJECT_CREATED: "Project created",
  PROJECT_UPDATED: "Project updated",
  PROJECT_DELETED: "Project deleted",
  MEMBER_ADDED: "Member added",
  MEMBER_REMOVED: "Member removed",
  PROJECT_MEMBER_ADDED: "Project member added",
  PROJECT_MEMBER_REMOVED: "Project member removed",
  WORKSPACE_CREATED: "Workspace created",
  OWNERSHIP_TRANSFERRED: "Ownership transferred",
};

const actionLabels: Record<string, string> = {
  EMAIL: "Email sent",
  SLACK_MESSAGE: "Slack message sent",
  GOOGLE_CALENDAR_EVENT: "Calendar event created",
  WEBHOOK: "Webhook fired",
  LOG: "Logged",
};

const integrationLabels: Record<string, string> = {
  EMAIL: "Email",
  SLACK_MESSAGE: "Slack",
  GOOGLE_CALENDAR_EVENT: "Google Calendar",
  WEBHOOK: "Webhook",
  LOG: "System",
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
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [integrationFilter, setIntegrationFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const fetchActivity = useCallback(async () => {
    if (!selectedOrgId) return;
    setError(false);
    try {
      const { data, error: queryError } = await supabase
        .from("automation_logs")
        .select(
          "id, status, created_at, rule_id, event_id, result_json, last_error, automation_rules!inner(action_type, trigger_type, org_id), events(type)"
        )
        .eq("automation_rules.org_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (queryError) throw queryError;

      const mapped = (data ?? []).map((r: any) => ({
        id: r.id,
        status: r.status ?? "pending",
        created_at: r.created_at,
        event_type: r.events?.type ?? "—",
        action_type: r.automation_rules?.action_type ?? "—",
        rule_id: r.rule_id,
        event_id: r.event_id,
        result_json: r.result_json,
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

  // Filtered rows
  const filteredRows = rows.filter((row) => {
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (integrationFilter !== "all" && row.action_type !== integrationFilter)
      return false;
    if (eventFilter !== "all" && row.event_type !== eventFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const eventText = formatEvent(row.event_type).toLowerCase();
      const actionText = formatAction(row.action_type).toLowerCase();
      if (!eventText.includes(q) && !actionText.includes(q) && !row.status.includes(q))
        return false;
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
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-5 rounded-lg border border-border bg-card"
          >
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
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
            placeholder="Search automations..."
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
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={integrationFilter} onValueChange={setIntegrationFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Integration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Integrations</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="SLACK_MESSAGE">Slack</SelectItem>
            <SelectItem value="GOOGLE_CALENDAR_EVENT">Google Calendar</SelectItem>
            <SelectItem value="WEBHOOK">Webhook</SelectItem>
            <SelectItem value="LOG">System</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="PROJECT_CREATED">Project Created</SelectItem>
            <SelectItem value="PROJECT_UPDATED">Project Updated</SelectItem>
            <SelectItem value="PROJECT_DELETED">Project Deleted</SelectItem>
            <SelectItem value="MEMBER_ADDED">Member Added</SelectItem>
            <SelectItem value="MEMBER_REMOVED">Member Removed</SelectItem>
            <SelectItem value="PROJECT_MEMBER_ADDED">Project Member Added</SelectItem>
            <SelectItem value="PROJECT_MEMBER_REMOVED">Project Member Removed</SelectItem>
            <SelectItem value="WORKSPACE_CREATED">Workspace Created</SelectItem>
            <SelectItem value="OWNERSHIP_TRANSFERRED">Ownership Transferred</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-muted-foreground hover:text-foreground gap-1.5 h-9 px-3"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      {/* Empty state */}
      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mb-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {rows.length === 0
              ? "No automation activity yet"
              : "No results match your filters"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {rows.length === 0
              ? "Automation executions will appear here once triggered."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRows.map((row) => {
            const Icon = actionIcons[row.action_type] ?? FileText;
            const status = statusStyles[row.status] ?? statusStyles.pending;
            const isExpanded = expandedId === row.id;

            return (
              <div
                key={row.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  className="flex items-center gap-4 px-5 py-4 w-full text-left transition-colors hover:bg-accent/40"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-[18px] w-[18px] text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground leading-tight">
                      {formatEvent(row.event_type)}
                      <span className="text-muted-foreground font-normal text-sm">
                        {" → "}
                      </span>
                      <span className="text-muted-foreground font-normal text-sm">
                        {formatAction(row.action_type)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {new Date(row.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shrink-0 capitalize ${status.classes}`}
                  >
                    {status.label}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-muted/30">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <DetailItem label="Event Type" value={row.event_type} />
                      <DetailItem label="Action Type" value={row.action_type} />
                      <DetailItem
                        label="Integration"
                        value={integrationLabels[row.action_type] ?? row.action_type}
                      />
                      <DetailItem label="Status" value={row.status} />
                      <DetailItem
                        label="Rule ID"
                        value={row.rule_id ?? "—"}
                        mono
                      />
                      <DetailItem
                        label="Event ID"
                        value={row.event_id ?? "—"}
                        mono
                      />
                      <DetailItem
                        label="Execution Timestamp"
                        value={
                          row.created_at
                            ? new Date(row.created_at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "—"
                        }
                      />
                    </div>

                    {row.last_error && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-destructive mb-1">
                          Error Message
                        </p>
                        <div className="rounded-md bg-destructive/5 border border-destructive/10 px-3 py-2">
                          <p className="text-xs font-mono text-destructive whitespace-pre-wrap break-all">
                            {row.last_error}
                          </p>
                        </div>
                      </div>
                    )}

                    {row.result_json && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Result JSON
                        </p>
                        <div className="rounded-md bg-muted border border-border px-3 py-2 max-h-40 overflow-auto">
                          <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all">
                            {JSON.stringify(row.result_json, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DetailItem = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p
      className={`text-sm text-foreground mt-0.5 ${
        mono ? "font-mono text-xs break-all" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

export default AutomationActivity;
