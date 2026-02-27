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

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedOrgId } = useOrg();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectEvents, setProjectEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !selectedOrgId) return;
    const fetchProject = async () => {
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
    fetchProject();
  }, [projectId, selectedOrgId]);

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

  useEffect(() => {
    if (!projectId) return;
    const fetchMembers = async () => {
      setMembersLoading(true);
      const { data } = await supabase
        .from("project_members")
        .select("id, user_id, role, created_at, profiles(email)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      setProjectMembers((data as unknown as MemberRow[]) ?? []);
      setMembersLoading(false);
    };
    fetchMembers();
  }, [projectId]);

  if (loading) return <main className="flex-1 px-6 py-4"><p className="text-sm text-muted-foreground">Loading...</p></main>;
  if (!project) return <main className="flex-1 px-6 py-4"><p className="text-sm text-muted-foreground">Project not found.</p><Link to="/projects" className="text-sm text-primary hover:underline mt-2 inline-block">Back to Projects</Link></main>;

  return (
    <main className="flex-1 px-6 py-4">
      <Link to="/projects" className="text-sm text-primary hover:underline">← Back to Projects</Link>
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
              <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{JSON.stringify(event.metadata, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Project Members</h2>
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
