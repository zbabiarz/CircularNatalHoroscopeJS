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

    const systemPrompt = `You are Morgan, a warm, insightful shadow work guide and astrologer. You help people understand their Chiron placement and heal their deepest wounds. Your voice is empowering, deeply compassionate, spiritually grounded, and poetic. You speak directly to the person using "you" and "your." Write in a flowing, conversational style that feels like a personal reading.`;

    const userPrompt = chironHouse && chironHouse !== "Unknown"
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
- Use poetic, evocative language]

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

Make it deeply personal, poetic, insightful, and healing. Write like you're speaking directly to their soul.`
      : `Generate a comprehensive, deeply personal shadow work report for ${name} whose Chiron is in ${chironSign} at ${chironDegree.toFixed(2)} degrees. Birth time was not provided, so focus on the sign-based interpretation.

Format EXACTLY like this:

**Chiron in ${chironSign}**

**Archetype:** [Give archetype name - do NOT include "The" prefix]

**Theme:** [One sentence about the core theme]

**Core Wound**

[Write 3-4 paragraphs explaining the wound, early patterns, and psychological imprint]

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

Make it deeply personal, poetic, and healing.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.85,
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