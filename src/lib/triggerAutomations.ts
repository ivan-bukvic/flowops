const EDGE_FUNCTION_URL = "https://spkpebxbkbksyezdnjpq.supabase.co/functions/v1/execute-automations";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwa3BlYnhia2Jrc3llemRuanBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTUwNzAsImV4cCI6MjA4NzQzMTA3MH0.3qGZOFWAhUAfLM00ahcsbmSLG3hZZAxGU9FDZ2Iyi_s";

/**
 * Silently triggers the execute-automations Edge Function.
 * Call this after emitting an event so automations run immediately.
 */
export function triggerAutomations(): void {
  fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
    },
  }).catch(() => {});
}
