import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Calendar, Webhook } from "lucide-react";

const iconTints = [
  "bg-primary/[0.07]",
  "bg-emerald-500/[0.07]",
  "bg-amber-500/[0.07]",
  "bg-violet-500/[0.07]",
];

const integrations = [
  {
    name: "Email",
    description: "Send email notifications for events and automations.",
    icon: Mail,
  },
  {
    name: "Slack",
    description: "Post messages to Slack channels on workspace events.",
    icon: MessageSquare,
  },
  {
    name: "Google Calendar",
    description: "Sync deadlines and events with Google Calendar.",
    icon: Calendar,
  },
  {
    name: "Webhooks",
    description: "Send HTTP webhooks to external services.",
    icon: Webhook,
  },
];

const Integrations = () => {
  return (
    <main className="p-6">
      <PageHeader title="Integrations" description="Connect your workspace to external services" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {integrations.map((integration, idx) => (
          <Card
            key={integration.name}
            className="shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.07)] hover:border-primary/25 transition-all duration-150 group"
          >
            <CardHeader className="pb-3 pt-6 px-6">
              <div className="flex items-center gap-3.5">
                <div className={`h-11 w-11 rounded-lg ${iconTints[idx % iconTints.length]} flex items-center justify-center`}>
                  <integration.icon className="h-5 w-5 text-muted-foreground/80" />
                </div>
                <CardTitle className="text-[15px] font-bold">{integration.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <CardDescription className="mb-5 text-[13px] leading-relaxed">{integration.description}</CardDescription>
              <Button size="sm" className="w-full h-9 font-semibold shadow-sm hover:brightness-110 transition-all">
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default Integrations;
