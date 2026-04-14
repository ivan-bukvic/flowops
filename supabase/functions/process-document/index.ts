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

    const { document_id } = await req.json();
    if (!document_id) return respond(400, { error: "document_id is required" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the document
    const { data: doc, error: docErr } = await adminClient
      .from("documents")
      .select("id, file_url, original_name, processing_status, org_id, project_id")
      .eq("id", document_id)
      .is("deleted_at", null)
      .single();

    if (docErr || !doc) {
      return respond(404, { error: "Document not found" });
    }

    // Update status to processing
    await adminClient
      .from("documents")
      .update({ processing_status: "processing" })
      .eq("id", document_id);

    try {
      // Download the file from storage
      const { data: fileData, error: dlErr } = await adminClient.storage
        .from("documents")
        .download(doc.file_url);

      if (dlErr || !fileData) {
        throw new Error(`Failed to download file: ${dlErr?.message || "unknown"}`);
      }

      // Extract text based on file type
      const fileName = (doc.original_name || doc.file_url).toLowerCase();
      let rawText = "";

      if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv")) {
        rawText = await fileData.text();
      } else if (fileName.endsWith(".pdf")) {
        // For PDF, extract whatever text we can from the binary
        const bytes = new Uint8Array(await fileData.arrayBuffer());
        rawText = extractPdfText(bytes);
      } else if (fileName.endsWith(".docx")) {
        // For DOCX, extract text from the XML inside the zip
        rawText = await extractDocxText(fileData);
      } else {
        // Try reading as text for unknown formats
        try {
          rawText = await fileData.text();
        } catch {
          rawText = "";
        }
      }

      if (!rawText.trim()) {
        // Still update with empty text but mark as uploaded (no content to summarize)
        await adminClient
          .from("documents")
          .update({
            processing_status: "uploaded",
            raw_text: "",
            summary: "No extractable text content found in this document.",
            processed_at: new Date().toISOString(),
          })
          .eq("id", document_id);
        return respond(200, { status: "no_content" });
      }

      // Truncate for summary generation
      const textForSummary = rawText.slice(0, 8000);

      // Generate summary via AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY not configured");
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
                content:
                  "You are a document summarization assistant. Provide a concise, informative summary of the document content in 2-4 sentences. Focus on the key topics, purpose, and important details.",
              },
              {
                role: "user",
                content: `Please summarize the following document titled "${doc.original_name || "Untitled"}":\n\n${textForSummary}`,
              },
            ],
          }),
        }
      );

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, errText);
        throw new Error(`AI gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const summary = aiData.choices?.[0]?.message?.content ?? "Summary generation failed.";

      // Extract deadlines (simple pattern matching)
      const deadlines = extractDeadlines(rawText);

      // Update the document with results
      await adminClient
        .from("documents")
        .update({
          raw_text: rawText.slice(0, 50000), // cap storage
          summary,
          extracted_deadlines: deadlines.length > 0 ? deadlines : null,
          processing_status: "uploaded",
          processed_at: new Date().toISOString(),
        })
        .eq("id", document_id);

      return respond(200, { status: "completed", summary });
    } catch (processErr) {
      const errMsg = processErr instanceof Error ? processErr.message : String(processErr);
      console.error("Processing error:", errMsg);

      await adminClient
        .from("documents")
        .update({
          processing_status: "failed",
          error_message: errMsg,
        })
        .eq("id", document_id);

      return respond(500, { error: errMsg });
    }
  } catch (e) {
    console.error("process-document error:", e);
    return respond(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});

// Simple PDF text extraction (extracts text streams)
function extractPdfText(bytes: Uint8Array): string {
  const text = new TextDecoder("latin1").decode(bytes);
  const textParts: string[] = [];

  // Extract text between BT and ET markers
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(text)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1]);
    }
    // TJ array
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
      const items = tjArrayMatch[1];
      const stringRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = stringRegex.exec(items)) !== null) {
        textParts.push(strMatch[1]);
      }
    }
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
}

// Simple DOCX text extraction
async function extractDocxText(blob: Blob): Promise<string> {
  try {
    // DOCX is a ZIP file; we need to find word/document.xml
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Find the document.xml content by looking for XML tags
    const text = new TextDecoder().decode(bytes);
    const xmlStart = text.indexOf("<w:body");
    if (xmlStart === -1) return "";

    const xmlEnd = text.indexOf("</w:body>", xmlStart);
    if (xmlEnd === -1) return "";

    const bodyXml = text.slice(xmlStart, xmlEnd);

    // Extract text from <w:t> tags
    const parts: string[] = [];
    const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = wtRegex.exec(bodyXml)) !== null) {
      parts.push(match[1]);
    }

    return parts.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

// Extract date-like patterns as potential deadlines
function extractDeadlines(text: string): string[] {
  const patterns = [
    /\b(?:deadline|due(?:\s+date)?|by|before|until|expires?)\s*:?\s*(\w+\s+\d{1,2},?\s+\d{4})/gi,
    /\b(?:deadline|due(?:\s+date)?|by|before|until|expires?)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  ];

  const deadlines = new Set<string>();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      deadlines.add(match[1].trim());
    }
  }

  return Array.from(deadlines).slice(0, 10);
}
