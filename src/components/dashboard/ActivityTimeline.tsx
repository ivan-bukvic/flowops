import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, FolderPlus } from "lucide-react";
import ActivityFeed, { type FeedItem } from "@/components/shared/ActivityFeed";
import { toFeedItem, type RawEvent, type RawLog } from "@/lib/activityMapping";

interface Props {
  orgId: string;
  limit?: number;
}

const ActivityTimeline = ({ orgId, limit = 8 }: Props) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: evData } = await supabase
        .from("events")
        .select("id, type, created_at, metadata")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);

      const evRows = (evData ?? []) as RawEvent[];

      let logRows: RawLog[] = [];
      if (evRows.length > 0) {
        const eventIds = evRows.map((e) => e.id);
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
        setEvents(evRows);
        setLogs(logRows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, limit]);

  const navFor = (evt: RawEvent): (() => void) | undefined => {
    const projectId = evt.metadata?.project_id as string | undefined;
    const documentId = evt.metadata?.document_id as string | undefined;
    if (evt.type === "DOCUMENT_UPLOADED" && documentId) return () => navigate(`/documents/${documentId}`);
    if (projectId) return () => navigate(`/projects/${projectId}`);
    if (evt.type.startsWith("PROJECT_")) return () => navigate("/projects");
    return undefined;
  };

  const items = useMemo<FeedItem[]>(
    () => events.map((evt) => toFeedItem(evt, logs, navFor(evt))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, logs],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl bg-card px-5 py-4 shadow-card">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-14 text-center shadow-card">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-[15px] font-semibold text-foreground">No activity yet</p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Create a project or automation to see activity here.
        </p>
        <button
          onClick={() => navigate("/projects")}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FolderPlus className="h-4 w-4" />
          Create Project
        </button>
      </div>
    );
  }

  return <ActivityFeed items={items} />;
};

export default ActivityTimeline;
