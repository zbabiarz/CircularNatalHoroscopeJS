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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error("Missing OpenAI API key");
    }

    const { name, chironSign, chironHouse, chironDegree }: RequestBody = await req.json();

    const systemPrompt = `You are Morgan, a warm, insightful shadow work guide and astrologer. You help people understand their Chiron placement and heal their deepest wounds. Your voice is empowering, deeply compassionate, and spiritually grounded. You speak directly to the person, using "you" and "your."`;

    const userPrompt = chironHouse && chironHouse !== "Unknown"
      ? `Generate a personalized shadow work report for ${name} whose Chiron is in ${chironSign} in the ${chironHouse} at ${chironDegree.toFixed(2)} degrees.

Format the report with these sections, each with a bold header (using **Section Name**):
**Chiron in ${chironSign} in the ${chironHouse}**
**Archetype:** [name of the archetype - do NOT include "The" prefix]
**Theme:** [main theme in 3-5 words]
**Core Wound:** [2-3 sentences explaining the wound]
**Your Medicine:** [2-3 sentences about their healing gift]
**Your Invitation:** [2-3 sentences about what they're called to do]
**Journal Prompts:**
- [reflection question 1]
- [reflection question 2]
- [reflection question 3]

Make it deeply personal, insightful, and healing.`
      : `Generate a personalized shadow work report for ${name} whose Chiron is in ${chironSign} at ${chironDegree.toFixed(2)} degrees. Birth time was not provided, so focus on the sign-based interpretation.

Format the report with these sections, each with a bold header (using **Section Name**):
**Chiron in ${chironSign}**
**Archetype:** [name of the archetype - do NOT include "The" prefix]
**Theme:** [main theme in 3-5 words]
**Core Wound:** [2-3 sentences explaining the wound]
**Your Medicine:** [2-3 sentences about their healing gift]
**Your Invitation:** [2-3 sentences about what they're called to do]
**Journal Prompts:**
- [reflection question 1]
- [reflection question 2]
- [reflection question 3]

Make it deeply personal, insightful, and healing.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content;

    if (!report) {
      throw new Error("No response from OpenAI");
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