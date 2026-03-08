import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

const Projects = () => {
  const { selectedOrgId } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editProject, setEditProject] = useState<ProjectRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editError, setEditError] = useState("");
  const [updating, setUpdating] = useState(false);

  const canCreate = currentRole === "owner" || currentRole === "admin";

  const fetchProjects = async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("id, name, description, created_by, created_at, project_members(id)")
      .eq("org_id", selectedOrgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setProjects(
      ((data as any[]) ?? []).map((p) => ({
        ...p,
        member_count: Array.isArray(p.project_members) ? p.project_members.length : 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId || !user) {
      setCurrentRole(null);
      return;
    }
    supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", selectedOrgId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCurrentRole(data?.role ?? null));
  }, [selectedOrgId, user]);

  const handleCreate = async () => {
    if (!selectedOrgId || !user || !createName.trim()) return;
    setCreateError(null);
    setCreating(true);

    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({
        org_id: selectedOrgId,
        name: createName.trim(),
        description: createDesc.trim() || null,
        created_by: user.id,
      })
      .select("id, name")
      .single();

    if (error) {
      setCreating(false);
      setCreateError(error.code === "23505" ? "A project with this name already exists." : error.message);
      return;
    }

    supabase.rpc("emit_event", {
      p_org_id: selectedOrgId,
      p_type: "PROJECT_CREATED" as const,
      p_metadata: { project_id: (newProject as any).id, project_name: (newProject as any).name } as unknown as undefined,
    }).then(undefined, () => {});

    setCreateName("");
    setCreateDesc("");
    setCreating(false);
    setShowCreate(false);
    fetchProjects();
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editProject || !selectedOrgId) return;
    setEditError("");
    setUpdating(true);

    const { data, error } = await supabase
      .from("projects")
      .update({ name: editName.trim(), description: editDesc.trim() || null })
      .eq("id", editProject.id)
      .eq("org_id", selectedOrgId)
      .select();

    if (error) {
      setUpdating(false);
      setEditError(error.code === "23505" ? "Name already exists" : "Update failed");
      return;
    }
    if (!data || data.length === 0) {
      setUpdating(false);
      setEditError("No permission to edit this project");
      return;
    }

    supabase.rpc("emit_event", {
      p_org_id: selectedOrgId,
      p_type: "PROJECT_UPDATED" as const,
      p_metadata: { project_id: editProject.id, new_name: editName.trim() } as unknown as undefined,
    }).then(undefined, () => {});

    setUpdating(false);
    setEditProject(null);
    fetchProjects();
  };

  const handleDelete = async (project: ProjectRow) => {
    if (!selectedOrgId) return;
    const { error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", project.id)
      .eq("org_id", selectedOrgId);

    if (error) {
      alert("Delete failed");
      return;
    }

    supabase.rpc("emit_event", {
      p_org_id: selectedOrgId,
      p_type: "PROJECT_DELETED" as const,
      p_metadata: { project_id: project.id, project_name: project.name } as unknown as undefined,
    }).then(undefined, () => {});

    fetchProjects();
  };

  const columns: Column<ProjectRow>[] = [
    {
      key: "name",
      header: "Project Name",
      render: (row) => (
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="text-muted-foreground text-sm truncate max-w-[300px] block">
          {row.description || "—"}
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
    ...(canCreate
      ? [
          {
            key: "actions" as const,
            header: "Actions",
            className: "w-[100px]",
            render: (row: ProjectRow) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditProject(row);
                    setEditName(row.name);
                    setEditDesc(row.description ?? "");
                    setEditError("");
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <main className="p-6">
      <PageHeader
        title="Projects"
        description="Manage your workspace projects"
        actionLabel={canCreate ? "Create Project" : undefined}
        actionIcon={Plus}
        onAction={() => setShowCreate(true)}
      />

      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        emptyMessage="No projects yet."
        onRowClick={(row) => navigate(`/projects/${row.id}`)}
      />

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="My Project" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} placeholder="Optional description" className="min-h-[80px]" />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editProject} onOpenChange={(open) => !open && setEditProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="min-h-[80px]" />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProject(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updating || !editName.trim()}>
              {updating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Projects;
