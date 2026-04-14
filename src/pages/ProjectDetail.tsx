import { useEffect, useState } from "react";
import { triggerAutomations } from "@/lib/triggerAutomations";
import { useParams, Link } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractFileName } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import MembersList from "@/components/projects/MembersList";
import ProjectAiQueries from "@/components/projects/ProjectAiQueries";
import StatusBadge from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ArrowLeft } from "lucide-react";

const supabase: any = rawSupabase;

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
}

interface EventRow {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: { email: string | null } | null;
}

interface DocumentRow {
  id: string;
  file_url: string;
  original_name: string | null;
  processing_status: string;
  summary: string | null;
  extracted_deadlines: any;
  created_at: string;
}

interface OrgMemberOption {
  user_id: string;
  email: string;
}

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedOrgId } = useOrg();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectEvents, setProjectEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMemberOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("viewer");
  const [adding, setAdding] = useState(false);

  const isAdmin = orgRole === "owner" || orgRole === "admin";

  useEffect(() => {
    if (!projectId) return;
    const fetchProject = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("projects")
        .select("id, name, description, created_at, created_by")
        .eq("id", projectId)
        .is("deleted_at", null)
        .maybeSingle();
      setProject(data as ProjectRow | null);
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !selectedOrgId) return;
    const fetchEvents = async () => {
      setEventsLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, type, metadata, created_at")
        .eq("org_id", selectedOrgId)
        .filter("metadata->>project_id", "eq", projectId)
        .order("created_at", { ascending: false });
      setProjectEvents((data as EventRow[]) ?? []);
      setEventsLoading(false);
    };
    fetchEvents();
  }, [projectId, selectedOrgId]);

  const fetchMembers = async () => {
    if (!project?.id) return;

    setMembersLoading(true);

    const { data: members, error } = await supabase
      .from("project_members")
      .select("id, user_id, role, created_at")
      .eq("project_id", project.id);

    if (error) {
      console.error(error);
      setProjectMembers([]);
      setMembersLoading(false);
      return;
    }

    if (!members || members.length === 0) {
      setProjectMembers([]);
      setMembersLoading(false);
      return;
    }

    const userIds = members.map((m: any) => m.user_id);

    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);

    const merged = members.map((m: any) => {
      const profile = profiles?.find((p: any) => p.id === m.user_id);

      return {
        ...m,
        profiles: {
          email: profile?.email || m.user_id,
        },
      };
    });

    setProjectMembers(merged);
    setMembersLoading(false);
  };

  useEffect(() => {
    if (!project) return;

    fetchMembers();
  }, [project]);

  useEffect(() => {
    if (!selectedOrgId || !user) return;
    supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", selectedOrgId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setOrgRole(data?.role ?? null));
  }, [selectedOrgId, user]);

  useEffect(() => {
    if (!selectedOrgId || !isAdmin) return;
    supabase.rpc("get_org_members_with_email", { p_org_id: selectedOrgId }).then(({ data }: any) => {
      setOrgMembers((data ?? []).map((m: any) => ({ user_id: m.user_id, email: m.email ?? "" })));
    });
  }, [selectedOrgId, isAdmin]);

  useEffect(() => {
    if (!projectId || !selectedOrgId) return;
    const fetchDocuments = async () => {
      setDocumentsLoading(true);
      const { data } = await supabase
        .from("documents")
        .select("id, file_url, original_name, processing_status, summary, extracted_deadlines, created_at")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      setDocuments((data as DocumentRow[]) ?? []);
      setDocumentsLoading(false);
    };
    fetchDocuments();
  }, [projectId, selectedOrgId]);

  const handleFileUpload = async (file: File) => {
    if (!selectedOrgId || !projectId || !user) return;
    const filePath = `${selectedOrgId}/${projectId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
    if (uploadError) {
      toast.error("File upload failed");
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      org_id: selectedOrgId,
      project_id: projectId,
      uploaded_by: user.id,
      file_url: filePath,
      original_name: file.name,
      processing_status: "uploaded",
    });
    if (insertError) {
      toast.error("Failed to register document");
      return;
    }

    toast.success("Document uploaded successfully");
    setDocuments((prev) => [
      {
        id: crypto.randomUUID(),
        file_url: filePath,
        original_name: file.name,
        processing_status: "uploaded",
        summary: null,
        extracted_deadlines: null,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleAddMember = async () => {
    if (!projectId || !selectedOrgId || !selectedUserId) return;
    setAdding(true);
    const { error } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: selectedUserId, role: selectedRole });

    if (error) {
      toast.error(error.code === "23505" ? "User already added" : "Failed to add member");
      setAdding(false);
      return;
    }

    supabase
      .rpc("emit_event", {
        p_org_id: selectedOrgId,
        p_type: "PROJECT_MEMBER_ADDED" as never,
        p_metadata: {
          project_id: projectId,
          project_name: project?.name || "Unknown Project",
          user_id: selectedUserId,
          user_email: orgMembers.find((m) => m.user_id === selectedUserId)?.email || "unknown@email.com",
          role: selectedRole,
        },
      })
      .then(
        () => triggerAutomations(),
        () => {},
      );

    setSelectedUserId("");
    setSelectedRole("viewer");
    setAdding(false);
    await fetchMembers();
  };

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Link to="/projects" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to Projects
        </Link>
      </main>
    );
  }

  const docColumns: Column<DocumentRow>[] = [
    {
      key: "file_url",
      header: "Document",
      render: (row) => (
        <span className="text-sm font-medium truncate max-w-[250px] block">{row.original_name || extractFileName(row.file_url)}</span>
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
        <span className="text-sm text-muted-foreground truncate max-w-[250px] block">{row.summary || "—"}</span>
      ),
    },
    {
      key: "created_at",
      header: "Uploaded",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  // memberColumns removed — using MembersList component instead

  return (
    <main className="p-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <PageHeader title={project.name} description={project.description || undefined} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="ai">AI Queries</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(project.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="text-sm font-mono">{project.created_by}</p>
              </div>
          </div>

          <h3 className="text-sm font-medium text-foreground mt-6 mb-3">Activity</h3>
          {eventsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : projectEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {projectEvents.map((evt) => (
                <div key={evt.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {evt.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(evt.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="flex justify-end mt-4 mb-3">
            <Button
              size="sm"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileUpload(file);
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-1.5" /> Upload
            </Button>
          </div>
          <DataTable
            columns={docColumns}
            data={documents}
            loading={documentsLoading}
            emptyMessage="No documents yet."
          />
        </TabsContent>

        <TabsContent value="ai">
          <ProjectAiQueries projectId={projectId!} />
        </TabsContent>

        <TabsContent value="members">
          {isAdmin && (
            <div className="flex items-center gap-2 mt-4 mb-3">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select member..." />
                </SelectTrigger>
                <SelectContent>
                  {orgMembers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "editor" | "viewer")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!selectedUserId || adding} onClick={handleAddMember}>
                {adding ? "Adding..." : "Add"}
              </Button>
            </div>
          )}

          <MembersList members={projectMembers} loading={membersLoading} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Project ID</p>
                <p className="text-sm font-mono">{project.id}</p>
              </div>
              <p className="text-sm text-muted-foreground">Project settings coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default ProjectDetail;
