import { useEffect, useState, useCallback } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { getDisplayName } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, UserPlus, Trash2, ArrowRightLeft, X, Check } from "lucide-react";
import InviteMemberModal from "@/components/settings/InviteMemberModal";
import RemoveMemberDialog from "@/components/settings/RemoveMemberDialog";
import TransferOwnershipDialog from "@/components/settings/TransferOwnershipDialog";
import type { Database } from "@/integrations/supabase/types";

type OrgRole = Database["public"]["Enums"]["org_role"];

interface MemberRow {
  user_id: string;
  email: string;
  full_name: string | null;
  role: OrgRole;
}

const Settings = () => {
  const { selectedOrgId, organizations } = useOrg();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<OrgRole | null>(null);

  // Workspace name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Role editing
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<OrgRole>("member");

  // Modals
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const currentOrg = organizations.find((o) => o.id === selectedOrgId);

  const fetchMembers = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);

    // Use the view that includes role
    const { data } = await supabase
      .from("org_members_simple")
      .select("user_id, email, full_name, role")
      .eq("org_id", selectedOrgId);

    setMembers(
      (data ?? []).map((m: any) => ({
        user_id: m.user_id ?? "",
        email: m.email ?? "—",
        full_name: m.full_name ?? null,
        role: (m.role as OrgRole) ?? "member",
      }))
    );
    setLoading(false);
  }, [selectedOrgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!selectedOrgId || !user) return;
    supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", selectedOrgId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCurrentRole((data?.role as OrgRole) ?? null));
  }, [selectedOrgId, user]);

  const isOwner = currentRole === "owner";
  const isAdmin = currentRole === "admin";
  const canManage = isOwner || isAdmin;

  // Save workspace name
  const handleSaveName = async () => {
    if (!selectedOrgId || !nameValue.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("organizations")
      .update({ name: nameValue.trim() })
      .eq("id", selectedOrgId);

    if (error) {
      toast.error("Failed to update workspace name.");
    } else {
      toast.success("Workspace name updated successfully.");
    }
    setSavingName(false);
    setEditingName(false);
  };

  // Update member role
  const handleUpdateRole = async (userId: string, newRole: OrgRole) => {
    if (!selectedOrgId) return;
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("org_id", selectedOrgId)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update member role.");
    } else {
      toast.success("Member role updated successfully.");
      fetchMembers();
    }
    setEditingRoleUserId(null);
  };

  return (
    <main className="p-6">
      <PageHeader title="Settings" description="Manage your workspace settings" />

      <div className="max-w-2xl space-y-6">
        {/* Workspace Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
            <CardDescription>General workspace settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={savingName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input value={currentOrg?.name ?? ""} disabled />
                  {canManage && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setNameValue(currentOrg?.name ?? "");
                        setEditingName(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Workspace ID</Label>
              <Input value={selectedOrgId ?? ""} disabled className="font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Members</CardTitle>
              <CardDescription>Manage workspace members and their roles</CardDescription>
            </div>
            {canManage && (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Invite Member
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-sm font-medium">{getDisplayName(member)}</span>
                      {member.full_name && <p className="text-xs text-muted-foreground">{member.email}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingRoleUserId === member.user_id ? (
                        <Select
                          value={editingRoleValue}
                          onValueChange={(v) => {
                            handleUpdateRole(member.user_id, v as OrgRole);
                          }}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${canManage && member.role !== "owner" ? "cursor-pointer hover:bg-accent" : ""}`}
                          onClick={() => {
                            if (canManage && member.role !== "owner") {
                              setEditingRoleUserId(member.user_id);
                              setEditingRoleValue(member.role);
                            }
                          }}
                        >
                          {member.role}
                        </Badge>
                      )}
                      {canManage && member.role !== "owner" && member.user_id !== user?.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoveTarget(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles</CardTitle>
            <CardDescription>Available roles in this workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(["owner", "admin", "member"] as const).map((role) => (
                <div key={role} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium capitalize">{role}</p>
                    <p className="text-xs text-muted-foreground">
                      {role === "owner" && "Full access, can delete workspace"}
                      {role === "admin" && "Can manage projects and members"}
                      {role === "member" && "Can view and contribute to projects"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">{role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this workspace</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Transfer Ownership
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => toast.error("This action is not yet implemented")}
              >
                Delete Workspace
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {selectedOrgId && (
        <>
          <InviteMemberModal
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            orgId={selectedOrgId}
            onInvited={fetchMembers}
          />
          {removeTarget && (
            <RemoveMemberDialog
              open={!!removeTarget}
              onOpenChange={(open) => !open && setRemoveTarget(null)}
              orgId={selectedOrgId}
              userId={removeTarget.user_id}
              email={removeTarget.email}
              onRemoved={fetchMembers}
            />
          )}
          <TransferOwnershipDialog
            open={transferOpen}
            onOpenChange={setTransferOpen}
            orgId={selectedOrgId}
            members={members}
            currentUserId={user?.id ?? ""}
            onTransferred={fetchMembers}
          />
        </>
      )}
    </main>
  );
};

export default Settings;
