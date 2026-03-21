import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTION_URL = "https://spkpebxbkbksyezdnjpq.supabase.co/functions/v1/process-automation-logs";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwa3BlYnhia2Jrc3llemRuanBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTUwNzAsImV4cCI6MjA4NzQzMTA3MH0.3qGZOFWAhUAfLM00ahcsbmSLG3hZZAxGU9FDZ2Iyi_s";

/**
 * Runs the automation engine RPC to create pending logs,
 * then triggers the Edge Function to process them.
 */
export function triggerAutomations(): void {
  Promise.resolve(supabase.rpc("run_automation_engine")).then(() => {
    fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ANON_KEY}`,
      },
    }).catch(() => {});
  }).catch(() => {});
}
