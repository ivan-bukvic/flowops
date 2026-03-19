import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import StatusBadge from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActivityRow {
  id: string;
  status: string;
  created_at: string;
  event_type: string;
  action_type: string;
}

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
      <div className="mt-4 border border-border rounded-[10px] overflow-hidden bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="py-4"><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="py-4"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="py-4"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="py-4"><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Activity className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No automation activity yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Run an automation to see activity here
        </p>
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
      <div className="border border-border rounded-[10px] overflow-hidden bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="py-4">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {new Date(row.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-sm font-mono font-medium text-foreground">{row.event_type}</span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-sm font-mono text-muted-foreground">{row.action_type}</span>
                </TableCell>
                <TableCell className="py-4">
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AutomationActivity;
