import {
  Building2,
  Crown,
  FolderMinus,
  FolderEdit,
  FolderPlus,
  Upload,
  UserMinus,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { actionCategory } from "@/lib/integrationColors";
import type { FeedAction, FeedItem, FeedStatus } from "@/components/shared/ActivityFeed";

type Tone = "success" | "danger" | "neutral" | "info";

const toneClasses: Record<Tone, { bg: string; text: string }> = {
  success: { bg: "bg-success/10", text: "text-success" },
  danger: { bg: "bg-destructive/10", text: "text-destructive" },
  neutral: { bg: "bg-primary/10", text: "text-primary" },
  info: { bg: "bg-info/10", text: "text-info" },
};

interface EventMeta {
  icon: LucideIcon;
  title: string;
  tone: Tone;
}

const EVENT_META: Record<string, EventMeta> = {
  PROJECT_CREATED: { icon: FolderPlus, title: "Project created", tone: "success" },
  PROJECT_UPDATED: { icon: FolderEdit, title: "Project updated", tone: "neutral" },
  PROJECT_DELETED: { icon: FolderMinus, title: "Project deleted", tone: "danger" },
  MEMBER_ADDED: { icon: UserPlus, title: "Member added to workspace", tone: "success" },
  MEMBER_REMOVED: { icon: UserMinus, title: "Member removed from workspace", tone: "danger" },
  PROJECT_MEMBER_ADDED: { icon: UserPlus, title: "Member added to project", tone: "success" },
  PROJECT_MEMBER_REMOVED: { icon: UserMinus, title: "Member removed from project", tone: "danger" },
  PROJECT_MEMBER_UPDATED: { icon: UserPlus, title: "Member role updated", tone: "neutral" },
  WORKSPACE_CREATED: { icon: Building2, title: "Workspace created", tone: "success" },
  OWNERSHIP_TRANSFERRED: { icon: Crown, title: "Ownership transferred", tone: "neutral" },
  DOCUMENT_UPLOADED: { icon: Upload, title: "Document uploaded", tone: "info" },
};

const actionLabels: Record<string, string> = {
  EMAIL: "Email sent",
  SLACK_MESSAGE: "Slack message sent",
  GOOGLE_CALENDAR_EVENT: "Calendar event created",
  WEBHOOK: "Webhook fired",
  LOG: "Logged",
};

export interface RawEvent {
  id: string;
  type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface RawLog {
  id: string;
  status: string;
  event_id: string | null;
  action_type: string;
}

export function entityName(type: string, metadata: Record<string, unknown> | null): string | null {
  const m = metadata ?? {};
  switch (type) {
    case "PROJECT_CREATED":
    case "PROJECT_UPDATED":
    case "PROJECT_DELETED":
    case "PROJECT_MEMBER_ADDED":
    case "PROJECT_MEMBER_REMOVED":
    case "PROJECT_MEMBER_UPDATED":
      return (m.project_name as string) ?? null;
    case "WORKSPACE_CREATED":
      return (m.org_name as string) ?? null;
    case "DOCUMENT_UPLOADED":
      return (m.document_name as string) ?? null;
    default:
      return null;
  }
}

export function computeStatus(actions: FeedAction[]): FeedStatus {
  if (actions.length === 0) return "neutral";
  if (actions.some((a) => a.status === "failed")) return "failed";
  if (actions.every((a) => a.status === "completed")) return "completed";
  if (actions.some((a) => a.status === "running" || a.status === "processing")) return "running";
  return "pending";
}

/** Build a normalized ActivityFeed item from an event + its automation logs. */
export function toFeedItem(
  evt: RawEvent,
  logs: RawLog[],
  onClick?: () => void,
): FeedItem {
  const meta = EVENT_META[evt.type] ?? {
    icon: Zap,
    title: evt.type.replace(/_/g, " ").toLowerCase(),
    tone: "neutral" as Tone,
  };
  const tone = toneClasses[meta.tone];

  const actions: FeedAction[] = logs
    .filter((l) => l.event_id === evt.id)
    .map((l) => ({
      id: l.id,
      label: actionLabels[l.action_type] ?? l.action_type.replace(/_/g, " ").toLowerCase(),
      category: actionCategory(l.action_type),
      status: l.status,
    }));

  return {
    id: evt.id,
    Icon: meta.icon,
    iconBg: tone.bg,
    iconText: tone.text,
    title: meta.title,
    entityName: entityName(evt.type, evt.metadata),
    createdAt: evt.created_at,
    actions,
    status: computeStatus(actions),
    compressKey: evt.type,
    onClick,
  };
}

export { actionLabels };
export type { FeedAction, FeedItem };
