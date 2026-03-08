import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface MemberRow {
  user_id: string;
  email: string;
  role: string;
}

const Settings = () => {
  const { selectedOrgId, organizations } = useOrg();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const currentOrg = organizations.find((o) => o.id === selectedOrgId);

  useEffect(() => {
    if (!selectedOrgId) return;

    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any).rpc("get_org_members_with_email", {
        p_org_id: selectedOrgId,
      });
      setMembers(
        (data ?? []).map((m: any) => ({
          user_id: m.user_id,
          email: m.email ?? "—",
          role: "member",
        }))
      );
      setLoading(false);
    };

    fetchData();
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId || !user) return;
    supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", selectedOrgId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCurrentRole(data?.role ?? null));
  }, [selectedOrgId, user]);

  const isOwner = currentRole === "owner";

  const memberColumns: Column<MemberRow>[] = [
    {
      key: "email",
      header: "User",
      render: (row) => <span className="text-sm font-medium">{row.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.role}
        </Badge>
      ),
    },
  ];

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
              <Input value={currentOrg?.name ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Workspace ID</Label>
              <Input value={selectedOrgId ?? ""} disabled className="font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members</CardTitle>
            <CardDescription>Manage workspace members and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={memberColumns}
              data={members}
              loading={loading}
              emptyMessage="No members found."
            />
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
              {["owner", "admin", "member"].map((role) => (
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
            <CardContent>
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
    </main>
  );
};

export default Settings;
