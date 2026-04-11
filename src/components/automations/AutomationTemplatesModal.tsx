import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, UserPlus, Bell, Trash2, Building, Loader2, Mail, MessageSquare, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TemplateAction {
  action_type: string;
  config_json: Record<string, any>;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  trigger_type: string;
  actions: TemplateAction[];
}

const TEMPLATES: AutomationTemplate[] = [
  {
    id: "new-project-kickoff",
    name: "New Project Kickoff",
    description: "Send email, Slack message, and create a calendar event when a project is created.",
    icon: Rocket,
    trigger_type: "PROJECT_CREATED",
    actions: [
      {
        action_type: "EMAIL",
        config_json: {
          subject: "New Project Created: {project_name}",
          message: "A new project has been created by {user_email}.",
          recipient: "{user_email}",
        },
      },
      {
        action_type: "SLACK_MESSAGE",
        config_json: {
          message: 'A new project "{project_name}" has been created by {user_email}.',
        },
      },
      {
        action_type: "GOOGLE_CALENDAR_EVENT",
        config_json: {
          summary: "Kickoff: {project_name}",
          description: "Project created by {user_email}.",
          start_offset_hours: 1,
          duration_minutes: 60,
        },
      },
    ],
  },
  {
    id: "team-member-welcome",
    name: "Team Member Welcome",
    description: "Send a welcome email when a new member is added to a project.",
    icon: UserPlus,
    trigger_type: "PROJECT_MEMBER_ADDED",
    actions: [
      {
        action_type: "EMAIL",
        config_json: {
          subject: "Welcome to the team!",
          message: "You have been added to the project {project_name}. Welcome aboard!",
          recipient: "{user_email}",
        },
      },
    ],
  },
  {
    id: "project-update-notification",
    name: "Project Update Notification",
    description: "Notify your team on Slack when a project is updated.",
    icon: Bell,
    trigger_type: "PROJECT_UPDATED",
    actions: [
      {
        action_type: "SLACK_MESSAGE",
        config_json: {
          message: 'Project "{project_name}" has been updated by {user_email}.',
        },
      },
    ],
  },
  {
    id: "project-deletion-alert",
    name: "Project Deletion Alert",
    description: "Send an email alert when a project is deleted.",
    icon: Trash2,
    trigger_type: "PROJECT_DELETED",
    actions: [
      {
        action_type: "EMAIL",
        config_json: {
          subject: "Project Deleted: {project_name}",
          message: "The project {project_name} has been deleted by {user_email}.",
          recipient: "{user_email}",
        },
      },
    ],
  },
  {
    id: "workspace-created-notification",
    name: "Workspace Created Notification",
    description: "Send an email and Slack message when a new workspace is created.",
    icon: Building,
    trigger_type: "WORKSPACE_CREATED",
    actions: [
      {
        action_type: "EMAIL",
        config_json: {
          subject: "New Workspace Created",
          message: "A new workspace has been created by {user_email}.",
          recipient: "{user_email}",
        },
      },
      {
        action_type: "SLACK_MESSAGE",
        config_json: {
          message: "A new workspace has been created by {user_email}.",
        },
      },
    ],
  },
];

const ACTION_ICONS: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SLACK_MESSAGE: MessageSquare,
  GOOGLE_CALENDAR_EVENT: Calendar,
};

interface AutomationTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}

const AutomationTemplatesModal = ({ open, onOpenChange, onApplied }: AutomationTemplatesModalProps) => {
  const { selectedOrgId } = useOrg();
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = async (template: AutomationTemplate) => {
    if (!selectedOrgId || applying) return;
    setApplying(template.id);

    const rows = template.actions.map((a) => ({
      org_id: selectedOrgId,
      trigger_type: template.trigger_type,
      action_type: a.action_type,
      config_json: a.config_json,
    }));

    const { error } = await supabase.from("automation_rules").insert(rows);

    setApplying(null);

    if (error) {
      toast.error(`Failed to apply template: ${error.message}`);
      return;
    }

    toast.success("Automation template applied successfully.");
    onOpenChange(false);
    onApplied();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 border-border bg-card">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-bold text-foreground">Automation Templates</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Select a prebuilt workflow to get started quickly.</p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isApplying = applying === t.id;

            return (
              <div
                key={t.id}
                className="rounded-lg border border-border bg-background p-4 flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{t.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>

                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      {t.trigger_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">→</span>
                    {t.actions.map((a, i) => {
                      const AIcon = ACTION_ICONS[a.action_type];
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5"
                        >
                          {AIcon && <AIcon className="h-3 w-3" />}
                          {a.action_type.replace(/_/g, " ")}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs h-8"
                  disabled={!!applying}
                  onClick={() => handleApply(t)}
                >
                  {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Use Template"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationTemplatesModal;
