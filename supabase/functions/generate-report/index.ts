import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  name: string;
  chironSign: string;
  chironHouse?: string;
  chironDegree: number;
}

async function pollRunStatus(threadId: string, runId: string, apiKey: string): Promise<any> {
  const maxAttempts = 30;
  const pollInterval = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const run = await response.json();

    if (run.status === "completed") {
      return run;
    } else if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
      throw new Error(`Run ${run.status}: ${run.last_error?.message || "Unknown error"}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error("Run timed out");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID");

    if (!apiKey || !assistantId) {
      throw new Error("Missing OpenAI credentials");
    }

    const { name, chironSign, chironHouse, chironDegree }: RequestBody = await req.json();

    const prompt = chironHouse
      ? `Generate a personalized shadow work report for ${name} whose Chiron is in ${chironSign} in the ${chironHouse} at ${chironDegree.toFixed(2)} degrees. Write this in Morgan's voice - warm, insightful, empowering, and deeply compassionate. The report should help them understand their core wound and path to healing.`
      : `Generate a personalized shadow work report for ${name} whose Chiron is in ${chironSign} at ${chironDegree.toFixed(2)} degrees. Write this in Morgan's voice - warm, insightful, empowering, and deeply compassionate. The report should help them understand their core wound and path to healing.`;

    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.text();
      throw new Error(`Failed to create thread: ${error}`);
    }

    const thread = await threadResponse.json();

    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/runs`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      }
    );

    if (!runResponse.ok) {
      const error = await runResponse.text();
      throw new Error(`Failed to create run: ${error}`);
    }

    const run = await runResponse.json();

    await pollRunStatus(thread.id, run.id, apiKey);

    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/messages`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      throw new Error(`Failed to get messages: ${error}`);
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === "assistant");

    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
      throw new Error("No response from assistant");
    }

    const report = assistantMessage.content[0].text.value;

    return new Response(
      JSON.stringify({ report }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating report:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate report"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});