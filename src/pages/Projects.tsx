import { useEffect, useState } from "react";
import { triggerAutomations } from "@/lib/triggerAutomations";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users, FolderKanban } from "lucide-react";

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

  const [deleteProject, setDeleteProject] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      })),
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

    // Fetch user profile (for full name)
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

    // Fetch organization name
    const { data: org } = await supabase.from("organizations").select("name").eq("id", selectedOrgId).single();

    // Fetch member count (just created project → 1 member)
    const memberCount = 1;

    supabase
      .rpc("emit_event", {
        p_org_id: selectedOrgId,
        p_type: "PROJECT_CREATED" as const,
        p_metadata: {
          project_id: (newProject as any).id,
          project_name: (newProject as any).name,
          user_name: profile?.full_name || "User",
          org_name: org?.name || "Workspace",
          member_count: memberCount,
        },
      })
      .then(
        () => triggerAutomations(),
        () => {},
      );

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

    supabase
      .rpc("emit_event", {
        p_org_id: selectedOrgId,
        p_type: "PROJECT_UPDATED" as const,
        p_metadata: { project_id: editProject.id, new_name: editName.trim() } as unknown as undefined,
      })
      .then(
        () => triggerAutomations(),
        () => {},
      );

    setUpdating(false);
    setEditProject(null);
    fetchProjects();
  };

  const handleDelete = async (project: ProjectRow) => {
    if (!selectedOrgId) return;
    setDeleting(true);
    const { data, error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", project.id)
      .eq("org_id", selectedOrgId)
      .select();

    if (error) {
      console.error("[Projects] delete failed", error);
      setDeleting(false);
      alert("Delete failed: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.warn("[Projects] no rows updated — likely RLS / no permission", project.id);
      setDeleting(false);
      alert("You don't have permission to delete this project.");
      return;
    }

    console.log("[Projects] soft-deleted", project.id);

    // Optimistically remove from local state
    setProjects((prev) => prev.filter((p) => p.id !== project.id));

    supabase
      .rpc("emit_event", {
        p_org_id: selectedOrgId,
        p_type: "PROJECT_DELETED" as const,
        p_metadata: { project_id: project.id, project_name: project.name } as unknown as undefined,
      })
      .then(
        () => triggerAutomations(),
        () => {},
      );

    setDeleting(false);
    setDeleteProject(null);
    fetchProjects();
  };

  const columns: Column<ProjectRow>[] = [
    {
      key: "name",
      header: "Project Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-[14px]">{row.name}</span>
            {row.description && (
              <p className="text-[12px] text-muted-foreground/60 truncate max-w-[280px]">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "members",
      header: "Members",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[13px] text-muted-foreground font-medium">{row.member_count ?? 0}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
    },
    ...(canCreate
      ? [
          {
            key: "actions" as const,
            header: "Actions",
            className: "w-[100px]",
            render: (row: ProjectRow) => (
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteProject(row);
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
    <main className="p-3 sm:p-6">
      <PageHeader
        title="Projects"
        description="Manage your workspace projects"
        actionLabel={canCreate ? "Create Project" : undefined}
        actionIcon={Plus}
        onAction={() => setShowCreate(true)}
      />

      {/* Desktop / tablet table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={projects}
          loading={loading}
          emptyIcon={FolderKanban}
          emptyTitle="No projects yet"
          emptyDescription="Create your first project to get started."
          emptyActionLabel={canCreate ? "Create Project" : undefined}
          emptyActionIcon={Plus}
          onEmptyAction={canCreate ? () => setShowCreate(true) : undefined}
          onRowClick={(row) => navigate(`/projects/${row.id}`)}
        />
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border border-border/80 rounded-lg bg-card p-4 h-[110px] animate-pulse"
            />
          ))
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg bg-card p-8 text-center">
            <FolderKanban className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create your first project to get started.
            </p>
            {canCreate && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="rounded-2xl bg-card p-4 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderKanban className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-[14px] truncate">
                    {p.name}
                  </p>
                  {p.description && (
                    <p className="text-[12px] text-muted-foreground/70 truncate mt-0.5">
                      {p.description}
                    </p>
                  )}
                </div>
                {canCreate && (
                  <div className="flex items-center gap-0.5 -mr-1.5 -mt-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditProject(p);
                        setEditName(p.name);
                        setEditDesc(p.description ?? "");
                        setEditError("");
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteProject(p);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 pl-12 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                  {p.member_count ?? 0} members
                </span>
                <span>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

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
              <Textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Optional description"
                className="min-h-[80px]"
              />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
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
            <Button variant="outline" onClick={() => setEditProject(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating || !editName.trim()}>
              {updating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={(open) => !open && !deleting && setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteProject ? `"${deleteProject.name}" will be removed from your workspace.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteProject) handleDelete(deleteProject);
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Projects;
