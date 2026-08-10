import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ColoredIcon from "@/components/shared/ColoredIcon";
import StatCard from "@/components/shared/StatCard";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban, FileText, Zap, Bot, Plus, Upload, Sparkles, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const { selectedOrgId } = useOrg();
  const { user } = useAuth();
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

  const fullName = (user?.user_metadata as any)?.full_name as string | undefined;
  const userName =
    (fullName?.trim().split(/\s+/)[0]) ||
    user?.email?.split("@")[0] ||
    "there";

  const metrics = [
    { label: "Projects", value: projectCount, suffix: "active", icon: FolderKanban, route: "/projects" },
    { label: "Documents", value: docCount, suffix: "uploaded", icon: FileText, route: "/documents" },
    { label: "Automations", value: automationCount, suffix: "active", icon: Zap, route: "/automations" },
    { label: "AI Queries", value: aiCount, suffix: "total", icon: Bot, route: "/ai" },
  ];

  const quickActions = [
    { label: "Create Project", icon: Plus, onClick: () => navigate("/projects") },
    { label: "Upload Document", icon: Upload, onClick: () => navigate("/documents") },
    { label: "Create Automation", icon: Zap, onClick: () => navigate("/automations") },
    { label: "Ask AI", icon: Sparkles, onClick: () => navigate("/ai") },
  ];

  return (
    <main className="p-3 sm:p-6 pt-3 sm:pt-4">
      {/* Welcome */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Here's what's happening in your workspace today.
        </p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {metrics.map((m) => (
          <button
            key={m.label}
            onClick={() => navigate(m.route)}
            className="text-left rounded-lg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <StatCard
              title={m.label}
              value={loading ? <Skeleton className="h-8 w-14" /> : m.value}
              suffix={loading ? undefined : m.suffix}
              icon={m.icon}
              iconBgClass="bg-transparent"
              iconColorClass="text-muted-foreground/40"
            />
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex items-center gap-3.5 px-5 py-4 rounded-lg border border-border/80 bg-card text-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] hover:border-primary/40 hover:bg-accent/30 transition-all duration-150 cursor-pointer group"
          >
            <ColoredIcon icon={action.icon} bgClass="bg-primary/10 group-hover:bg-primary/15" iconClass="text-primary" size="sm" />
            <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity Timeline */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Latest events and automation activity in your workspace
          </p>
        </div>
        <button
          onClick={() => navigate("/events")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {selectedOrgId && <ActivityTimeline orgId={selectedOrgId} />}
    </main>
  );
};

export default Dashboard;
