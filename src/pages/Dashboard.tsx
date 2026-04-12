import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/shared/StatCard";
import ColoredIcon from "@/components/shared/ColoredIcon";
import RecentActivity from "@/components/dashboard/RecentActivity";
import {
  FolderKanban, FileText, Zap, Bot, Plus, Upload, Sparkles, LayoutDashboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { selectedOrgId } = useOrg();
  const navigate = useNavigate();
  const [projectCount, setProjectCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [automationCount, setAutomationCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedOrgId) return;

    const fetchStats = async () => {
      setLoading(true);

      const [projects, docs, automations, ai] = await Promise.all([
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
      ]);

      setProjectCount(projects.count ?? 0);
      setDocCount(docs.count ?? 0);
      setAutomationCount(automations.count ?? 0);
      setAiCount(ai.count ?? 0);
      setLoading(false);
    };

    fetchStats();
  }, [selectedOrgId]);

  const quickActions = [
    { label: "Create Project", icon: Plus, onClick: () => navigate("/projects"), bgClass: "bg-indigo-50", iconClass: "text-indigo-600" },
    { label: "Upload Document", icon: Upload, onClick: () => navigate("/documents"), bgClass: "bg-sky-50", iconClass: "text-sky-500" },
    { label: "Create Automation", icon: Zap, onClick: () => navigate("/automations"), bgClass: "bg-amber-50", iconClass: "text-amber-500" },
    { label: "Ask AI", icon: Sparkles, onClick: () => navigate("/ai"), bgClass: "bg-violet-50", iconClass: "text-violet-600" },
  ];

  const statusParts: string[] = [];
  if (!loading) {
    if (projectCount > 0) statusParts.push(`${projectCount} project${projectCount !== 1 ? "s" : ""}`);
    if (automationCount > 0) statusParts.push(`${automationCount} automation${automationCount !== 1 ? "s" : ""} active`);
    if (docCount > 0) statusParts.push(`${docCount} document${docCount !== 1 ? "s" : ""}`);
  }

  return (
    <main className="p-6 pt-4">
      {/* Hero Banner */}
      <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-7 py-6 mb-8 flex items-center gap-5">
        <ColoredIcon icon={LayoutDashboard} bgClass="bg-blue-100" iconClass="text-blue-600" />
        <div>
          <h1 className="text-lg font-bold text-foreground">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {loading
              ? "Loading workspace…"
              : statusParts.length > 0
                ? statusParts.join(" · ")
                : "Your workspace is ready. Get started below."}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
        <StatCard title="Projects" value={loading ? "—" : projectCount} icon={FolderKanban} iconBgClass="bg-indigo-50" iconColorClass="text-indigo-600" />
        <StatCard title="Documents" value={loading ? "—" : docCount} icon={FileText} iconBgClass="bg-sky-50" iconColorClass="text-sky-500" />
        <StatCard title="Automations" value={loading ? "—" : automationCount} icon={Zap} iconBgClass="bg-amber-50" iconColorClass="text-amber-500" />
        <StatCard title="AI Queries" value={loading ? "—" : aiCount} icon={Bot} iconBgClass="bg-violet-50" iconColorClass="text-violet-600" />
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/80 mb-5">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-14">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex items-center gap-3.5 px-5 py-4 rounded-lg border border-border/80 bg-card text-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] hover:border-primary/40 hover:bg-accent/30 transition-all duration-150 cursor-pointer group"
          >
            <ColoredIcon icon={action.icon} bgClass={`${action.bgClass} group-hover:bg-primary/10`} iconClass={`${action.iconClass} group-hover:text-primary`} size="sm" />
            <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/80 mb-5">Recent Activity</h2>
      {selectedOrgId && <RecentActivity orgId={selectedOrgId} loading={loading} />}
    </main>
  );
};

export default Dashboard;
