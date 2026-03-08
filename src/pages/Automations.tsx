import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface AutomationLog {
  status: string | null;
  created_at: string | null;
}

interface AutomationRow {
  id: string;
  trigger_type: string;
  action_type: string;
  config_json: Record<string, any> | null;
  created_at: string | null;
  last_run?: string | null;
  last_status?: string | null;
}

const TRIGGERS = ["PROJECT_CREATED", "PROJECT_UPDATED", "PROJECT_DELETED", "MEMBER_ADDED", "MEMBER_REMOVED"];
const ACTIONS = ["EMAIL", "WEBHOOK", "LOG"];

const Automations = () => {
  const { selectedOrgId } = useOrg();
  const [rules, setRules] = useState<AutomationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchRules = async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("automation_rules")
      .select("id, trigger_type, action_type, config_json, created_at, automation_logs(status, created_at)")
      .eq("org_id", selectedOrgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setRules(
      ((data as any[]) ?? []).map((r) => {
        const logs: AutomationLog[] = Array.isArray(r.automation_logs) ? r.automation_logs : [];
        const sorted = logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
          ...r,
          last_run: sorted[0]?.created_at ?? null,
          last_status: sorted[0]?.status ?? null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [selectedOrgId]);

  const handleCreate = async () => {
    if (!selectedOrgId || !trigger || !action) return;
    setCreating(true);

    const config: Record<string, any> = {};
    if (action === "EMAIL") {
      config.email = email;
      config.subject = subject;
      config.message = message;
    }

    await supabase.from("automation_rules").insert({
      org_id: selectedOrgId,
      trigger_type: trigger,
      action_type: action,
      config_json: config,
    });

    setCreating(false);
    setShowCreate(false);
    setTrigger("");
    setAction("");
    setEmail("");
    setSubject("");
    setMessage("");
    fetchRules();
  };

  const columns: Column<AutomationRow>[] = [
    {
      key: "trigger_type",
      header: "Trigger",
      render: (row) => <span className="text-sm font-medium font-mono">{row.trigger_type}</span>,
    },
    {
      key: "action_type",
      header: "Action",
      render: (row) => <span className="text-sm font-mono">{row.action_type}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: () => <StatusBadge status="active" />,
    },
    {
      key: "created_at",
      header: "Created",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <main className="p-6">
      <PageHeader
        title="Automations"
        description="Event-driven automation rules"
        actionLabel="Create Automation"
        actionIcon={Plus}
        onAction={() => setShowCreate(true)}
      />

      <DataTable columns={columns} data={rules} loading={loading} emptyMessage="No automation rules yet." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {action === "EMAIL" && (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recipient@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Email body" className="min-h-[80px]" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !trigger || !action}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Automations;
