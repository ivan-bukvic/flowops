import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrgRole = Database["public"]["Enums"]["org_role"];

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onInvited: () => void;
}

const InviteMemberModal = ({ open, onOpenChange, orgId, onInvited }: InviteMemberModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address.");
      return;
    }

    setLoading(true);

    // Look up user by email in profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();

    if (profileError || !profile) {
      toast.error("User not found. They must sign up first.");
      setLoading(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("organization_members")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existing) {
      toast.error("User is already a member of this workspace.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("organization_members").insert({
      org_id: orgId,
      user_id: profile.id,
      role,
    });

    if (error) {
      toast.error("Failed to invite member.");
    } else {
      toast.success("Member invited successfully.");
      // Emit event
      await supabase.rpc("emit_event", {
        p_org_id: orgId,
        p_type: "MEMBER_ADDED",
        p_metadata: { user_id: profile.id, role },
      });
      onInvited();
      onOpenChange(false);
      setEmail("");
      setRole("member");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>Add a new member to this workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? "Inviting…" : "Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberModal;
