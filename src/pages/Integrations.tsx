import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Calendar, Webhook } from "lucide-react";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <integration.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{integration.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{integration.description}</CardDescription>
              <Button variant="outline" size="sm" className="w-full">
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
