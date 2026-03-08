import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DocumentRow {
  id: string;
  file_url: string;
  processing_status: string;
  summary: string | null;
  created_at: string;
  project_id: string | null;
}

const Documents = () => {
  const { selectedOrgId } = useOrg();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedOrgId) return;
    const fetchDocs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("documents")
        .select("id, file_url, processing_status, summary, created_at, project_id")
        .eq("org_id", selectedOrgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      setDocuments((data as DocumentRow[]) ?? []);
      setLoading(false);
    };
    fetchDocs();
  }, [selectedOrgId]);

  const columns: Column<DocumentRow>[] = [
    {
      key: "file_url",
      header: "Document Name",
      render: (row) => (
        <span className="font-medium text-foreground text-sm truncate max-w-[250px] block">
          {row.file_url.split("/").pop() || row.file_url}
        </span>
      ),
    },
    {
      key: "processing_status",
      header: "Status",
      render: (row) => <StatusBadge status={row.processing_status} />,
    },
    {
      key: "summary",
      header: "Summary",
      render: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-[300px] block">
          {row.summary || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <main className="p-6">
      <PageHeader
        title="Documents"
        description="All documents across your workspace"
        actionLabel="Upload Document"
        actionIcon={Upload}
        onAction={() => {
          // Trigger file input
          const input = document.createElement("input");
          input.type = "file";
          input.click();
        }}
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
