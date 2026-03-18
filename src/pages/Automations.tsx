import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import AutomationActivity from "@/components/automations/AutomationActivity";
import AutomationRuleBuilder from "@/components/automations/AutomationRuleBuilder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AutomationLog {
  status: string | null;
  created_at: string | null;
}

interface AutomationRow {
  id: string;
  trigger_type: string;
  action_type: string;
  config_json: Record<string, any> | null;
  created_at: string | null;
  last_run?: string | null;
  last_status?: string | null;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const Automations = () => {
  const { selectedOrgId } = useOrg();
  const [rules, setRules] = useState<AutomationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("automation_rules")
      .select("id, trigger_type, action_type, config_json, created_at, automation_logs(status, created_at)")
      .eq("org_id", selectedOrgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setRules(
      ((data as any[]) ?? []).map((r) => {
        const logs: AutomationLog[] = Array.isArray(r.automation_logs) ? r.automation_logs : [];
        const sorted = logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
          ...r,
          last_run: sorted[0]?.created_at ?? null,
          last_status: sorted[0]?.status ?? null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [selectedOrgId]);

  const columns: Column<AutomationRow>[] = [
    {
      key: "trigger_type",
      header: "Trigger",
      render: (row) => <span className="text-sm font-medium font-mono">{row.trigger_type}</span>,
    },
    {
      key: "action_type",
      header: "Action",
      render: (row) => <span className="text-sm font-mono">{row.action_type}</span>,
    },
    {
      key: "last_run",
      header: "Last Run",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.last_run ? formatTimeAgo(new Date(row.last_run)) : "Never"}
        </span>
      ),
    },
    {
      key: "last_status",
      header: "Status",
      render: (row) => <StatusBadge status={row.last_status ?? "inactive"} />,
    },
  ];

  return (
    <main className="p-6">
      <PageHeader
        title="Automations"
        description="Event-driven automation rules"
      />

      <Tabs defaultValue="rules" className="mt-4">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="existing">Existing Rules</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <AutomationRuleBuilder onCreated={fetchRules} />
        </TabsContent>
        <TabsContent value="existing">
          <DataTable columns={columns} data={rules} loading={loading} emptyMessage="No automation rules yet." />
        </TabsContent>
        <TabsContent value="activity">
          <AutomationActivity />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Automations;
