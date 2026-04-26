import { useEffect, useState, useCallback } from "react";
import { triggerAutomations } from "@/lib/triggerAutomations";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import AutomationActivity from "@/components/automations/AutomationActivity";
import AutomationRuleBuilder from "@/components/automations/AutomationRuleBuilder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const [runningEdge, setRunningEdge] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  const handleRuleCreated = () => {
    fetchRules();
    setActiveTab("existing");
  };

  const handleExecuteAutomations = async () => {
    setRunningEdge(true);
    try {
      const res = await fetch(
        "https://spkpebxbkbksyezdnjpq.supabase.co/functions/v1/process-automation-logs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwa3BlYnhia2Jrc3llemRuanBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTUwNzAsImV4cCI6MjA4NzQzMTA3MH0.3qGZOFWAhUAfLM00ahcsbmSLG3hZZAxGU9FDZ2Iyi_s`,
          },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Automations executed", description: "Edge function completed successfully." });
      fetchRules();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRunningEdge(false);
    }
  };

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
    <main className="p-3 sm:p-6">
      <PageHeader
        title="Automations"
        description="Event-driven automation rules"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto gap-6">
          <TabsTrigger value="rules" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-1 text-[13px] font-semibold data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors">Builder</TabsTrigger>
          <TabsTrigger value="existing" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-1 text-[13px] font-semibold data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors">Rules</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-1 text-[13px] font-semibold data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <AutomationRuleBuilder onCreated={handleRuleCreated} />
        </TabsContent>
        <TabsContent value="existing">
          <DataTable
            columns={columns}
            data={rules}
            loading={loading}
            emptyIcon={Zap}
            emptyTitle="No automations yet"
            emptyDescription="Set up an automation to trigger actions from events."
            emptyActionLabel="Create Automation"
            emptyActionIcon={Zap}
            onEmptyAction={() => setActiveTab("rules")}
          />
        </TabsContent>
        <TabsContent value="activity">
          <AutomationActivity />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Automations;
