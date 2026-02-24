import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
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

    const fetch = async () => {
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

    fetch();
  }, [selectedOrgId]);

  return (
    <main className="flex-1 px-6 py-4">
      <h1 className="text-lg font-semibold text-foreground mb-3">Audit Log</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events recorded yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {events.map((evt) => (
            <div key={evt.id} className="py-2.5 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs font-mono">
                  {evt.type}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {new Date(evt.created_at).toLocaleString()}
                </span>
                {evt.actor_user_id && (
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                    actor: {evt.actor_user_id}
                  </span>
                )}
              </div>
              {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                <pre className="text-xs bg-muted rounded px-2 py-1 font-mono text-foreground overflow-x-auto">
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
