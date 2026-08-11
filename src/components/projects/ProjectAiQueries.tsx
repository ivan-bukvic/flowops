import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Sparkles } from "lucide-react";

interface AiQuery {
  id: string;
  question: string | null;
  answer: string | null;
  created_at: string | null;
}

interface Props {
  projectId: string;
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

const ProjectAiQueries = ({ projectId }: Props) => {
  const [queries, setQueries] = useState<AiQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("ai_queries")
        .select("id, question, answer, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);
      setQueries((data as AiQuery[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [projectId]);

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card p-5 shadow-card animate-pulse">
            <div className="h-4 w-64 bg-muted rounded mb-3" />
            <div className="h-3 w-96 bg-muted/70 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 mt-4 rounded-2xl bg-card shadow-card">
        <div className="h-11 w-11 rounded-full bg-muted/60 flex items-center justify-center mb-3">
          <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-semibold text-foreground">No AI queries yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Go to the AI Workspace to ask questions about this project's documents.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-6">
      {queries.map((q) => (
        <div key={q.id} className="space-y-2">
          {/* Question — right bubble */}
          <div className="flex justify-end">
            <div className="max-w-[680px] rounded-2xl rounded-br-sm bg-muted px-4 py-2.5">
              <p className="text-[13.5px] font-semibold text-foreground">{q.question || "—"}</p>
              {q.created_at && (
                <p className="mt-0.5 text-[10.5px] text-muted-foreground tabular-nums">{timeAgo(q.created_at)}</p>
              )}
            </div>
          </div>
          {/* Answer — left bubble with AI avatar */}
          {q.answer && (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slack/10 text-slack">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="max-w-[680px] rounded-2xl rounded-tl-sm bg-slack/[0.06] px-4 py-3">
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/85">{q.answer}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectAiQueries;
