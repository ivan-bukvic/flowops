import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

const WEEKS = 6;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Bucket a list of ISO timestamps into WEEKS trailing weekly bins (oldest→newest). */
function toWeeklySeries(dates: (string | null)[]): number[] {
  const now = Date.now();
  const bins = new Array(WEEKS).fill(0);
  for (const d of dates) {
    if (!d) continue;
    const diff = now - new Date(d).getTime();
    if (diff < 0) continue;
    const weeksAgo = Math.floor(diff / WEEK_MS);
    if (weeksAgo < WEEKS) bins[WEEKS - 1 - weeksAgo] += 1;
  }
  return bins;
}

const Dashboard = () => {
  const { selectedOrgId } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectCount, setProjectCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [automationCount, setAutomationCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [series, setSeries] = useState<Record<string, number[]>>({});
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

    // Read-only, additive fetch that powers the mini bar charts with real data.
    const fetchSeries = async () => {
      const [projects, docs, automations, ai] = await Promise.all([
        supabase.from("projects").select("created_at").eq("org_id", selectedOrgId).is("deleted_at", null),
        supabase.from("documents").select("created_at").eq("org_id", selectedOrgId).is("deleted_at", null),
        supabase.from("automation_rules").select("created_at").eq("org_id", selectedOrgId).is("deleted_at", null),
        supabase.from("ai_queries").select("created_at"),
      ]);
      type CreatedRow = { created_at: string | null };
      const pick = (rows: CreatedRow[] | null) => (rows ?? []).map((r) => r.created_at);
      setSeries({
        Projects: toWeeklySeries(pick(projects.data as CreatedRow[] | null)),
        Documents: toWeeklySeries(pick(docs.data as CreatedRow[] | null)),
        Automations: toWeeklySeries(pick(automations.data as CreatedRow[] | null)),
        "AI Queries": toWeeklySeries(pick(ai.data as CreatedRow[] | null)),
      });
    };

    fetchStats();
    fetchSeries();
  }, [selectedOrgId]);

  const fullName = (user?.user_metadata as any)?.full_name as string | undefined;
  const userName =
    (fullName?.trim().split(/\s+/)[0]) ||
    user?.email?.split("@")[0] ||
    "there";

  const metrics = [
    {
      label: "Projects", value: projectCount, suffix: "active", icon: FolderKanban, route: "/projects",
      accentText: "text-primary", accentBg: "bg-primary/10", accentBar: "bg-primary",
    },
    {
      label: "Documents", value: docCount, suffix: "uploaded", icon: FileText, route: "/documents",
      accentText: "text-info", accentBg: "bg-info/10", accentBar: "bg-info",
    },
    {
      label: "Automations", value: automationCount, suffix: "active", icon: Zap, route: "/automations",
      accentText: "text-automation", accentBg: "bg-automation/10", accentBar: "bg-automation",
    },
    {
      label: "AI Queries", value: aiCount, suffix: "total", icon: Bot, route: "/ai",
      accentText: "text-slack", accentBg: "bg-slack/10", accentBar: "bg-slack",
    },
  ];

  const quickActions = [
    { label: "Create Project", icon: Plus, onClick: () => navigate("/projects"), text: "text-primary", bg: "bg-primary/10" },
    { label: "Upload Document", icon: Upload, onClick: () => navigate("/documents"), text: "text-info", bg: "bg-info/10" },
    { label: "Create Automation", icon: Zap, onClick: () => navigate("/automations"), text: "text-automation", bg: "bg-automation/10" },
    { label: "Ask AI", icon: Sparkles, onClick: () => navigate("/ai"), text: "text-slack", bg: "bg-slack/10" },
  ];

  return (
    <main className="p-3 sm:p-6 pt-3 sm:pt-4">
      {/* Welcome */}
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening in your workspace today.
        </p>
      </header>

      {/* Metrics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const data = series[m.label];
          const hasSeries = data && data.some((n) => n > 0);
          const recent = hasSeries ? data![data!.length - 1] : 0;
          return (
            <button
              key={m.label}
              onClick={() => navigate(m.route)}
              className="text-left rounded-2xl transition-all duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <StatCard
                title={m.label}
                value={loading ? <Skeleton className="h-7 w-12" /> : m.value}
                suffix={loading ? undefined : m.suffix}
                icon={m.icon}
                accentText={m.accentText}
                accentBg={m.accentBg}
                accentBar={m.accentBar}
                series={hasSeries ? data : undefined}
                trend={!loading && recent > 0 ? `+${recent} this week` : undefined}
              />
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="group flex items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-foreground shadow-card transition-all duration-150 hover:shadow-card-hover"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.bg} ${action.text}`}>
              <action.icon className="h-4 w-4" />
            </span>
            <span className="text-[13.5px] font-semibold">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity Timeline */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Recent activity</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Latest events and automation activity in your workspace
          </p>
        </div>
        <button
          onClick={() => navigate("/events")}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
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
