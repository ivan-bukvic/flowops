import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ColoredIcon from "@/components/shared/ColoredIcon";
import {
  FolderPlus, Pencil, Trash2, UserPlus, UserMinus, Building2, Crown, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EventRow {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_user_id: string | null;
}

type EventCategory = "member" | "project" | "workspace" | "automation";

const categoryStyles: Record<EventCategory, { bg: string; text: string }> = {
  member: { bg: "bg-blue-500/10", text: "text-blue-600" },
  project: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  workspace: { bg: "bg-amber-500/10", text: "text-amber-600" },
  automation: { bg: "bg-violet-500/10", text: "text-violet-600" },
};

const categoryLabels: Record<EventCategory, string> = {
  member: "Member",
  project: "Project",
  workspace: "Workspace",
  automation: "Automation",
};

const eventConfig: Record<string, { icon: LucideIcon; verb: string; category: EventCategory }> = {
  PROJECT_CREATED: { icon: FolderPlus, verb: "created the project", category: "project" },
  PROJECT_UPDATED: { icon: Pencil, verb: "updated the project", category: "project" },
  PROJECT_DELETED: { icon: Trash2, verb: "deleted the project", category: "project" },
  MEMBER_ADDED: { icon: UserPlus, verb: "added a member to the workspace", category: "member" },
  MEMBER_REMOVED: { icon: UserMinus, verb: "removed a member from the workspace", category: "member" },
  PROJECT_MEMBER_ADDED: { icon: UserPlus, verb: "added a member to", category: "member" },
  PROJECT_MEMBER_REMOVED: { icon: UserMinus, verb: "removed a member from", category: "member" },
  WORKSPACE_CREATED: { icon: Building2, verb: "created the workspace", category: "workspace" },
  OWNERSHIP_TRANSFERRED: { icon: Crown, verb: "transferred workspace ownership", category: "workspace" },
};

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

function getEntityName(type: string, metadata: Record<string, unknown>): string | null {
  const m = metadata ?? {};
  switch (type) {
    case "PROJECT_CREATED":
    case "PROJECT_UPDATED":
    case "PROJECT_DELETED":
    case "PROJECT_MEMBER_ADDED":
    case "PROJECT_MEMBER_REMOVED":
      return (m.project_name as string) ?? null;
    case "WORKSPACE_CREATED":
      return (m.org_name as string) ?? null;
    default:
      return null;
  }
}

function getSecondaryDetail(type: string, metadata: Record<string, unknown>): string | null {
  const m = metadata ?? {};
  const role = (m.role ?? m.member_role) as string | null;
  switch (type) {
    case "PROJECT_MEMBER_ADDED":
    case "PROJECT_MEMBER_REMOVED":
    case "MEMBER_ADDED":
    case "MEMBER_REMOVED":
      return role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Role` : null;
    case "OWNERSHIP_TRANSFERRED":
      return m.new_owner_email ? `New owner: ${m.new_owner_email}` : null;
    default:
      return null;
  }
}

interface RecentActivityProps {
  orgId: string;
}

const RecentActivity = ({ orgId }: RecentActivityProps) => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [actorMap, setActorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, type, metadata, created_at, actor_user_id")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5);

      const rows = (data as EventRow[]) ?? [];
      setEvents(rows);

      // Resolve actor emails
      const actorIds = [...new Set(rows.map((e) => e.actor_user_id).filter(Boolean))] as string[];
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", actorIds);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p) => {
          const email = p.email ?? "Unknown";
          // Use the part before @ as display name, capitalize first letter
          const name = email.split("@")[0];
          map[p.id] = name.charAt(0).toUpperCase() + name.slice(1);
        });
        setActorMap(map);
      }
      setLoading(false);
    };
    fetch();
  }, [orgId]);

  const isLoading = externalLoading || loading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-lg border border-border/80 bg-card shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] animate-pulse">
            <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-56 bg-muted rounded" />
              <div className="h-3 w-40 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center rounded-lg border border-border/80 bg-card shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">Activity will appear here as you use your workspace.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {events.map((evt) => {
        const config = eventConfig[evt.type] ?? { icon: Zap, verb: evt.type.replace(/_/g, " ").toLowerCase(), category: "automation" as EventCategory };
        const Icon = config.icon;
        const style = categoryStyles[config.category];
        const actorName = evt.actor_user_id ? actorMap[evt.actor_user_id] ?? "Someone" : "System";
        const entityName = getEntityName(evt.type, evt.metadata);
        const detail = getSecondaryDetail(evt.type, evt.metadata);

        return (
          <div
            key={evt.id}
            className="flex items-start gap-3.5 px-5 py-4 rounded-lg border border-border/80 bg-card shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] hover:shadow-[0_3px_10px_0_rgba(0,0,0,0.06)] hover:border-primary/20 transition-all duration-150"
          >
            <ColoredIcon icon={Icon} bgClass={style.bg} iconClass={style.text} size="sm" />

            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground leading-snug">
                <span className="font-semibold">{actorName}</span>
                {" "}{config.verb}
                {entityName && (
                  <span className="font-semibold text-primary"> {entityName}</span>
                )}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                <span>{categoryLabels[config.category]}</span>
                {detail && (
                  <>
                    <span className="text-border">•</span>
                    <span>{detail}</span>
                  </>
                )}
                <span className="text-border">•</span>
                <span className="tabular-nums">{timeAgo(evt.created_at)}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivity;
