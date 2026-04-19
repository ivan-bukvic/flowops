import { useState } from "react";
import AutomationTemplatesModal from "./AutomationTemplatesModal";
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
import { ArrowDown, Zap, Settings, Mail, Calendar, MessageSquare, LayoutTemplate, Webhook, FileText } from "lucide-react";
import { toast } from "sonner";

const TRIGGER_OPTIONS = [
  { label: "Project Created", value: "PROJECT_CREATED" },
  { label: "Project Updated", value: "PROJECT_UPDATED" },
  { label: "Project Deleted", value: "PROJECT_DELETED" },
  { label: "Project Member Added", value: "PROJECT_MEMBER_ADDED" },
  { label: "Project Member Removed", value: "PROJECT_MEMBER_REMOVED" },
  { label: "Workspace Created", value: "WORKSPACE_CREATED" },
];

const ACTION_OPTIONS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "SLACK_MESSAGE", label: "Slack", icon: MessageSquare },
  { value: "GOOGLE_CALENDAR_EVENT", label: "Calendar", icon: Calendar },
  { value: "WEBHOOK", label: "Webhook", icon: Webhook },
  { value: "LOG", label: "Log", icon: FileText },
];

interface AutomationRuleBuilderProps {
  onCreated: () => void;
}

const SectionArrow = () => (
  <div className="flex justify-center py-6">
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-px h-6 bg-primary/20" />
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
        <ArrowDown className="h-4 w-4 text-primary/60" />
      </div>
    </div>
  </div>
);

const iconStyles: Record<string, { bg: string; text: string }> = {
  trigger: { bg: "bg-blue-500/10", text: "text-blue-600" },
  action: { bg: "bg-violet-500/10", text: "text-violet-600" },
  config: { bg: "bg-amber-500/10", text: "text-amber-600" },
};

const SectionHeader = ({
  icon: Icon,
  title,
  description,
  variant = "config",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  variant?: "trigger" | "action" | "config";
}) => {
  const style = iconStyles[variant];
  return (
    <div className="flex items-start gap-3.5 mb-6">
      <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${style.bg} shrink-0 mt-0.5`}>
        <Icon className={`h-[18px] w-[18px] ${style.text}`} />
      </div>
      <div>
        <h3 className="text-[15px] font-bold text-foreground leading-tight">{title}</h3>
        <p className="text-[13px] text-muted-foreground/70 mt-1">{description}</p>
      </div>
    </div>
  );
};

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
  const [templatesOpen, setTemplatesOpen] = useState(false);

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
      trigger_type: trigger,
      action_type: action,
      config_json: config,
    });

    setCreating(false);

    if (error) {
      console.error("Automation rule insert error:", error);
      toast.error(`Failed to create automation rule: ${error.message}`);
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
      <div className="flex justify-end mb-6">
        <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)} className="text-xs h-9 gap-1.5">
          <LayoutTemplate className="h-4 w-4" />
          Use Template
        </Button>
      </div>

      <AutomationTemplatesModal open={templatesOpen} onOpenChange={setTemplatesOpen} onApplied={onCreated} />
      {/* Trigger */}
      <div className="rounded-lg border border-border/80 bg-card p-7 shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]">
        <SectionHeader
          icon={Zap}
          title="When this happens"
          description="Choose what starts this automation"
          variant="trigger"
        />
        <div className="space-y-1.5 pl-11">
          <Label className="text-[13px] text-foreground/80">Event</Label>
          <Select value={trigger} onValueChange={setTrigger}>
            <SelectTrigger className="h-11 rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SectionArrow />

      {/* Action */}
      <div className="rounded-lg border border-border/80 bg-card p-7 shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]">
        <SectionHeader
          icon={Settings}
          title="Do this"
          description="Choose what happens next"
          variant="trigger"
        />
        <div className="space-y-1.5 pl-11">
          <Label className="text-[13px] text-foreground/80">Action</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-11 rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary">
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

          <div className="rounded-lg border border-border/80 bg-card p-7 shadow-[0_2px_8px_0_rgba(0,0,0,0.05)] animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <SectionHeader icon={configIcon} title={configTitle} description={configDesc} variant="config" />

            <div className="space-y-4 pl-11">
              {action === "EMAIL" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">To</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="recipient@example.com"
                    className="h-11 rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">Subject</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Notification subject"
                      className="h-11 rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">Message</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Email body content"
                      className="min-h-[100px] rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary"
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
                    className="h-11 rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground/70 mt-1">Slack incoming webhook URL</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-foreground/80">Message</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Slack message content"
                      className="min-h-[80px] rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary"
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
                    className="h-11 rounded-lg text-sm border-border/80 focus:ring-1 focus:ring-primary focus:border-primary"
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
          className="h-11 px-8 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/85 transition-colors shadow-md"
        >
          {creating ? "Creating..." : "Create Automation"}
        </Button>
      </div>
    </div>
  );
};

export default AutomationRuleBuilder;
