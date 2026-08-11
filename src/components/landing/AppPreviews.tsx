import type { ReactNode } from "react";
import {
  Bot,
  Calendar,
  ChevronDown,
  FileText,
  FolderKanban,
  FolderMinus,
  FolderPlus,
  Mail,
  MessageSquare,
  UserPlus,
  Webhook,
  Zap,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import ActivityFeed, { type FeedItem } from "@/components/shared/ActivityFeed";
import { styleFor, type IntegrationCategory } from "@/lib/integrationColors";

/**
 * Static, presentational previews of the real (redesigned) app surfaces for the
 * marketing landing page. These deliberately reuse the same shared primitives
 * used inside the app — StatCard, ActivityFeed, the integration color system —
 * so the landing stays visually in sync with the product with zero duplication.
 */

/** macOS-style browser window chrome that frames each app preview. */
export const BrowserFrame = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_hsl(222_47%_11%/0.05),0_30px_60px_-30px_hsl(222_47%_11%/0.42)]">
    <div className="flex items-center gap-1.5 border-b border-border/70 bg-muted/40 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[hsl(6_78%_71%)]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[hsl(45_90%_66%)]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[hsl(145_55%_65%)]" />
    </div>
    <div className="bg-background p-4 sm:p-5">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Shared static data                                                  */
/* ------------------------------------------------------------------ */

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

const todayItems: FeedItem[] = [
  {
    id: "p-member",
    Icon: UserPlus,
    iconBg: "bg-success/10",
    iconText: "text-success",
    title: "Member added to project",
    entityName: "Test1",
    createdAt: iso(2 * MIN),
    actions: [],
    status: "completed",
    compressKey: "PROJECT_MEMBER_ADDED",
  },
  {
    id: "p-created",
    Icon: FolderPlus,
    iconBg: "bg-success/10",
    iconText: "text-success",
    title: "Project created",
    entityName: "Test1",
    createdAt: iso(3 * MIN),
    actions: [
      { id: "a1", label: "Email sent", category: "email", status: "completed" },
      { id: "a2", label: "Slack message sent", category: "slack", status: "completed" },
      { id: "a3", label: "Calendar event created", category: "calendar", status: "completed" },
    ],
    status: "completed",
    compressKey: "PROJECT_CREATED",
  },
];

// Five consecutive deletions that ActivityFeed compresses into one "×5" row.
const deletedNames = ["Test 7", "Test 6", "Test5", "Test 4", "Test 3"];
const earlierItems: FeedItem[] = [
  ...deletedNames.map((name, i) => ({
    id: `del-${i}`,
    Icon: FolderMinus,
    iconBg: "bg-destructive/10",
    iconText: "text-destructive",
    title: "Project deleted",
    entityName: name,
    createdAt: iso(3 * DAY + i * MIN),
    actions: [],
    status: "completed" as const,
    compressKey: "PROJECT_DELETED",
  })),
  {
    id: "auto-run",
    Icon: Zap,
    iconBg: "bg-automation/10",
    iconText: "text-automation",
    title: 'Automation "Slack notify" run',
    entityName: null,
    createdAt: iso(3 * DAY + 30 * MIN),
    actions: [],
    status: "pending",
    compressKey: "AUTOMATION_RUN",
  },
];

/* ------------------------------------------------------------------ */
/* Dashboard preview                                                   */
/* ------------------------------------------------------------------ */

const metricTiles = [
  { title: "Projects", value: 2, suffix: "active", icon: FolderKanban, accentText: "text-primary", accentBg: "bg-primary/10", accentBar: "bg-primary", series: [38, 55, 30, 70, 48, 85] },
  { title: "Documents", value: 1, suffix: "uploaded", icon: FileText, accentText: "text-info", accentBg: "bg-info/10", accentBar: "bg-info", series: [45, 42, 50, 44, 48, 52] },
  { title: "Automations", value: 4, suffix: "active", icon: Zap, accentText: "text-automation", accentBg: "bg-automation/10", accentBar: "bg-automation", series: [25, 42, 35, 66, 58, 92] },
  { title: "AI Queries", value: 2, suffix: "total", icon: Bot, accentText: "text-slack", accentBg: "bg-slack/10", accentBar: "bg-slack", series: [28, 34, 62, 50, 88, 74] },
];

export const DashboardPreview = () => (
  <BrowserFrame>
    <p className="font-display text-base font-bold tracking-tight text-foreground">Welcome back, Jonathan</p>
    <p className="mt-0.5 text-xs text-muted-foreground">Here's what's happening in your workspace today</p>

    <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {metricTiles.map((m) => (
        <StatCard
          key={m.title}
          title={m.title}
          value={m.value}
          suffix={m.suffix}
          icon={m.icon}
          accentText={m.accentText}
          accentBg={m.accentBg}
          accentBar={m.accentBar}
          series={m.series}
        />
      ))}
    </div>

    <div className="mt-5">
      <ActivityFeed items={todayItems} />
    </div>
  </BrowserFrame>
);

/* ------------------------------------------------------------------ */
/* Automation builder preview                                          */
/* ------------------------------------------------------------------ */

const actionMenu: { label: string; icon: typeof Mail; category: IntegrationCategory }[] = [
  { label: "Email", icon: Mail, category: "email" },
  { label: "Slack", icon: MessageSquare, category: "slack" },
  { label: "Calendar", icon: Calendar, category: "calendar" },
  { label: "Webhook", icon: Webhook, category: "webhook" },
  { label: "Log", icon: FileText, category: "log" },
];

const FieldBox = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{children}</div>
);

