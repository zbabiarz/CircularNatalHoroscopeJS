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

async function pollRunStatus(
  apiKey: string,
  threadId: string,
  runId: string,
  maxWaitTime = 30000
): Promise<any> {
  const startTime = Date.now();
  let pollInterval = 500;

  while (Date.now() - startTime < maxWaitTime) {
    const statusResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to poll run status: ${await statusResponse.text()}`);
    }

    const runStatus = await statusResponse.json();

    if (runStatus.status === "completed") {
      return runStatus;
    }

    if (runStatus.status === "failed" || runStatus.status === "cancelled" || runStatus.status === "expired") {
      throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || "Unknown error"}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));

    if (pollInterval < 1000) {
      pollInterval = 1000;
    }
  }

  await fetch(
    `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/cancel`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    }
  );

  throw new Error("Assistant run timed out after 30 seconds");
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

    if (!apiKey) {
      throw new Error("Missing OpenAI API key");
    }

    if (!assistantId) {
      throw new Error("Missing OpenAI Assistant ID");
    }

    const { name, chironSign, chironHouse, chironDegree }: RequestBody = await req.json();

    const userMessage = chironHouse && chironHouse !== "Unknown"
      ? `Generate a comprehensive, deeply personal shadow work report for ${name} whose Chiron is in ${chironSign} in the ${chironHouse} at ${chironDegree.toFixed(2)} degrees.

Format EXACTLY like this, with these sections:

**Chiron in ${chironSign} in the ${chironHouse}**

**Archetype:** [Give archetype name - do NOT include "The" prefix]

**Theme:** [One sentence about the core theme]

**Core Wound**

[Write 3-4 paragraphs explaining:
- The intersection of the sign wound and house area of life
- Early life patterns and what they learned
- The specific emotional/psychological imprint
- Use YOUR direct, conversational voice - not flowery mystical language]

**How It Feels**

This placement often comes with:

- [Feeling/experience 1]
- [Feeling/experience 2]
- [Feeling/experience 3]
- [Feeling/experience 4]
- [Feeling/experience 5]

**Shadow Patterns**

When unhealed, this Chiron manifests as:

- [Shadow pattern 1 with brief explanation]
- [Shadow pattern 2 with brief explanation]
- [Shadow pattern 3 with brief explanation]
- [Shadow pattern 4 with brief explanation]
- [Shadow pattern 5 with brief explanation]
- [Shadow pattern 6 with brief explanation]
- [Shadow pattern 7 with brief explanation]

[Add a closing sentence about the overall pattern]

**Your Medicine**

When integrated, this placement becomes POWERFUL:

- [Healing gift 1]
- [Healing gift 2]
- [Healing gift 3]
- [Healing gift 4]
- [Healing gift 5]

Your wound becomes your superpower:
[One powerful line about their transformation]

**Your Invitation**

[Write 3-4 paragraphs that:
- Name their healing edge
- Contrast past patterns with future self
- Give them a specific practice or way of being
- End with empowerment]

**Journal / Reflection Prompts**

- [Deep reflection question 1]
- [Deep reflection question 2]

Remember: Use YOUR voice - direct, grounded, real talk. No flowery mystical bypass. Write like you're talking to a friend who needs the truth.`
      : `Generate a comprehensive, deeply personal shadow work report for ${name} whose Chiron is in ${chironSign} at ${chironDegree.toFixed(2)} degrees. Birth time was not provided, so focus on the sign-based interpretation.

Format EXACTLY like this:

**Chiron in ${chironSign}**

**Archetype:** [Give archetype name - do NOT include "The" prefix]

**Theme:** [One sentence about the core theme]

**Core Wound**

[Write 3-4 paragraphs explaining the wound, early patterns, and psychological imprint - use YOUR direct, conversational voice]

**How It Feels**

This placement often comes with:

- [Feeling 1]
- [Feeling 2]
- [Feeling 3]
- [Feeling 4]
- [Feeling 5]

**Shadow Patterns**

When unhealed, this Chiron manifests as:

- [Pattern 1]
- [Pattern 2]
- [Pattern 3]
- [Pattern 4]
- [Pattern 5]

**Your Medicine**

When integrated, this placement becomes POWERFUL:

- [Gift 1]
- [Gift 2]
- [Gift 3]
- [Gift 4]

Your wound becomes your superpower:
[Transformation line]

**Your Invitation**

[3-4 paragraphs about their healing journey]

**Journal / Reflection Prompts**

- [Question 1]
- [Question 2]

Remember: Use YOUR voice - direct, grounded, real talk. No flowery mystical bypass.`;

    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      throw new Error(`Failed to create thread: ${await threadResponse.text()}`);
    }

    const thread = await threadResponse.json();
    const threadId = thread.id;

    const messageResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          role: "user",
          content: userMessage,
        }),
      }
    );

    if (!messageResponse.ok) {
      throw new Error(`Failed to add message: ${await messageResponse.text()}`);
    }

    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
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
      throw new Error(`Failed to create run: ${await runResponse.text()}`);
    }

    const run = await runResponse.json();
    const runId = run.id;

    await pollRunStatus(apiKey, threadId, runId);

    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(`Failed to retrieve messages: ${await messagesResponse.text()}`);
    }

    const messages = await messagesResponse.json();
    const assistantMessages = messages.data.filter((msg: any) => msg.role === "assistant");

    if (assistantMessages.length === 0) {
      throw new Error("No response from assistant");
    }

    const latestMessage = assistantMessages[0];
    const textContent = latestMessage.content.find((c: any) => c.type === "text");

    if (!textContent) {
      throw new Error("No text content in assistant response");
    }

    const report = textContent.text.value;

    try {
      await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });
    } catch (cleanupError) {
      console.error("Failed to cleanup thread:", cleanupError);
    }

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