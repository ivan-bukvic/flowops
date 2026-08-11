import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, Clock, Loader2, X } from "lucide-react";
import type { IntegrationCategory } from "@/lib/integrationColors";
import { styleFor } from "@/lib/integrationColors";

export type FeedStatus = "completed" | "failed" | "pending" | "running" | "neutral";

export interface FeedAction {
  id: string;
  label: string;
  category: IntegrationCategory;
  status: string;
}

export interface FeedItem {
  id: string;
  Icon: LucideIcon;
  iconBg: string;
  iconText: string;
  title: string;
  entityName?: string | null;
  createdAt: string;
  actions: FeedAction[];
  status: FeedStatus;
  /** Consecutive items with the same key + no actions get compressed into one row. */
  compressKey: string;
  onClick?: () => void;
}

const statusPill: Record<FeedStatus, { label: string; className: string; Icon: LucideIcon; spin?: boolean }> = {
  completed: { label: "Completed", className: "bg-success/10 text-success", Icon: Check },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive", Icon: X },
  pending: { label: "Pending", className: "bg-warning/10 text-warning", Icon: Clock },
  running: { label: "Running", className: "bg-info/10 text-info", Icon: Loader2, spin: true },
  neutral: { label: "", className: "", Icon: Clock },
};

const fmtTime = (d: string) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const fmtTimeShort = (d: string) =>
  new Date(d).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });

interface RenderRow {
  item: FeedItem;
  count: number;
  names: string[];
  timeLabel: string;
}

/** Compress consecutive same-key rows (with no automation actions) into one. */
function compress(items: FeedItem[]): RenderRow[] {
  const rows: RenderRow[] = [];
  for (const item of items) {
    const prev = rows[rows.length - 1];
    const mergeable = item.actions.length === 0;
    if (
      prev &&
      mergeable &&
      prev.item.actions.length === 0 &&
      prev.item.compressKey === item.compressKey &&
      prev.item.status === item.status
    ) {
      prev.count += 1;
      if (item.entityName) prev.names.push(item.entityName);
      // Range: earliest (this, since desc order) – latest (first seen)
      prev.timeLabel = `${fmtTimeShort(item.createdAt)}–${fmtTimeShort(prev.item.createdAt)}`;
    } else {
      rows.push({
        item,
        count: 1,
        names: item.entityName ? [item.entityName] : [],
        timeLabel: fmtTime(item.createdAt),
      });
    }
  }
  return rows;
}

const dayBucket = (d: string): "TODAY" | "YESTERDAY" | "EARLIER" => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return "TODAY";
  if (day.getTime() === yesterday.getTime()) return "YESTERDAY";
  return "EARLIER";
};

const ActivityRow = ({ row }: { row: RenderRow }) => {
  const { item, count, names, timeLabel } = row;
  const { Icon } = item;
  const pill = statusPill[item.status];
  const clickable = !!item.onClick;

  return (
    <div
      onClick={item.onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          item.onClick?.();
        }
      }}
      className={`flex items-start gap-3 rounded-xl bg-card px-4 py-3.5 shadow-card ${
        clickable ? "cursor-pointer transition-colors hover:bg-accent/40" : ""
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconText}`}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold text-foreground">
            {item.title}
            {item.entityName && count === 1 && (
              <span className="text-primary"> "{item.entityName}"</span>
            )}
          </span>
          {count > 1 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              ×{count}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {timeLabel}
          {count > 1 && names.length > 0 && (
            <span className="text-muted-foreground/80"> · {names.slice(0, 5).join(", ")}</span>
          )}
        </p>

        {item.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {item.actions.map((a) => (
              <span key={a.id} className="flex items-center gap-1.5 text-xs text-foreground/70">
                <span className={`h-1.5 w-1.5 rounded-full ${styleFor(a.category).dot}`} />
                {a.label}
                {a.status === "failed" && <span className="font-medium text-destructive">— Failed</span>}
                {a.status !== "completed" && a.status !== "failed" && (
                  <span className="italic text-muted-foreground">— Pending</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {item.status !== "neutral" && pill.label && (
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full py-1 pl-2 pr-2.5 text-[11px] font-semibold ${pill.className}`}
        >
          <pill.Icon className={`h-3 w-3 ${pill.spin ? "animate-spin" : ""}`} />
          {pill.label}
        </span>
      )}
    </div>
  );
};

interface ActivityFeedProps {
  /** Items sorted newest-first. */
  items: FeedItem[];
}

const ActivityFeed = ({ items }: ActivityFeedProps) => {
  const groups = useMemo(() => {
    const order: ("TODAY" | "YESTERDAY" | "EARLIER")[] = ["TODAY", "YESTERDAY", "EARLIER"];
    const map = new Map<string, FeedItem[]>();
    for (const item of items) {
      const b = dayBucket(item.createdAt);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(item);
    }
    return order
      .filter((b) => map.has(b))
      .map((label) => ({ label, rows: compress(map.get(label)!) }));
  }, [items]);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-2">
            {group.rows.map((row) => (
              <ActivityRow key={row.item.id} row={row} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
