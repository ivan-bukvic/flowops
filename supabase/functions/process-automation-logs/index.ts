import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Fetch pending automation logs with their rule config
    const { data: pendingLogs, error: fetchError } = await supabase
      .from("automation_logs")
      .select("id, rule_id, event_id, automation_rules(action_type, config_json), events(type, metadata)")
      .eq("status", "pending")
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch pending logs: ${fetchError.message}`);
    }

    if (!pendingLogs || pendingLogs.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const log of pendingLogs) {
      const rule = log.automation_rules as any;
      const event = log.events as any;
      const actionType = rule?.action_type;
      const config = rule?.config_json || {};

      let status = "completed";
      let resultJson: Record<string, any> = {};
      let lastError: string | null = null;

      try {
        switch (actionType) {
          case "EMAIL": {
            const resendKey = Deno.env.get("RESEND_API_KEY");
            if (!resendKey) {
              throw new Error("RESEND_API_KEY not configured");
            }
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: config.from || "Automations <onboarding@resend.dev>",
                to: [config.email],
                subject: config.subject || `Automation: ${event?.type}`,
                text: config.message || `Event ${event?.type} triggered.`,
              }),
            });
            const emailData = await emailRes.json();
            if (!emailRes.ok) {
              throw new Error(`Resend error [${emailRes.status}]: ${JSON.stringify(emailData)}`);
            }
            resultJson = { email_id: emailData.id, to: config.email };
            break;
          }

          case "SLACK_MESSAGE": {
            const webhookUrl = config.webhook_url;
            if (!webhookUrl) {
              throw new Error("No webhook_url configured in rule");
            }
            const slackRes = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: config.message || `Automation triggered by ${event?.type}`,
              }),
            });
            if (!slackRes.ok) {
              const slackBody = await slackRes.text();
              throw new Error(`Slack webhook error [${slackRes.status}]: ${slackBody}`);
            }
            resultJson = { webhook_status: "sent" };
            break;
          }

          case "WEBHOOK": {
            const url = config.webhook_url || config.url;
            if (!url) {
              throw new Error("No webhook URL configured in rule");
            }
            const webhookRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event_type: event?.type,
                event_metadata: event?.metadata,
                rule_id: log.rule_id,
                timestamp: new Date().toISOString(),
              }),
            });
            if (!webhookRes.ok) {
              const body = await webhookRes.text();
              throw new Error(`Webhook error [${webhookRes.status}]: ${body}`);
            }
            resultJson = { webhook_status: webhookRes.status };
            break;
          }

          case "LOG": {
            // LOG action just marks as completed - the log entry itself is the action
            resultJson = { logged: true, event_type: event?.type };
            break;
          }

          case "GOOGLE_CALENDAR_EVENT": {
            // Placeholder - requires Google Calendar API integration
            resultJson = { note: "Google Calendar integration not yet configured" };
            status = "completed";
            break;
          }

          default: {
            throw new Error(`Unknown action type: ${actionType}`);
          }
        }
      } catch (err) {
        status = "failed";
        lastError = err instanceof Error ? err.message : String(err);
        resultJson = { error: lastError };
      }

      // Update the log status
      await supabase
        .from("automation_logs")
        .update({
          status,
          result_json: resultJson,
          last_error: lastError,
        })
        .eq("id", log.id);

      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("process-automation-logs error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
