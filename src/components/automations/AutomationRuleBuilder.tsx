import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, Zap, Settings, Mail, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const TRIGGER_MAP: Record<string, string> = {
  "Project Created": "PROJECT_CREATED",
  "Project Updated": "PROJECT_UPDATED",
  "Member Added": "MEMBER_ADDED",
  "Project Member Added": "PROJECT_MEMBER_ADDED",
  "Project Member Removed": "PROJECT_MEMBER_REMOVED",
};

const TRIGGER_LABELS = Object.keys(TRIGGER_MAP);

const ACTIONS = ["EMAIL", "SLACK_MESSAGE", "GOOGLE_CALENDAR_EVENT", "WEBHOOK", "LOG"];

interface AutomationRuleBuilderProps {
  onCreated: () => void;
}

const SectionArrow = () => (
  <div className="flex justify-center py-5">
    <div className="flex flex-col items-center gap-1">
      <div className="w-px h-5 bg-border" />
      <ArrowDown className="h-5 w-5 text-muted-foreground/70" />
    </div>
  </div>
);

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-muted/50 shrink-0 mt-0.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div>
      <h3 className="text-[15px] font-semibold text-foreground leading-tight">{title}</h3>
      <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

const AutomationRuleBuilder = ({ onCreated }: AutomationRuleBuilderProps) => {
  const { selectedOrgId } = useOrg();
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [calendarTitle, setCalendarTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const isValid = () => {
    if (!trigger || !action) return false;
    if (action === "EMAIL" && (!email || !subject || !message)) return false;
    if (action === "SLACK_MESSAGE" && (!webhookUrl || !message)) return false;
    return true;
  };

  const handleCreate = async () => {
    if (!selectedOrgId || creating || !isValid()) return;
    setCreating(true);

    const config: Record<string, any> = {};
    if (action === "EMAIL") {
      config.email = email;
      config.subject = subject;
      config.message = message;
    } else if (action === "SLACK_MESSAGE") {
      config.webhook_url = webhookUrl;
      config.message = message;
    } else if (action === "GOOGLE_CALENDAR_EVENT") {
      config.title = calendarTitle;
    }

    const { error } = await supabase.from("automation_rules").insert({
      org_id: selectedOrgId,
      trigger_type: TRIGGER_MAP[trigger] || trigger,
      action_type: action,
      config_json: config,
    });

    setCreating(false);

    if (error) {
      console.error("Automation rule insert error:", error);
      if (error.code === "23505") {
        toast.error("A rule with this trigger and action already exists.");
      } else {
        toast.error(`Failed to create automation rule: ${error.message}`);
      }
      return;
    }

    toast.success("Automation rule created.");
    setTrigger("");
    setAction("");
    setEmail("");
    setSubject("");
    setMessage("");
    setWebhookUrl("");
    setCalendarTitle("");
    onCreated();
  };

  const configIcon = action === "EMAIL" ? Mail
    : action === "SLACK_MESSAGE" ? MessageSquare
    : action === "GOOGLE_CALENDAR_EVENT" ? Calendar
    : Settings;

  const configTitle = action === "EMAIL" ? "Email Content"
    : action === "SLACK_MESSAGE" ? "Slack Message"
    : action === "GOOGLE_CALENDAR_EVENT" ? "Calendar Event"
    : "Configuration";

  const configDesc = action === "EMAIL"
    ? "This email will be sent automatically when the event happens"
    : action === "SLACK_MESSAGE"
    ? "Configure the Slack message to send"
    : action === "GOOGLE_CALENDAR_EVENT"
    ? "Configure the calendar event details"
    : "Set up the action details";

  const hasConfig = ["EMAIL", "SLACK_MESSAGE", "GOOGLE_CALENDAR_EVENT"].includes(action);

  return (
    <div className="max-w-[720px] mx-auto py-8 px-6">
      {/* Trigger */}
      <div className="rounded-lg border border-border bg-card p-5">
        <SectionHeader
          icon={Zap}
          title="When this happens"
          description="Choose what starts this automation"
        />
        <div className="space-y-1.5 pl-11">
          <Label className="text-[13px] text-foreground/80">Event</Label>
          <Select value={trigger} onValueChange={setTrigger}>
            <SelectTrigger className="h-10 rounded-lg text-sm focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_LABELS.map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SectionArrow />

      {/* Action */}
      <div className="rounded-lg border border-border bg-card p-5">
        <SectionHeader
          icon={Settings}
          title="Do this"
          description="Choose what happens next"
        />
        <div className="space-y-1.5 pl-11">
          <Label className="text-[13px] text-foreground/80">Action</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-10 rounded-lg text-sm focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="Select an action" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Configuration — conditional */}
      {hasConfig && (
        <>
          <SectionArrow />

          <div className="rounded-lg border border-border bg-card p-5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <SectionHeader icon={configIcon} title={configTitle} description={configDesc} />

            <div className="space-y-4 pl-11">
              {action === "EMAIL" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">To</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">Subject</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Notification subject"
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">Message</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Email body content"
                      className="min-h-[100px] rounded-lg text-sm"
                    />
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">You can use variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {["{project_name}", "{user_email}", "{event_type}"].map((v) => (
                        <code
                          key={v}
                          className="text-xs bg-background border border-border rounded px-2 py-0.5 font-mono text-foreground/70"
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {action === "SLACK_MESSAGE" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">Webhook URL</Label>
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="h-10 rounded-lg text-sm"
                    />
                    <p className="text-xs text-muted-foreground/70 mt-1">Slack incoming webhook URL</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">Message</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Slack message content"
                      className="min-h-[80px] rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              {action === "GOOGLE_CALENDAR_EVENT" && (
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-foreground/80">Title</Label>
                  <Input
                    value={calendarTitle}
                    onChange={(e) => setCalendarTitle(e.target.value)}
                    placeholder="Calendar event title (optional)"
                    className="h-10 rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground/70 mt-1">Leave empty to use the trigger event name</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Create Button */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={handleCreate}
          disabled={!isValid() || creating}
          className="h-10 px-6 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {creating ? "Creating..." : "Create Automation"}
        </Button>
      </div>
    </div>
  );
};

export default AutomationRuleBuilder;
