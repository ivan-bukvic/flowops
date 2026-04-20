import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ColoredIcon from "@/components/shared/ColoredIcon";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import {
  FolderKanban, FileText, Zap, Bot, Plus, Upload, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { selectedOrgId, organizations } = useOrg();
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

  const currentWorkspace = organizations.find((o) => o.id === selectedOrgId)?.name;

  const metrics = [
    { label: "Projects", value: projectCount, suffix: "active", icon: FolderKanban, route: "/projects" },
    { label: "Documents", value: docCount, suffix: "uploaded", icon: FileText, route: "/documents" },
    { label: "Automations", value: automationCount, suffix: "active", icon: Zap, route: "/automations" },
    { label: "AI Queries", value: aiCount, suffix: "total", icon: Bot, route: "/ai" },
  ];

  const quickActions = [
    { label: "Create Project", icon: Plus, onClick: () => navigate("/projects"), bgClass: "bg-indigo-50", iconClass: "text-indigo-600" },
    { label: "Upload Document", icon: Upload, onClick: () => navigate("/documents"), bgClass: "bg-sky-50", iconClass: "text-sky-500" },
    { label: "Create Automation", icon: Zap, onClick: () => navigate("/automations"), bgClass: "bg-amber-50", iconClass: "text-amber-500" },
    { label: "Ask AI", icon: Sparkles, onClick: () => navigate("/ai"), bgClass: "bg-violet-50", iconClass: "text-violet-600" },
  ];

  const dotPatternStyle = {
    backgroundImage:
      "radial-gradient(circle, hsl(var(--primary) / 0.13) 1px, transparent 1px)",
    backgroundSize: "15px 15px",
    WebkitMaskImage:
      "linear-gradient(to right, black 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 88%, transparent 100%)",
    maskImage:
      "linear-gradient(to right, black 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 88%, transparent 100%)",
  };

  return (
    <main className="p-6 pt-4">
      {/* Dotted background wrapper for Welcome + Quick Actions */}
      <div
        className="rounded-xl p-6 mb-10"
        style={dotPatternStyle}
      >
      {/* Welcome + System Overview Card */}
      <section className="rounded-lg border border-border/80 bg-card p-7 mb-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Welcome back, {userName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's what's happening in your workspace
            </p>
          </div>
          {currentWorkspace && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/80 bg-background">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-foreground/80">{currentWorkspace}</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <button
              key={m.label}
              onClick={() => navigate(m.route)}
              className="flex items-center gap-3.5 rounded-lg border border-border/80 bg-card p-4 text-left hover:border-primary/40 hover:bg-accent/30 transition-all duration-150 cursor-pointer group"
            >
              <ColoredIcon
                icon={m.icon}
                bgClass="bg-muted/60 group-hover:bg-primary/10"
                iconClass="text-muted-foreground/70 group-hover:text-primary"
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums leading-tight mt-0.5">
                  {loading ? "—" : `${m.value} `}
                  <span className="text-xs font-normal text-muted-foreground">
                    {loading ? "" : m.suffix}
                  </span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/80 mb-5">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
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
      </div>
      {/* end dotted background wrapper */}

      <div className="mb-14" />

      {/* Recent Activity Timeline */}
      <div className="mb-2 mt-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/80">Recent Activity</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-5">
          Latest events and automation activity in your workspace
        </p>
      </div>
      {selectedOrgId && <ActivityTimeline orgId={selectedOrgId} />}
    </main>
  );
};

export default Dashboard;
