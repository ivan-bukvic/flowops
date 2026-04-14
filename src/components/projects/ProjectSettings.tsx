import { useState } from "react";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Copy, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const supabase: any = rawSupabase;

interface ProjectSettingsProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  };
  creatorDisplay: string;
  isAdmin: boolean;
  onProjectUpdate: (updates: { name: string; description: string | null }) => void;
}

const ProjectSettings = ({ project, creatorDisplay, isAdmin, onProjectUpdate }: ProjectSettingsProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({ name: name.trim(), description: description.trim() || null })
      .eq("id", project.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update project");
      return;
    }
    toast.success("Project updated");
    onProjectUpdate({ name: name.trim(), description: description.trim() || null });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(project.id);
    setCopied(true);
    toast.success("Project ID copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", project.id);
    setDeleting(false);
    if (error) {
      toast.error("Failed to delete project");
      return;
    }
    toast.success("Project deleted");
    navigate("/projects");
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Project Information */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Project Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project Name</Label>
            {isAdmin ? (
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <p className="text-sm">{name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Created</Label>
            <p className="text-sm text-muted-foreground">{new Date(project.created_at).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="project-desc">Description</Label>
            {isAdmin ? (
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a project description..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{description || "No description"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Project Owner</Label>
            <p className="text-sm">{creatorDisplay}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex justify-end">
            <Button size="sm" disabled={saving} onClick={handleSave}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Project ID */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Project ID</h3>
        <div className="flex items-center gap-2">
          <Input readOnly value={project.id} className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={handleCopyId}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        {copied && <p className="text-xs text-muted-foreground">Copied!</p>}
      </div>

      {/* Danger Zone */}
      {isAdmin && (
        <div className="rounded-lg border border-destructive/30 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Deleting this project is permanent and cannot be undone. All documents and data will be removed.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete Project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All project documents, members, and AI queries will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting..." : "Delete Project"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default ProjectSettings;
