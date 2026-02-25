import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

const Projects = () => {
  const { selectedOrgId } = useOrg();
  const [projectsList, setProjectsList] = useState<ProjectRow[]>([]);

  useEffect(() => {
    if (!selectedOrgId) return;

    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, description, created_by, created_at")
        .eq("org_id", selectedOrgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setProjectsList((data as ProjectRow[]) ?? []);
    };

    fetchProjects();
  }, [selectedOrgId]);

  return (
    <main className="flex-1 px-6 py-4">
      <h1 className="text-lg font-semibold text-foreground mb-3">Projects</h1>
      {projectsList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {projectsList.map((project) => (
            <div key={project.id} className="py-2.5">
              <p className="text-sm font-semibold text-foreground">{project.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(project.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Projects;
