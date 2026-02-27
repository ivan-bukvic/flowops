import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
}

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedOrgId } = useOrg();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !selectedOrgId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("projects")
        .select("id, name, description, created_at, created_by")
        .eq("id", projectId)
        .eq("org_id", selectedOrgId)
        .is("deleted_at", null)
        .maybeSingle();
      setProject(data as ProjectRow | null);
      setLoading(false);
    };
    fetch();
  }, [projectId, selectedOrgId]);

  if (loading) return <main className="flex-1 px-6 py-4"><p className="text-sm text-muted-foreground">Loading...</p></main>;
  if (!project) return <main className="flex-1 px-6 py-4"><p className="text-sm text-muted-foreground">Project not found.</p><Link to="/projects" className="text-sm text-primary hover:underline mt-2 inline-block">Back to Projects</Link></main>;

  return (
    <main className="flex-1 px-6 py-4">
      <Link to="/projects" className="text-sm text-primary hover:underline">← Back to Projects</Link>
      <h1 className="text-lg font-semibold text-foreground mt-3">{project.name}</h1>
      {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
      <p className="text-xs text-muted-foreground mt-2">Created {new Date(project.created_at).toLocaleString()}</p>
    </main>
  );
};

export default ProjectDetail;
