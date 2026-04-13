import { useEffect, useState, useCallback } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Upload, Loader2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DocumentRow {
  id: string;
  original_name: string;
  file_url: string;
  processing_status: string;
  summary: string | null;
  created_at: string;
  project_id: string | null;
  project_name: string | null;
}

function extractFileName(fileUrl: string): string {
  const last = fileUrl.split("/").pop() || fileUrl;
  // Strip UUID prefix if present (e.g. "abc123_Proposal.pdf" → "Proposal.pdf")
  const match = last.match(/^[0-9a-f-]{36}_(.+)$/i);
  return match ? match[1] : last;
}

const Documents = () => {
  const { selectedOrgId } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("documents")
      .select("id, file_url, original_name, processing_status, summary, created_at, project_id, projects(name)")
      .eq("org_id", selectedOrgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    const rows: DocumentRow[] = (data ?? []).map((d: any) => ({
      id: d.id,
      file_url: d.file_url,
      original_name: d.original_name || extractFileName(d.file_url),
      processing_status: d.processing_status,
      summary: d.summary,
      created_at: d.created_at,
      project_id: d.project_id,
      project_name: d.projects?.name ?? null,
    }));
    setDocuments(rows);
    setLoading(false);
  }, [selectedOrgId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = () => {
    if (!selectedOrgId || !user) {
      toast.error("You must be logged in to upload documents.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx,.txt";

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const uniqueName = `${crypto.randomUUID()}_${file.name}`;
        const filePath = `${selectedOrgId}/${uniqueName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

        const fileUrl = urlData?.publicUrl ?? filePath;

        const { data: insertData, error: insertError } = await (supabase as any)
          .from("documents")
          .insert({
            org_id: selectedOrgId,
            file_url: fileUrl,
            original_name: file.name,
            uploaded_by: user.id,
            processing_status: "uploaded",
          })
          .select("id");

        if (insertError) throw insertError;

        // Emit DOCUMENT_UPLOADED event
        try {
          await (supabase as any).rpc("emit_event", {
            p_org_id: selectedOrgId,
            p_type: "DOCUMENT_UPLOADED",
            p_metadata: {
              document_id: insertData?.[0]?.id ?? null,
              document_name: file.name,
              file_url: fileUrl,
            },
          });
        } catch (_) {
          // Event emission is non-blocking
        }

        toast.success("Document uploaded successfully.");
        await fetchDocs();
      } catch (err: any) {
        console.error("Upload failed:", err);
        toast.error(err.message || "Failed to upload document.");
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const columns: Column<DocumentRow>[] = [
    {
      key: "original_name",
      header: "Document Name",
      className: "w-[35%]",
      render: (row) => (
        <button
          className="inline-flex items-center gap-2 font-medium text-primary hover:underline text-sm text-left whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/documents/${row.id}`);
          }}
        >
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[250px]">{row.original_name}</span>
        </button>
      ),
    },
    {
      key: "project_name",
      header: "Project",
      className: "w-[20%]",
      render: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {row.project_name || <span className="text-muted-foreground/50">—</span>}
        </span>
      ),
    },
    {
      key: "processing_status",
      header: "Status",
      className: "w-[15%]",
      render: (row) => <StatusBadge status={row.processing_status} />,
    },
    {
      key: "summary",
      header: "Summary",
      className: "w-[15%]",
      render: (row) => (
        <span className="text-sm text-muted-foreground truncate block">
          {row.summary || <span className="text-muted-foreground/50">—</span>}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      className: "w-[15%]",
      render: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <main className="p-6">
      <PageHeader
        title="Documents"
        description="All documents across your workspace"
        actionLabel={uploading ? "Uploading…" : "Upload Document"}
        actionIcon={uploading ? Loader2 : Upload}
        onAction={handleUpload}
      />
      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
        emptyMessage="No documents uploaded yet."
        onRowClick={(row) => navigate(`/documents/${row.id}`)}
      />
    </main>
  );
};

export default Documents;
