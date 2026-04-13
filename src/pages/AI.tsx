import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Sparkles, MessageSquare, Loader2 } from "lucide-react";
import ColoredIcon from "@/components/shared/ColoredIcon";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AiQueryRow {
  id: string;
  question: string | null;
  answer: string | null;
  project_id: string | null;
  created_at: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
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

const AI = () => {
  const { selectedOrgId } = useOrg();
  const [queries, setQueries] = useState<AiQueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [question, setQuestion] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [asking, setAsking] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOrgId) return;

    const fetchData = async () => {
      setLoading(true);
      const [queryRes, projRes] = await Promise.all([
        supabase
          .from("ai_queries")
          .select("id, question, answer, project_id, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("projects")
          .select("id, name")
          .eq("org_id", selectedOrgId)
          .is("deleted_at", null),
      ]);
      setQueries((queryRes.data as AiQueryRow[]) ?? []);
      setProjects((projRes.data as ProjectOption[]) ?? []);
      setLoading(false);
    };
    fetchData();
  }, [selectedOrgId]);

  const handleAskAI = async () => {
    if (!question.trim()) {
      toast.error("Please enter your question.");
      return;
    }
    if (!selectedProject) {
      toast.error("Please select a project.");
      return;
    }

    setAsking(true);
    setLatestAnswer(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error("Authentication required. Please sign in again.");
        setAsking(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            question: question.trim(),
            project_id: selectedProject,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || `Request failed (${response.status})`);
        setAsking(false);
        return;
      }

      setLatestAnswer(result.answer);
      setQuestion("");
      toast.success("AI response received!");

      // Refresh query history
      const { data: refreshed } = await supabase
        .from("ai_queries")
        .select("id, question, answer, project_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (refreshed) setQueries(refreshed as AiQueryRow[]);
    } catch (err) {
      console.error("Ask AI error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <main className="p-6">
      <PageHeader title="AI Workspace" description="Ask questions about your documents and projects" />

      {/* Ask Section */}
      <div className="rounded-lg border border-border bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] mb-10">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <ColoredIcon icon={Sparkles} bgClass="bg-violet-50" iconClass="text-violet-600" size="sm" />
            <div>
              <h2 className="text-[15px] font-bold text-foreground">Ask AI</h2>
              <p className="text-[12px] text-muted-foreground/70">Get intelligent answers from your workspace data</p>
            </div>
          </div>

          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your projects or documents..."
            className="min-h-[100px] text-[14px] resize-none border-border focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            disabled={asking}
          />

          <div className="flex items-center justify-between gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="max-w-[220px] h-9 text-[13px] text-muted-foreground border-border/80">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="h-10 px-5 font-semibold shadow-sm"
              onClick={handleAskAI}
              disabled={asking}
            >
              {asking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {asking ? "Thinking..." : "Ask AI"}
            </Button>
          </div>
        </div>
      </div>

      {/* Latest AI Response */}
      {latestAnswer && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Response</h3>
          </div>
          <div className="prose prose-sm max-w-none text-foreground/90">
            <ReactMarkdown>{latestAnswer}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Query History */}
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/80 mb-5">Query History</h2>

      {loading ? (
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/80 bg-card p-5 animate-pulse">
              <div className="h-4 w-64 bg-muted rounded mb-3" />
              <div className="h-3 w-96 bg-muted/70 rounded" />
            </div>
          ))}
        </div>
      ) : queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-border/80 bg-card">
          <div className="h-11 w-11 rounded-full bg-muted/60 flex items-center justify-center mb-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground">No queries yet</p>
          <p className="text-xs text-muted-foreground mt-1">Ask a question above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {queries.map((q) => (
            <div
              key={q.id}
              className="rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] hover:shadow-[0_3px_10px_0_rgba(0,0,0,0.06)] hover:border-primary/20 transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground leading-snug">
                    {q.question || "—"}
                  </p>
                  {q.answer && (
                    <p className="text-[13px] text-muted-foreground/70 mt-2 leading-relaxed line-clamp-2">
                      {q.answer}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground/40 whitespace-nowrap shrink-0 mt-0.5 tabular-nums">
                  {q.created_at ? timeAgo(q.created_at) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default AI;
