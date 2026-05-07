import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Zap,
  Mail,
  MessageSquare,
  Calendar,
  Globe,
  FileText,
  FolderPlus,
  FolderEdit,
  FolderMinus,
  UserPlus,
  UserMinus,
  Building2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";

interface RuleRow {
  id: string;
  trigger_type: string;
  action_type: string;
  config_json: Record<string, any> | null;
  created_at: string | null;
  last_run?: string | null;
  last_status?: string | null;
}

interface Props {
  rules: RuleRow[];
  loading: boolean;
  onCreate: () => void;
}

const triggerIcons: Record<string, React.ElementType> = {
  PROJECT_CREATED: FolderPlus,
  PROJECT_UPDATED: FolderEdit,
  PROJECT_DELETED: FolderMinus,
  PROJECT_MEMBER_ADDED: UserPlus,
  PROJECT_MEMBER_REMOVED: UserMinus,
  MEMBER_ADDED: UserPlus,
  MEMBER_REMOVED: UserMinus,
  WORKSPACE_CREATED: Building2,
};

const triggerLabels: Record<string, string> = {
  PROJECT_CREATED: "Project Created",
  PROJECT_UPDATED: "Project Updated",
  PROJECT_DELETED: "Project Deleted",
  PROJECT_MEMBER_ADDED: "Project Member Added",
  PROJECT_MEMBER_REMOVED: "Project Member Removed",
  MEMBER_ADDED: "Member Added",
  MEMBER_REMOVED: "Member Removed",
  WORKSPACE_CREATED: "Workspace Created",
};

const actionIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SLACK_MESSAGE: MessageSquare,
  GOOGLE_CALENDAR_EVENT: Calendar,
  WEBHOOK: Globe,
  LOG: FileText,
};

const actionLabels: Record<string, string> = {
  EMAIL: "Email notification",
  SLACK_MESSAGE: "Slack message",
  GOOGLE_CALENDAR_EVENT: "Calendar event",
  WEBHOOK: "Webhook",
  LOG: "Log entry",
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const RulesList = ({ rules, loading, onCreate }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState("all");

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      if (triggerFilter !== "all" && r.trigger_type !== triggerFilter) return false;
      if (statusFilter !== "all") {
        const status = r.last_status ?? "inactive";
        if (statusFilter === "active" && status === "failed") return false;
        if (statusFilter === "failed" && status !== "failed") return false;
        if (statusFilter === "inactive" && r.last_run) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const t = (triggerLabels[r.trigger_type] ?? r.trigger_type).toLowerCase();
        const a = (actionLabels[r.action_type] ?? r.action_type).toLowerCase();
        if (!t.includes(q) && !a.includes(q)) return false;
      }
      return true;
    });
  }, [rules, search, statusFilter, triggerFilter]);

  const triggerValues = Array.from(new Set(rules.map((r) => r.trigger_type)));

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-5 rounded-xl border border-border bg-card"
          >
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 rounded-lg border border-border bg-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="failed">Error</SelectItem>
            <SelectItem value="inactive">Never run</SelectItem>
          </SelectContent>
        </Select>
        <Select value={triggerFilter} onValueChange={setTriggerFilter}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            {triggerValues.map((t) => (
              <SelectItem key={t} value={t}>
                {triggerLabels[t] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onCreate} size="sm" className="h-9 gap-1.5">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border bg-card">
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mb-3">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {rules.length === 0 ? "No automations yet" : "No rules match your filters"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {rules.length === 0
              ? "Set up an automation to trigger actions from events."
              : "Try adjusting your search or filters."}
          </p>
          {rules.length === 0 && (
            <Button onClick={onCreate} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rule) => {
            const TriggerIcon = triggerIcons[rule.trigger_type] ?? Zap;
            const ActionIcon = actionIcons[rule.action_type] ?? FileText;
            const status = rule.last_status;
            const isFailed = status === "failed";
            const isCompleted = status === "completed";
            const isActive = !!rule.last_run && !isFailed;

            const leftBorder = isFailed
              ? "border-l-2 border-l-[hsl(0,84%,60%)]"
              : isActive
              ? "border-l-2 border-l-[hsl(160,84%,39%)]"
              : "border-l-2 border-l-border";

            const statusBadge = isFailed
              ? "bg-[hsl(0,84%,60%,0.08)] text-[hsl(0,84%,60%)]"
              : isCompleted
              ? "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]"
              : isActive
              ? "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]"
              : "bg-muted text-muted-foreground";

            const statusLabel = isFailed
              ? "Error"
              : isCompleted
              ? "Completed"
              : isActive
              ? "Active"
              : "Inactive";

            return (
              <div
                key={rule.id}
                className={`group rounded-xl border border-border bg-card hover:shadow-[0_3px_10px_0_rgba(0,0,0,0.06)] hover:-translate-y-px transition-all duration-150 ${leftBorder}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4">
                  {/* Trigger -> Action flow */}
                  <div className="flex items-center gap-2.5 min-w-0 md:flex-[2]">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/8 border border-primary/15 shrink-0">
                      <TriggerIcon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wide text-primary">
                        {rule.trigger_type}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border shrink-0">
                      <ActionIcon className="h-3.5 w-3.5 text-foreground/70" />
                      <span className="text-[12px] font-medium text-foreground/90">
                        {actionLabels[rule.action_type] ?? rule.action_type}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-col gap-0.5 md:flex-1 text-xs text-muted-foreground">
                    <span>
                      Last run:{" "}
                      <span className="text-foreground/80 font-medium">
                        {rule.last_run ? formatTimeAgo(new Date(rule.last_run)) : "Never"}
                      </span>
                    </span>
                    <span>
                      Created:{" "}
                      <span className="text-foreground/80 font-medium">
                        {rule.created_at
                          ? new Date(rule.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex md:justify-end shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBadge}`}
                    >
                      {isFailed ? (
                        <XCircle className="h-3 w-3" />
                      ) : isActive || isCompleted ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : null}
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RulesList;
