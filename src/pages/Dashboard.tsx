import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import {
  FolderKanban, FileText, Zap, Bot, Plus, Upload, Sparkles,
  UserPlus, UserMinus, FolderPlus, FolderEdit, Trash2, ArrowRightLeft, Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventRow {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_user_id: string | null;
}

const eventConfig: Record<string, { icon: React.ElementType; label: string }> = {
  PROJECT_CREATED: { icon: FolderPlus, label: "Project created" },
  PROJECT_UPDATED: { icon: FolderEdit, label: "Project updated" },
  PROJECT_DELETED: { icon: Trash2, label: "Project deleted" },
  MEMBER_ADDED: { icon: UserPlus, label: "Member added" },
  MEMBER_REMOVED: { icon: UserMinus, label: "Member removed" },
  PROJECT_MEMBER_ADDED: { icon: UserPlus, label: "Member added to project" },
  PROJECT_MEMBER_REMOVED: { icon: UserMinus, label: "Member removed from project" },
  WORKSPACE_CREATED: { icon: Building2, label: "Workspace created" },
  OWNERSHIP_TRANSFERRED: { icon: ArrowRightLeft, label: "Ownership transferred" },
};

function getEmail(m: Record<string, unknown>): string | null {
  return (m.email ?? m.user_email ?? m.member_email ?? null) as string | null;
}

function getRole(m: Record<string, unknown>): string | null {
  const r = (m.role ?? m.member_role ?? null) as string | null;
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : null;
}

function describeEvent(type: string, metadata: Record<string, unknown>): { title: string; detail: string | null } {
  const m = metadata ?? {};
  const email = getEmail(m);
  const role = getRole(m);
  const projectName = (m.project_name as string) ?? null;

  const detailParts: string[] = [];
  if (email) detailParts.push(`User: ${email}`);
  if (role) detailParts.push(`Role: ${role}`);
  const detail = detailParts.length > 0 ? detailParts.join(" · ") : null;

  switch (type) {
    case "PROJECT_CREATED":
      return { title: `Project created: ${projectName ?? "Untitled"}`, detail };
    case "PROJECT_UPDATED":
      return { title: `Project updated: ${projectName ?? "Untitled"}`, detail };
    case "PROJECT_DELETED":
      return { title: `Project deleted: ${projectName ?? "Untitled"}`, detail };
    case "MEMBER_ADDED":
      return { title: "Member added to workspace", detail };
    case "MEMBER_REMOVED":
      return { title: "Member removed from workspace", detail };
    case "PROJECT_MEMBER_ADDED":
      return { title: `Member added to ${projectName ?? "project"}`, detail };
    case "PROJECT_MEMBER_REMOVED":
      return { title: `Member removed from ${projectName ?? "project"}`, detail };
    case "WORKSPACE_CREATED":
      return { title: `Workspace created: ${(m.org_name as string) ?? "Untitled"}`, detail };
    case "OWNERSHIP_TRANSFERRED":
      return {
        title: "Ownership transferred",
        detail: m.new_owner_email ? `New owner: ${m.new_owner_email}` : detail,
      };
    default:
      return {
        title: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        detail,
      };
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
          .select("id, type, metadata, created_at, actor_user_id")
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

  const quickActions = [
    { label: "Create Project", icon: Plus, onClick: () => navigate("/projects") },
    { label: "Upload Document", icon: Upload, onClick: () => navigate("/documents") },
    { label: "Create Automation", icon: Zap, onClick: () => navigate("/automations") },
    { label: "Ask AI", icon: Sparkles, onClick: () => navigate("/ai") },
  ];

  return (
    <main className="p-6">
      <PageHeader title="Dashboard" description="Overview of your workspace activity" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard title="Projects" value={loading ? "—" : projectCount} icon={FolderKanban} />
        <StatCard title="Documents" value={loading ? "—" : docCount} icon={FileText} />
        <StatCard title="Automations" value={loading ? "—" : automationCount} icon={Zap} />
        <StatCard title="AI Queries" value={loading ? "—" : aiCount} icon={Bot} />
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-medium text-foreground mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2.5 p-5 rounded-lg border border-border bg-card text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
          >
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <action.icon className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <span className="text-[13px] font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 className="text-sm font-medium text-foreground mb-3">Recent Activity</h2>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-lg border border-border bg-card animate-pulse">
              <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-48 bg-muted rounded" />
                <div className="h-3 w-28 bg-muted rounded" />
              </div>
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : recentEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border bg-card">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-1">Activity will appear here as you use your workspace.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentEvents.map((evt) => {
            const config = eventConfig[evt.type] ?? { icon: Zap, label: evt.type };
            const Icon = config.icon;
            const { title, details } = describeEvent(evt.type, evt.metadata);

            return (
              <div
                key={evt.id}
                className="flex items-start gap-4 px-5 py-4 rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground leading-tight">{title}</p>
                  {details.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {details.map((d, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{d}</p>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                  {timeAgo(evt.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Dashboard;
