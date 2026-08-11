import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import ActivityFeed, { type FeedItem } from "@/components/shared/ActivityFeed";
import { toFeedItem, type RawEvent, type RawLog } from "@/lib/activityMapping";

interface Props {
  orgId: string;
  projectId: string;
}

const ProjectActivityFeed = ({ orgId, projectId }: Props) => {
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, type, metadata, created_at")
        .eq("org_id", orgId)
        .filter("metadata->>project_id", "eq", projectId)
        .order("created_at", { ascending: false });

      const rows = (data as RawEvent[]) ?? [];

      let logRows: RawLog[] = [];
      if (rows.length > 0) {
        const eventIds = rows.map((e) => e.id);
        const { data: lData } = await supabase
          .from("automation_logs")
          .select("id, status, event_id, automation_rules!inner(action_type, org_id)")
          .eq("automation_rules.org_id", orgId)
          .in("event_id", eventIds);

        logRows = ((lData ?? []) as any[]).map((r) => ({
          id: r.id,
          status: r.status ?? "pending",
          event_id: r.event_id,
          action_type: r.automation_rules?.action_type ?? "—",
        }));
      }

      if (!cancelled) {
        setEvents(rows);
        setLogs(logRows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, projectId]);

  const items = useMemo<FeedItem[]>(
    () => events.map((evt) => toFeedItem(evt, logs)),
    [events, logs],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl bg-card px-5 py-4 shadow-card">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-12 text-center shadow-card">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-[15px] font-semibold text-foreground">No activity yet</p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Project activity will appear here as members, documents, and automations are added.
        </p>
      </div>
    );
  }

  return <ActivityFeed items={items} />;
};

export default ProjectActivityFeed;
