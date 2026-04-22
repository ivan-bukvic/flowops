import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Calendar, Webhook, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useIntegrations, IntegrationKey } from "@/hooks/useIntegrations";
import IntegrationModal from "@/components/integrations/IntegrationModal";

const iconStyles: Record<IntegrationKey, { bg: string; text: string }> = {
  email: { bg: "bg-orange-50", text: "text-orange-500" },
  slack: { bg: "bg-purple-50", text: "text-purple-700" },
  google_calendar: { bg: "bg-blue-50", text: "text-blue-600" },
  webhooks: { bg: "bg-violet-50", text: "text-violet-600" },
};

interface IntegrationDef {
  key: IntegrationKey;
  name: string;
  description: string;
  icon: LucideIcon;
}

const integrations: IntegrationDef[] = [
  {
    key: "email",
    name: "Email",
    description: "Send email notifications for events and automations.",
    icon: Mail,
  },
  {
    key: "slack",
    name: "Slack",
    description: "Post messages to Slack channels on workspace events.",
    icon: MessageSquare,
  },
  {
    key: "google_calendar",
    name: "Google Calendar",
    description: "Sync deadlines and events with Google Calendar.",
    icon: Calendar,
  },
  {
    key: "webhooks",
    name: "Webhooks",
    description: "Send HTTP webhooks to external services.",
    icon: Webhook,
  },
];

const Integrations = () => {
  const { integrations: states, connect, disconnect } = useIntegrations();
  const [modalKey, setModalKey] = useState<IntegrationKey | null>(null);

  const handleConnect = (key: IntegrationKey, data?: any) => {
    connect(key, data);
    toast.success("Integration connected successfully.");
  };

  const handleDisconnect = (key: IntegrationKey) => {
    disconnect(key);
    toast.success("Integration disconnected successfully.");
  };

  const activeIntegration = integrations.find((i) => i.key === modalKey);

  return (
    <main className="p-6 pt-4">
      <div className="relative rounded-xl p-6 overflow-hidden">
        {/* Background layer: dots + left→right + top→bottom fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--primary) / 0.20) 1px, transparent 1px)",
            backgroundSize: "15px 15px",
            WebkitMaskImage:
              "linear-gradient(to right, black 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.05) 85%, transparent 100%), linear-gradient(to bottom, black 0%, black 28%, rgba(0,0,0,0.30) 42%, rgba(0,0,0,0.05) 55%, transparent 65%)",
            maskImage:
              "linear-gradient(to right, black 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.05) 85%, transparent 100%), linear-gradient(to bottom, black 0%, black 28%, rgba(0,0,0,0.30) 42%, rgba(0,0,0,0.05) 55%, transparent 65%)",
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        />
        {/* Content layer */}
        <div className="relative z-10">
          <PageHeader title="Integrations" description="Connect your workspace to external services" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {integrations.map((integration, idx) => {
          const connected = states[integration.key]?.connected;
          return (
            <Card
              key={integration.key}
              className="shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.07)] hover:border-primary/25 transition-all duration-150 group"
            >
              <CardHeader className="pb-3 pt-6 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-12 w-12 rounded-xl ${iconStyles[integration.key].bg} flex items-center justify-center`}
                    >
                      <integration.icon className={`h-5 w-5 ${iconStyles[integration.key].text}`} />
                    </div>
                    <CardTitle className="text-[15px] font-bold">{integration.name}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium border-0 px-2.5 py-0.5 rounded-md ${
                      connected
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {connected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <CardDescription className="mb-5 text-[13px] leading-relaxed">
                  {integration.description}
                </CardDescription>
                <Button
                  size="sm"
                  variant={connected ? "outline" : "default"}
                  className="w-full h-9 font-semibold transition-all"
                  onClick={() => setModalKey(integration.key)}
                >
                  {connected ? "Manage" : "Connect"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
          </div>
        </div>
      </div>

      <IntegrationModal
        open={!!modalKey}
        onOpenChange={(o) => !o && setModalKey(null)}
        integrationKey={modalKey}
        integrationName={activeIntegration?.name ?? ""}
        state={modalKey ? states[modalKey] : null}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    </main>
  );
};

export default Integrations;
