import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";

interface EventRow {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  actor_user_id: string | null;
  created_at: string;
}

const Events = () => {
  const { selectedOrgId } = useOrg();
  const [events, setEvents] = useState<EventRow[]>([]);
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
      setEvents((data as EventRow[]) ?? []);
      setLoading(false);
    };
    fetchEvents();
  }, [selectedOrgId]);

  return (
    <main className="p-6">
      <PageHeader title="Events" description="Activity timeline for your workspace" />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-mono">
                  {evt.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(evt.created_at).toLocaleString()}
                </span>
                {evt.actor_user_id && (
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                    actor: {evt.actor_user_id}
                  </span>
                )}
              </div>
              {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                <pre className="text-xs bg-muted rounded px-2 py-1 font-mono text-foreground overflow-x-auto mt-2">
                  {JSON.stringify(evt.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Events;
