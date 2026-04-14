import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond(401, { error: "Missing authorization" });

    const { question, project_id, document_id } = await req.json();
    if (!question?.trim()) return respond(400, { error: "Question is required" });
    if (!project_id) return respond(400, { error: "Project ID is required" });

    // User client – validates RLS access
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user has access to the project
    const { data: project, error: projErr } = await userClient
      .from("projects")
      .select("id, name")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return respond(403, { error: "Project not found or no access" });
    }

    // Admin client for embeddings lookup
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get documents for this project
    const { data: docs } = await adminClient
      .from("documents")
      .select("id, original_name, summary, raw_text")
      .eq("project_id", project_id)
      .is("deleted_at", null)
      .limit(20);

    if (!docs || docs.length === 0) {
      return respond(400, { error: "No documents found for this project. Upload documents first." });
    }

    // Build context from document summaries and raw text
    const contextParts = docs.map((d: any) => {
      const parts: string[] = [];
      if (d.original_name) parts.push(`Document: ${d.original_name}`);
      if (d.summary) parts.push(`Summary: ${d.summary}`);
      if (d.raw_text) parts.push(`Content: ${d.raw_text.slice(0, 2000)}`);
      return parts.join("\n");
    });

    const context = contextParts.join("\n\n---\n\n");

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return respond(500, { error: "AI service not configured" });
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an intelligent document assistant for the project "${project.name}". Answer questions based on the following document context. Be concise, accurate, and helpful. If the context doesn't contain relevant information, say so clearly.\n\nDocument Context:\n${context}`,
            },
            { role: "user", content: question },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return respond(429, { error: "Rate limit exceeded. Please try again shortly." });
      if (status === 402) return respond(402, { error: "AI credits exhausted. Please add funds in workspace settings." });
      console.error("AI gateway error:", status, await aiResponse.text());
      return respond(500, { error: "AI service error" });
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content ?? "No response generated.";

    // Extract user_id from JWT
    const { data: { user } } = await userClient.auth.getUser();

    // Save query to ai_queries table
    await adminClient.from("ai_queries").insert({
      question,
      answer,
      project_id,
      user_id: user?.id ?? null,
    });

    return respond(200, { answer });
  } catch (e) {
    console.error("ask-ai error:", e);
    return respond(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
