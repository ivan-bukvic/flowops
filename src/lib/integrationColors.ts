/**
 * Consistent per-integration color system used across the whole app.
 *
 *   Email          = blue
 *   Slack          = purple
 *   Google Calendar = green
 *   Webhook        = orange
 *
 * The classes below reference the `email` / `slack` / `calendar` / `webhook`
 * Tailwind tokens defined in tailwind.config.ts (backed by CSS variables in
 * index.css), so a single change to the hue propagates everywhere.
 */

export type IntegrationCategory =
  | "email"
  | "slack"
  | "calendar"
  | "webhook"
  | "automation"
  | "log";

export interface IntegrationStyle {
  /** Solid foreground color (icons, text) */
  text: string;
  /** Soft tinted background (icon chips) */
  bg: string;
  /** Solid dot background (activity feed dots) */
  dot: string;
  /** Top accent border (integration cards) */
  borderTop: string;
}

export const INTEGRATION_STYLE: Record<IntegrationCategory, IntegrationStyle> = {
  email: { text: "text-email", bg: "bg-email/10", dot: "bg-email", borderTop: "border-t-email" },
  slack: { text: "text-slack", bg: "bg-slack/10", dot: "bg-slack", borderTop: "border-t-slack" },
  calendar: { text: "text-calendar", bg: "bg-calendar/10", dot: "bg-calendar", borderTop: "border-t-calendar" },
  webhook: { text: "text-webhook", bg: "bg-webhook/10", dot: "bg-webhook", borderTop: "border-t-webhook" },
  automation: { text: "text-automation", bg: "bg-automation/10", dot: "bg-automation", borderTop: "border-t-automation" },
  log: { text: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground", borderTop: "border-t-border" },
};

/** Map an automation action_type (DB) to its integration category. */
export function actionCategory(actionType: string): IntegrationCategory {
  switch (actionType) {
    case "EMAIL":
      return "email";
    case "SLACK_MESSAGE":
      return "slack";
    case "GOOGLE_CALENDAR_EVENT":
      return "calendar";
    case "WEBHOOK":
      return "webhook";
    default:
      return "log";
  }
}

/** Map an integrations-hook key to its integration category. */
export function integrationKeyCategory(key: string): IntegrationCategory {
  switch (key) {
    case "email":
      return "email";
    case "slack":
      return "slack";
    case "google_calendar":
      return "calendar";
    case "webhooks":
      return "webhook";
    default:
      return "log";
  }
}

export const styleFor = (category: IntegrationCategory): IntegrationStyle =>
  INTEGRATION_STYLE[category] ?? INTEGRATION_STYLE.log;
