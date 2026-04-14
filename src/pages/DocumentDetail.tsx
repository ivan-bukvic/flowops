import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { extractFileName } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentDetail {
  id: string;
  file_url: string;
  original_name: string | null;
  processing_status: string;
  summary: string | null;
  raw_text: string | null;
  extracted_deadlines: any;
  created_at: string;
  project_id: string | null;
}

interface ProjectName {
  name: string;
}

const DocumentDetailPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { selectedOrgId } = useOrg();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);

  const fetchDoc = async () => {
    if (!documentId || !selectedOrgId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("documents")
      .select("id, file_url, original_name, processing_status, summary, raw_text, extracted_deadlines, created_at, project_id")
      .eq("id", documentId)
      .eq("org_id", selectedOrgId)
      .is("deleted_at", null)
      .maybeSingle();
    setDoc(data as DocumentDetail | null);

    if (data?.project_id) {
      const { data: proj } = await (supabase as any)
        .from("projects")
        .select("name")
        .eq("id", data.project_id)
        .maybeSingle();
      setProjectName((proj as ProjectName | null)?.name ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!documentId || !selectedOrgId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("documents")
        .select("id, file_url, original_name, processing_status, summary, raw_text, extracted_deadlines, created_at, project_id")
        .eq("id", documentId)
        .eq("org_id", selectedOrgId)
        .is("deleted_at", null)
        .maybeSingle();
      setDoc(data as DocumentDetail | null);

      if (data?.project_id) {
        const { data: proj } = await (supabase as any)
          .from("projects")
          .select("name")
          .eq("id", data.project_id)
          .maybeSingle();
        setProjectName((proj as ProjectName | null)?.name ?? null);
      }
      setLoading(false);
    };
    fetch();
  }, [documentId, selectedOrgId]);

  if (loading) {
    return <main className="p-6"><p className="text-sm text-muted-foreground">Loading...</p></main>;
  }

  if (!doc) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">Document not found.</p>
        <Link to="/documents" className="text-sm text-primary hover:underline mt-2 inline-block">Back to Documents</Link>
      </main>
    );
  }

  const fileName = doc.original_name || extractFileName(doc.file_url);
  const deadlines = doc.extracted_deadlines
    ? Array.isArray(doc.extracted_deadlines) ? doc.extracted_deadlines : [doc.extracted_deadlines]
    : [];

  return (
    <main className="p-6">
      <Link to="/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Documents
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <PageHeader title={fileName} />
        <StatusBadge status={doc.processing_status} />
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        {projectName && <span>Project: {projectName}</span>}
        <span>Uploaded: {new Date(doc.created_at).toLocaleString()}</span>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">AI Summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {doc.summary || "No summary available yet."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Extracted Deadlines</CardTitle></CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deadlines extracted.</p>
            ) : (
              <ul className="space-y-1">
                {deadlines.map((d: any, i: number) => {
                  if (typeof d === "string") return <li key={i} className="text-sm text-foreground">{d}</li>;
                  if (d && typeof d === "object" && d.date) {
                    const formatted = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    return <li key={i} className="text-sm text-foreground">{formatted} — {d.event || d.description || "Deadline"}</li>;
                  }
                  return <li key={i} className="text-sm text-foreground">{JSON.stringify(d)}</li>;
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Source Content</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
              {doc.raw_text || "No content available."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default DocumentDetailPage;
