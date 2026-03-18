import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

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

  useEffect(() => {
    const fetchActivity = async () => {
      if (!selectedOrgId) return;
      setLoading(true);
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
      setLoading(false);
    };
    fetchActivity();
  }, [selectedOrgId]);

  const columns: Column<ActivityRow>[] = [
    {
      key: "created_at",
      header: "Time",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "event_type",
      header: "Event",
      render: (row) => <span className="text-sm font-mono font-medium">{row.event_type}</span>,
    },
    {
      key: "action_type",
      header: "Action",
      render: (row) => <span className="text-sm font-mono">{row.action_type}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (error) {
    return <p className="text-sm text-destructive py-8 text-center">Failed to load automation activity.</p>;
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      emptyMessage="No automation activity yet."
    />
  );
};

export default AutomationActivity;
