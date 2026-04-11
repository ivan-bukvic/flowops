import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationKey, IntegrationState } from "@/hooks/useIntegrations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationKey: IntegrationKey | null;
  integrationName: string;
  state: IntegrationState | null;
  onConnect: (key: IntegrationKey, data?: Partial<IntegrationState>) => void;
  onDisconnect: (key: IntegrationKey) => void;
}

export default function IntegrationModal({
  open,
  onOpenChange,
  integrationKey,
  integrationName,
  state,
  onConnect,
  onDisconnect,
}: Props) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channel, setChannel] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whDesc, setWhDesc] = useState("");

  const isConnected = state?.connected ?? false;

  const handleOpen = (o: boolean) => {
    if (o && state) {
      setWebhookUrl(state.webhookUrl ?? "");
      setChannel(state.channel ?? "");
      setWhUrl(state.url ?? "");
      setWhDesc(state.description ?? "");
    }
    onOpenChange(o);
  };

  if (!integrationKey) return null;

  // Info-only modals (Email, Google Calendar)
  if (integrationKey === "email" || integrationKey === "google_calendar") {
    const msg =
      integrationKey === "email"
        ? "Resend is preconfigured and ready to use."
        : "Google Calendar is connected via a secure service account.";

    return (
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{integrationName}</DialogTitle>
            <DialogDescription>{msg}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {isConnected ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDisconnect(integrationKey);
                  onOpenChange(false);
                }}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  onConnect(integrationKey);
                  onOpenChange(false);
                }}
              >
                Connect
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Slack config modal
  if (integrationKey === "slack") {
    return (
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isConnected ? "Manage Slack" : "Connect Slack"}</DialogTitle>
            <DialogDescription>
              {isConnected
                ? "Update your Slack configuration or disconnect."
                : "Enter your Slack webhook details to connect."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="slack-url">Webhook URL *</Label>
              <Input
                id="slack-url"
                placeholder="https://hooks.slack.com/services/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slack-channel">Channel Name</Label>
              <Input
                id="slack-channel"
                placeholder="#general"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {isConnected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDisconnect(integrationKey);
                  onOpenChange(false);
                }}
              >
                Disconnect
              </Button>
            )}
            <Button
              size="sm"
              disabled={!webhookUrl.trim()}
              onClick={() => {
                onConnect(integrationKey, {
                  webhookUrl: webhookUrl.trim(),
                  channel: channel.trim() || undefined,
                });
                onOpenChange(false);
              }}
            >
              {isConnected ? "Save" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Webhooks config modal
  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isConnected ? "Manage Webhook" : "Connect Webhook"}</DialogTitle>
          <DialogDescription>
            {isConnected
              ? "Update your webhook configuration or disconnect."
              : "Enter your webhook endpoint details."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wh-url">Webhook URL *</Label>
            <Input
              id="wh-url"
              placeholder="https://api.example.com/webhook"
              value={whUrl}
              onChange={(e) => setWhUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-desc">Description</Label>
            <Input
              id="wh-desc"
              placeholder="Demo webhook"
              value={whDesc}
              onChange={(e) => setWhDesc(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {isConnected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDisconnect(integrationKey);
                onOpenChange(false);
              }}
            >
              Disconnect
            </Button>
          )}
          <Button
            size="sm"
            disabled={!whUrl.trim()}
            onClick={() => {
              onConnect(integrationKey, {
                url: whUrl.trim(),
                description: whDesc.trim() || undefined,
              });
              onOpenChange(false);
            }}
          >
            {isConnected ? "Save" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