export const BuilderPreview = () => {
  const emailStyle = styleFor("email");
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_hsl(222_47%_11%/0.05),0_30px_70px_-28px_hsl(0_0%_0%/0.6)] sm:p-5">
      {/* When this happens */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Zap className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-foreground">When this happens</p>
          <p className="text-[11px] text-muted-foreground">Choose what starts this automation</p>
        </div>
      </div>
      <p className="mt-3 mb-1.5 text-[11px] font-semibold text-foreground/80">Event</p>
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium text-foreground">
        Project Created
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Then do this */}
      <p className="mt-4 text-[13px] font-bold text-foreground">Then do this</p>
      <p className="mb-3 text-[11px] text-muted-foreground">Choose what happens when this event is triggered</p>

      <div className="flex gap-3">
        {/* Action menu — colored per integration */}
        <div className="flex w-[112px] shrink-0 flex-col gap-0.5">
          {actionMenu.map((a, i) => {
            const style = styleFor(a.category);
            const active = i === 0;
            return (
              <div
                key={a.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold ${
                  active ? `${style.bg} ${style.text}` : "text-foreground/70"
                }`}
              >
                <a.icon className={`h-3.5 w-3.5 ${style.text}`} />
                {a.label}
              </div>
            );
          })}
        </div>

        {/* Config */}
        <div className="min-w-0 flex-1">
          <p className={`text-[9.5px] font-bold uppercase tracking-wider ${emailStyle.text}`}>Action: Email</p>
          <p className="mt-0.5 text-[12.5px] font-bold text-foreground">Email content</p>
          <p className="mb-2.5 text-[10.5px] text-muted-foreground">
            This email will be sent automatically when the event happens
          </p>

          <p className="mb-1 text-[10.5px] font-semibold text-foreground/80">To</p>
          <FieldBox>recipient@example.com</FieldBox>
          <p className="mb-1 mt-2 text-[10.5px] font-semibold text-foreground/80">Subject</p>
          <FieldBox>Notification subject</FieldBox>
          <p className="mb-1 mt-2 text-[10.5px] font-semibold text-foreground/80">Message</p>
          <div className="h-9 rounded-lg border-[1.5px] border-primary bg-primary/[0.04] px-3 py-2 text-xs text-foreground/70">
            New Project has been created.
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Use variables:</span>
            {["{project_name}", "{user_email}", "{event_type}"].map((v) => (
              <span
                key={v}
                className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9.5px] text-primary"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Framed variant used in the Automations product section. */
export const BuilderPreviewFramed = () => (
  <BrowserFrame>
    <p className="font-display text-base font-bold tracking-tight text-foreground">Automations</p>
    <p className="mb-3 text-xs text-muted-foreground">Event-driven automation rules</p>
    <BuilderPreview />
  </BrowserFrame>
);

/* ------------------------------------------------------------------ */
/* Events preview                                                      */
/* ------------------------------------------------------------------ */

export const EventsPreview = () => (
  <BrowserFrame>
    <p className="font-display text-base font-bold tracking-tight text-foreground">Events</p>
    <p className="text-xs text-muted-foreground">Activity timeline for your workspace</p>

    <div className="my-3 flex gap-2">
      <div className="flex-1 rounded-lg bg-card px-3 py-1.5 text-[11px] text-muted-foreground shadow-card">
        Search timeline...
      </div>
      <div className="rounded-lg bg-card px-3 py-1.5 text-[11px] text-foreground shadow-card">All Statuses</div>
      <div className="hidden rounded-lg bg-card px-3 py-1.5 text-[11px] text-foreground shadow-card sm:block">
        All Events
      </div>
    </div>

    <ActivityFeed items={[...todayItems, ...earlierItems]} />
  </BrowserFrame>
);

/* ------------------------------------------------------------------ */
/* Integrations preview                                                */
/* ------------------------------------------------------------------ */

const integrationCards: {
  name: string;
  desc: string;
  icon: typeof Mail;
  category: IntegrationCategory;
  connected: boolean;
}[] = [
  { name: "Email", desc: "Send email notifications for events and automations.", icon: Mail, category: "email", connected: true },
  { name: "Slack", desc: "Post messages to Slack channels on workspace events.", icon: MessageSquare, category: "slack", connected: true },
  { name: "Google Calendar", desc: "Sync deadlines and events with Google Calendar.", icon: Calendar, category: "calendar", connected: true },
  { name: "Webhooks", desc: "Send HTTP webhooks to external services.", icon: Webhook, category: "webhook", connected: false },
];

export const IntegrationsPreview = () => (
  <BrowserFrame>
    <p className="font-display text-base font-bold tracking-tight text-foreground">Integrations</p>
    <p className="mb-3.5 text-xs text-muted-foreground">Connect your workspace to external services</p>

    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {integrationCards.map((c) => {
        const style = styleFor(c.category);
        return (
          <div key={c.name} className={`rounded-xl border-t-[3px] bg-card p-3 shadow-card ${style.borderTop}`}>
            <div className="mb-2.5 flex items-center justify-between">
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
                <c.icon className="h-3 w-3" />
              </span>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[8.5px] font-semibold ${
                  c.connected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {c.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-[11px] font-bold text-foreground">{c.name}</p>
            <p className="mt-0.5 mb-2.5 text-[9.5px] leading-snug text-muted-foreground line-clamp-2">{c.desc}</p>
            <div
              className={`rounded-lg py-1.5 text-center text-[9.5px] font-semibold ${
                c.connected ? "border border-border text-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              {c.connected ? "Manage" : "Connect"}
            </div>
          </div>
        );
      })}
    </div>
  </BrowserFrame>
);
