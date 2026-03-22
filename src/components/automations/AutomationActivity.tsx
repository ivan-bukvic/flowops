import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Zap, Mail, Bell } from "lucide-react";

interface ActivityRow {
  id: string;
  status: string;
  created_at: string;
  event_type: string;
  action_type: string;
}

const statusStyles: Record<string, string> = {
  completed: "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]",
  failed: "bg-[hsl(0,84%,60%,0.08)] text-[hsl(0,84%,60%)]",
  pending: "bg-muted text-muted-foreground",
  processing: "bg-[hsl(217,91%,60%,0.08)] text-[hsl(217,91%,60%)]",
};

const actionIcons: Record<string, typeof Mail> = {
  email: Mail,
  notification: Bell,
};

const formatEventType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-lg border border-border bg-card">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
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

      <div className="space-y-2">
        {rows.map((row, index) => {
          const ActionIcon = actionIcons[row.action_type] ?? Zap;
          const isFirst = index === 0;

          return (
            <div
              key={row.id}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors ${
                isFirst ? "ring-1 ring-primary/10" : ""
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ActionIcon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatEventType(row.event_type)}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {row.action_type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
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
                className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md shrink-0 ${
                  statusStyles[row.status] ?? statusStyles.pending
                }`}
              >
                {row.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AutomationActivity;
