import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
  const [expanded, setExpanded] = useState<string | null>(null);

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
          <div key={i} className="rounded-lg border border-border bg-card p-5 animate-pulse">
            <div className="h-4 w-64 bg-muted rounded mb-3" />
            <div className="h-3 w-96 bg-muted/70 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 mt-4 rounded-lg border border-border bg-card">
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
    <div className="mt-4 space-y-3">
      {queries.map((q) => (
        <div
          key={q.id}
          className="rounded-lg border border-border bg-card p-5 hover:border-primary/20 transition-all cursor-pointer"
          onClick={() => setExpanded(expanded === q.id ? null : q.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {q.question || "—"}
              </p>
              {expanded === q.id && q.answer ? (
                <div className="mt-3 rounded-md bg-primary/5 border border-primary/10 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Response</span>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground/90">
                    <ReactMarkdown>{q.answer}</ReactMarkdown>
                  </div>
                </div>
              ) : q.answer ? (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{q.answer}</p>
              ) : null}
            </div>
            <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap shrink-0 mt-0.5 tabular-nums">
              {q.created_at ? timeAgo(q.created_at) : "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectAiQueries;
