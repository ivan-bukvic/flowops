import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CreateWorkspace = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSelectedOrgId } = useOrg();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to create a workspace.");
        setIsSubmitting(false);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: name.trim() })
        .select("id")
        .single();

      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          org_id: org.id,
          user_id: session.user.id,
          role: "owner" as const,
        });

      if (memberError) throw memberError;

      setSelectedOrgId(org.id);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to create workspace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 p-6">
        <h1 className="text-3xl font-bold text-foreground">Create Workspace</h1>

        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Organization"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Workspace"}
        </Button>
      </form>
    </div>
  );
};

export default CreateWorkspace;
