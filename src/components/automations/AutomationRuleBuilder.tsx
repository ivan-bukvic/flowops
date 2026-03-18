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
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";

const TRIGGERS = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "PROJECT_DELETED",
  "PROJECT_MEMBER_ADDED",
  "PROJECT_MEMBER_REMOVED",
];

const ACTIONS = ["EMAIL", "SLACK_MESSAGE", "GOOGLE_CALENDAR_EVENT", "WEBHOOK", "LOG"];

interface AutomationRuleBuilderProps {
  onCreated: () => void;
}

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
    if (!selectedOrgId || !isValid()) return;
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
      toast.error("Failed to create automation rule.");
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

  return (
    <div className="max-w-[720px] mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground">Automation Rules</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Create a new automation by defining a trigger and an action
        </p>
      </div>

      {/* Trigger Card */}
    <div className="rounded-[10px] border border-border bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-foreground">Trigger</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Choose what starts the automation
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] text-foreground/80">Event Type</Label>
          <Select value={trigger} onValueChange={setTrigger}>
            <SelectTrigger className="h-10 rounded-lg text-sm focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Flow Indicator */}
      <div className="flex justify-center py-2">
        <ArrowDown className="h-4 w-4 text-muted-foreground/60" />
      </div>

      {/* Action Card */}
      <div className="rounded-[10px] border border-border bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Action</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Choose what happens after the trigger
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-foreground/80">Action Type</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-10 rounded-lg text-sm focus:ring-1 focus:ring-ring">
                <SelectValue placeholder="Select action" />
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

          {/* Dynamic Fields */}
          {action === "EMAIL" && (
            <div className="space-y-4 pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-foreground/80">Email</Label>
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
                  className="min-h-[80px] rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {action === "SLACK_MESSAGE" && (
            <div className="space-y-4 pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-foreground/80">Webhook URL</Label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="h-10 rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Slack incoming webhook URL
                </p>
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
            </div>
          )}

          {action === "GOOGLE_CALENDAR_EVENT" && (
            <div className="space-y-4 pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-foreground/80">Title</Label>
                <Input
                  value={calendarTitle}
                  onChange={(e) => setCalendarTitle(e.target.value)}
                  placeholder="Calendar event title (optional)"
                  className="h-10 rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Leave empty to use the trigger event name
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-end mt-6">
        <Button
          onClick={handleCreate}
          disabled={creating || !isValid()}
          className="h-10 px-5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {creating ? "Creating..." : "Create Automation"}
        </Button>
      </div>
    </div>
  );
};

export default AutomationRuleBuilder;
