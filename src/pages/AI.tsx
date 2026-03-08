import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

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

const AI = () => {
  const { selectedOrgId } = useOrg();
  const [queries, setQueries] = useState<AiQueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [question, setQuestion] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

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

  const columns: Column<AiQueryRow>[] = [
    {
      key: "question",
      header: "Question",
      render: (row) => (
        <span className="text-sm font-medium text-foreground truncate max-w-[300px] block">
          {row.question || "—"}
        </span>
      ),
    },
    {
      key: "answer",
      header: "Answer",
      render: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-[300px] block">
          {row.answer ? row.answer.substring(0, 100) + (row.answer.length > 100 ? "..." : "") : "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <main className="p-6">
      <PageHeader title="AI Workspace" description="Ask questions about your documents and projects" />

      <Card className="mb-6">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Ask AI</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your projects or documents..."
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-2 flex-1 max-w-[250px]">
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button disabled={!question.trim()}>
              <Send className="h-4 w-4 mr-1.5" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-foreground mb-3">Query History</h2>
      <DataTable columns={columns} data={queries} loading={loading} emptyMessage="No AI queries yet." />
    </main>
  );
};

export default AI;
