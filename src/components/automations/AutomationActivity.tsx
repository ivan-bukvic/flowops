import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Zap, Mail, Bell, MessageSquare, Calendar, Webhook } from "lucide-react";

interface ActivityRow {
  id: string;
  status: string;
  created_at: string;
  event_type: string;
  action_type: string;
}

const statusStyles: Record<string, { classes: string; label: string }> = {
  completed: { classes: "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]", label: "Completed" },
  failed: { classes: "bg-[hsl(0,84%,60%,0.08)] text-[hsl(0,84%,60%)]", label: "Failed" },
  pending: { classes: "bg-muted text-muted-foreground", label: "Pending" },
  processing: { classes: "bg-[hsl(217,91%,60%,0.08)] text-[hsl(217,91%,60%)]", label: "Processing" },
};

const actionIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SLACK_MESSAGE: MessageSquare,
  GOOGLE_CALENDAR_EVENT: Calendar,
  WEBHOOK: Webhook,
  LOG: Activity,
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

const formatEvent = (type: string) => eventLabels[type] ?? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const formatAction = (type: string) => actionLabels[type] ?? type.replace(/_/g, " ").toLowerCase();

const AutomationActivity = () => {
  const { selectedOrgId } = useOrg();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!selectedOrgId) return;
    setError(false);
    try {
      const { data, error: queryError } = await supabase
        .from("automation_logs")
        .select("id, status, created_at, automation_rules!inner(action_type, trigger_type, org_id), events(type)")
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

  if (error) {
    return <p className="text-sm text-destructive py-8 text-center">Failed to load automation activity.</p>;
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-lg border border-border bg-card">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No automation activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">Run an automation to see activity here.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      <div className="space-y-2.5">
        {rows.map((row, index) => {
          const Icon = actionIcons[row.action_type] ?? Zap;
          const status = statusStyles[row.status] ?? statusStyles.pending;
          const isFirst = index === 0;

          return (
            <div
              key={row.id}
              className={`flex items-center gap-4 px-5 py-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors ${
                isFirst ? "ring-1 ring-primary/10" : ""
              }`}
            >
              <div className="h-9 w-9 rounded-lg border border-border bg-muted/50 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {formatEvent(row.event_type)}
                  <span className="text-muted-foreground font-normal"> → </span>
                  <span className="text-muted-foreground font-normal">{formatAction(row.action_type)}</span>
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
                className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md shrink-0 capitalize ${status.classes}`}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AutomationActivity;
