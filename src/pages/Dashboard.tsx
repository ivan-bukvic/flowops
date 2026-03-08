import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, FileText, Zap, Bot, Plus, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EventRow {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const Dashboard = () => {
  const { selectedOrgId } = useOrg();
  const navigate = useNavigate();
  const [projectCount, setProjectCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [automationCount, setAutomationCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedOrgId) return;

    const fetchStats = async () => {
      setLoading(true);

      const [projects, docs, automations, ai, events] = await Promise.all([
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("org_id", selectedOrgId)
          .is("deleted_at", null),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("org_id", selectedOrgId)
          .is("deleted_at", null),
        supabase
          .from("automation_rules")
          .select("id", { count: "exact", head: true })
          .eq("org_id", selectedOrgId)
          .is("deleted_at", null),
        supabase
          .from("ai_queries")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("events")
          .select("id, type, metadata, created_at")
          .eq("org_id", selectedOrgId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setProjectCount(projects.count ?? 0);
      setDocCount(docs.count ?? 0);
      setAutomationCount(automations.count ?? 0);
      setAiCount(ai.count ?? 0);
      setRecentEvents((events.data as EventRow[]) ?? []);
      setLoading(false);
    };

    fetchStats();
  }, [selectedOrgId]);

  return (
    <main className="p-6">
      <PageHeader title="Dashboard" description="Overview of your workspace activity" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Projects" value={loading ? "—" : projectCount} icon={FolderKanban} />
        <StatCard title="Documents" value={loading ? "—" : docCount} icon={FileText} />
        <StatCard title="Automations" value={loading ? "—" : automationCount} icon={Zap} />
        <StatCard title="AI Queries" value={loading ? "—" : aiCount} icon={Bot} />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" onClick={() => navigate("/projects")}>
          <Plus className="h-4 w-4" />
          <span className="text-xs">Create Project</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" onClick={() => navigate("/documents")}>
          <Upload className="h-4 w-4" />
          <span className="text-xs">Upload Document</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" onClick={() => navigate("/automations")}>
          <Zap className="h-4 w-4" />
          <span className="text-xs">Create Automation</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" onClick={() => navigate("/ai")}>
          <Sparkles className="h-4 w-4" />
          <span className="text-xs">Ask AI</span>
        </Button>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">Recent Activity</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : recentEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="space-y-2">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {evt.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>
                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {JSON.stringify(evt.metadata)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Dashboard;
