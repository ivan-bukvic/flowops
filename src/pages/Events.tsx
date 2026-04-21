import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface EventRow {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  actor_user_id: string | null;
  created_at: string;
}

const EVENT_DESCRIPTIONS: Record<string, (meta: Record<string, unknown>) => string> = {
  PROJECT_CREATED: (m) => `Created project "${m.project_name ?? m.project_id ?? ""}"`,
  PROJECT_UPDATED: (m) => `Updated project "${m.new_name ?? m.project_name ?? m.project_id ?? ""}"`,
  PROJECT_DELETED: (m) => `Deleted project "${m.project_name ?? m.project_id ?? ""}"`,
  PROJECT_MEMBER_ADDED: (m) => `Added member to project (role: ${m.role ?? "—"})`,
  PROJECT_MEMBER_REMOVED: (m) => `Removed member from project`,
  MEMBER_ADDED: (m) => `Added a workspace member`,
  MEMBER_REMOVED: (m) => `Removed a workspace member`,
  WORKSPACE_CREATED: () => `Created the workspace`,
  OWNERSHIP_TRANSFERRED: (m) => `Transferred ownership`,
};

function describeEvent(type: string, metadata: Record<string, unknown>): string {
  const fn = EVENT_DESCRIPTIONS[type];
  if (fn) return fn(metadata);
  return type.replace(/_/g, " ").toLowerCase();
}

const Events = () => {
  const { selectedOrgId } = useOrg();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedOrgId) return;
    const fetchEvents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, type, metadata, actor_user_id, created_at")
        .eq("org_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(50);
      const rows = (data as EventRow[]) ?? [];
      setEvents(rows);

      // Resolve actor emails
      const actorIds = [...new Set(rows.map((e) => e.actor_user_id).filter(Boolean))] as string[];
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", actorIds);
        const map: Record<string, string> = {};
        (profiles as any[] ?? []).forEach((p: any) => { map[p.id] = getDisplayName(p); });
        setActorNames(map);
      }
      setLoading(false);
    };
    fetchEvents();
  }, [selectedOrgId]);

  return (
    <main className="p-6">
      <PageHeader title="Events" description="Activity timeline for your workspace" />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Activity will appear here when events are triggered."
        />
      ) : (
        <div className="space-y-2">
          {events.map((evt) => {
            const actorLabel = evt.actor_user_id
              ? actorNames[evt.actor_user_id] ?? "Unknown User"
              : "System";
            const description = describeEvent(evt.type, evt.metadata ?? {});

            return (
              <div key={evt.id} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {evt.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{actorLabel}</span>{" "}
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Events;
