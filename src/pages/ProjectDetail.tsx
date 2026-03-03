import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as rawSupabase } from "@/integrations/supabase/client";

const supabase: any = rawSupabase;
import { toast } from "sonner";

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
  // --- DOCUMENTS STATE ---
  interface DocumentRow {
    id: string;
    file_url: string;
    processing_status: string;
    summary: string | null;
    extracted_deadlines: any;
    created_at: string;
  }

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMemberOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("viewer");
  const [adding, setAdding] = useState(false);

  const isAdmin = orgRole === "owner" || orgRole === "admin";
  async function handleFileUpload(file: File) {
    if (!selectedOrgId || !projectId || !user) {
      console.error("Missing required context");
      return;
    }

    const filePath = `${selectedOrgId}/${projectId}/${crypto.randomUUID()}-${file.name}`;

    // 1️⃣ Upload to Storage
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);

    if (uploadError) {
      toast.error("File upload failed");
      console.error("Upload error:", uploadError.message);
      return;
    }

    // 2️⃣ Insert into documents table
    const { error: insertError } = await supabase.from("documents").insert({
      org_id: selectedOrgId,
      project_id: projectId,
      uploaded_by: user.id,
      file_url: filePath,
      processing_status: "uploaded",
    });

    if (insertError) {
      toast.error("Failed to register document");
      console.error("Insert error:", insertError.message);
      return;
    }

    toast.success("Document uploaded successfully");

    // Optional: refresh documents
    setDocuments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        file_url: filePath,
        processing_status: "uploaded",
        summary: null,
        extracted_deadlines: null,
        created_at: new Date().toISOString(),
      },
    ]);
  }
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
    if (!projectId) return;
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
  }, [projectId]);

  const fetchMembers = async () => {
    if (!projectId) return;
    setMembersLoading(true);
    const { data } = await supabase
      .from("project_members")
      .select("id, user_id, role, created_at, profiles(email)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    setProjectMembers((data as unknown as MemberRow[]) ?? []);
    setMembersLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  // Fetch current user's org role
  useEffect(() => {
    if (!selectedOrgId || !user) return;
    (supabase as any)
      .from("organization_members")
      .select("role")
      .eq("org_id", selectedOrgId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setOrgRole((data as { role: string } | null)?.role ?? null);
      });
  }, [selectedOrgId, user]);

  // Fetch org members for the dropdown
  useEffect(() => {
    if (!selectedOrgId || !isAdmin) return;
    supabase.rpc("get_org_members_with_email", { p_org_id: selectedOrgId }).then(({ data }) => {
      const members = (data ?? []).map((m: any) => ({
        user_id: m.user_id,
        email: m.email ?? "",
      }));
      setOrgMembers(members);
    });
  }, [selectedOrgId, isAdmin]);
  useEffect(() => {
    if (!projectId || !selectedOrgId) return;

    const fetchDocuments = async () => {
      setDocumentsLoading(true);

      const { data } = await supabase
        .from("documents")
        .select("id, file_url, processing_status, summary, extracted_deadlines, created_at")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setDocuments((data as DocumentRow[]) ?? []);
      setDocumentsLoading(false);
    };

    fetchDocuments();
  }, [projectId, selectedOrgId]);
  const handleAddMember = async () => {
    if (!projectId || !selectedOrgId || !selectedUserId) return;
    setAdding(true);
    const { error } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: selectedUserId, role: selectedRole });

    if (error) {
      if (error.code === "23505") {
        toast.error("User already added");
      } else {
        toast.error("Failed to add member");
      }
      setAdding(false);
      return;
    }

    // Emit event (non-blocking, fail silently)
    supabase
      .rpc("emit_event", {
        p_org_id: selectedOrgId,
        p_type: "PROJECT_MEMBER_ADDED" as never,
        p_metadata: {
          project_id: projectId,
          user_id: selectedUserId,
          role: selectedRole,
        },
      })
      .then(() => {});

    setSelectedUserId("");
    setSelectedRole("viewer");
    setAdding(false);
    await fetchMembers();
  };

  if (loading)
    return (
      <main className="flex-1 px-6 py-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  if (!project)
    return (
      <main className="flex-1 px-6 py-4">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Link to="/projects" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to Projects
        </Link>
      </main>
    );

  return (
    <main className="flex-1 px-6 py-4">
      <Link to="/projects" className="text-sm text-primary hover:underline">
        ← Back to Projects
      </Link>
      <h1 className="text-lg font-semibold text-foreground mt-3">{project.name}</h1>
      {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
      <p className="text-xs text-muted-foreground mt-2">Created {new Date(project.created_at).toLocaleString()}</p>

      <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Project Activity</h2>
      {eventsLoading ? (
        <p className="text-sm text-muted-foreground">Loading activity...</p>
      ) : projectEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {projectEvents.map((event) => (
            <div key={event.id} className="py-2.5">
              <p className="text-sm font-semibold text-foreground">{event.type}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
              <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
      {/* ================= DOCUMENTS SECTION ================= */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      </div>
      <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Documents</h2>

      {documentsLoading ? (
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="p-3 border rounded-md flex justify-between items-center">
              <div>
                <p className="text-sm font-medium break-all">{doc.file_url}</p>

                {doc.summary && <p className="text-xs text-muted-foreground mt-1">{doc.summary}</p>}
              </div>

              <span className="text-xs px-2 py-1 rounded bg-muted">{doc.processing_status}</span>
            </div>
          ))}
        </div>
      )}
      <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Project Members</h2>

      {isAdmin && (
        <div className="flex items-center gap-2 mb-3">
          <select
            className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select member...</option>
            {orgMembers.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.email}
              </option>
            ))}
          </select>
          <select
            className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "editor" | "viewer")}
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
          </select>
          <button
            className="text-sm px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            disabled={!selectedUserId || adding}
            onClick={handleAddMember}
          >
            Add
          </button>
        </div>
      )}

      {membersLoading ? (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      ) : projectMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {projectMembers.map((member) => (
            <div key={member.id} className="py-2.5">
              <p className="text-sm font-semibold text-foreground">{member.profiles?.email ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
export default ProjectDetail;
