import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

const Projects = () => {
  const { selectedOrgId } = useOrg();
  const { user } = useAuth();
  const [projectsList, setProjectsList] = useState<ProjectRow[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const fetchProjects = async () => {
    if (!selectedOrgId) return;
    const { data } = await supabase
      .from("projects")
      .select("id, name, description, created_by, created_at")
      .eq("org_id", selectedOrgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setProjectsList((data as ProjectRow[]) ?? []);
  };

  useEffect(() => {
    if (!selectedOrgId) return;
    fetchProjects();
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId || !user) {
      setCurrentRole(null);
      return;
    }
    const fetchRole = async () => {
      const { data } = await supabase
        .from("organization_members")
        .select("role")
        .eq("org_id", selectedOrgId)
        .eq("user_id", user.id)
        .maybeSingle();
      setCurrentRole(data?.role ?? null);
    };
    fetchRole();
  }, [selectedOrgId, user]);

  const handleDelete = async (project: ProjectRow) => {
    if (!selectedOrgId) return;

    const { error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", project.id)
      .eq("org_id", selectedOrgId);

    if (error) {
      console.error("DELETE ERROR:", error);
      alert("Delete failed. Check console.");
      return;
    }

    await supabase.rpc("emit_event", {
      p_org_id: selectedOrgId,
      p_type: "PROJECT_DELETED" as const,
      p_metadata: {
        project_id: project.id,
        project_name: project.name,
      } as unknown as undefined,
    });

    fetchProjects();
  };

  const canCreate = currentRole === "owner" || currentRole === "admin";

  const handleCreate = async () => {
    if (!selectedOrgId || !user || !projectName.trim()) return;
    setFormError(null);
    setIsSubmitting(true);

    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({
        org_id: selectedOrgId,
        name: projectName.trim(),
        description: projectDescription.trim() || null,
        created_by: user.id,
      })
      .select("id, name, description, created_by, created_at")
      .single();

    if (error) {
      setIsSubmitting(false);
      if (error.code === "23505") {
        setFormError("A project with this name already exists in this workspace.");
      } else {
        setFormError(error.message);
      }
      return;
    }

    supabase
      .rpc("emit_event", {
        p_org_id: selectedOrgId,
        p_type: "PROJECT_CREATED" as const,
        p_metadata: {
          project_id: (newProject as ProjectRow).id,
          project_name: (newProject as ProjectRow).name,
        } as unknown as undefined,
      })
      .then(undefined, () => {});

    setProjectName("");
    setProjectDescription("");
    setIsSubmitting(false);
    fetchProjects();
  };

  return (
    <main className="flex-1 px-6 py-4">
      <h1 className="text-lg font-semibold text-foreground mb-3">Projects</h1>

      {canCreate && (
        <div className="mb-4 space-y-2 max-w-md">
          <Input placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <Textarea
            placeholder="Description (optional)"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="min-h-[60px]"
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button onClick={handleCreate} disabled={isSubmitting || !projectName.trim()} size="sm">
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </div>
      )}

      {projectsList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {projectsList.map((project) => (
            <div key={project.id} className="py-2.5">
              {editingProjectId === project.id ? (
                <div className="space-y-2 max-w-md">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Project name"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="min-h-[60px]"
                  />
                  {updateError && <p className="text-sm text-destructive">{updateError}</p>}
                  <div className="flex items-center gap-2">
                    <Button size="sm" disabled={isUpdating || !editName.trim()}>
                      {isUpdating ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingProjectId(null)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(project.created_at).toLocaleString()}</p>
                  </div>
                  {canCreate && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingProjectId(project.id);
                          setEditName(project.name);
                          setEditDescription(project.description ?? "");
                          setUpdateError("");
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Projects;
