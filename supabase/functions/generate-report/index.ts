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

const REQUIRED_SECTIONS = [
  '**Archetype:**',
  '**Theme:**',
  '**Chiron\'s Story**',
  '**Core Wound**',
  '**How It Feels**',
  '**Shadow Patterns**',
  '**Your Medicine**',
  '**Your Invitation**',
  '**Journal / Reflection Prompts**'
];

const MIN_REPORT_LENGTH = 3000;

function validateReport(report: string): { isValid: boolean; status: string; missingSections: string[]; length: number } {
  const missingSections: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!report.includes(section)) {
      missingSections.push(section);
    }
  }

  const isValid = missingSections.length === 0 && report.length >= MIN_REPORT_LENGTH;

  let status = 'completed';
  if (!isValid) {
    if (missingSections.length > 0 && report.length < MIN_REPORT_LENGTH) {
      status = 'incomplete_missing_sections_and_short';
    } else if (missingSections.length > 0) {
      status = 'incomplete_missing_sections';
    } else {
      status = 'incomplete_too_short';
    }
  }

  return { isValid, status, missingSections, length: report.length };
}

const SYSTEM_PROMPT = `You are Morgan, a compassionate but direct shadow work guide who writes personalized Chiron reports. You write like a wise friend who's been through hell and back. You call people out WITH love, not judgment.

VOICE RULES:
- Use phrases like "as hell" (once max), "Let's be real...", "Here's the thing...", "Stop [pattern]. Start [action].", "You're not broken, you're just...", "That's not [fear], that's [truth].", "WTF" (when appropriate), "sick of your own BS", "who the hell"
- Ask direct questions: "Want to know why?" "Sound familiar?"
- Mix short punchy sentences with flowing paragraphs
- Use "you" and "your" constantly
- Use modern metaphors, not mystical ones
- Give specific examples, not vague generalities

NEVER USE: "sacred", "divine", "cosmic dance", "illuminate the path", "gentle soul", "tender heart", "ancient wisdom", "journey of awakening", "quiet chambers", "tapestry of your soul", "delicate thread", or any overly poetic/mystical descriptions.

CRITICAL FORMATTING RULE: NEVER use em-dashes, en-dashes, or double hyphens. Use periods, commas, parentheses, or rewrite as two sentences instead.

READ THIS OUT LOUD TEST: Does it sound like a wise friend having coffee with you, or like a mystical oracle delivering prophecies? If it's the latter, rewrite it.`;

function buildUserMessage(name: string, chironSign: string, chironHouse: string | undefined, chironDegree: number): string {
  const hasHouse = chironHouse && chironHouse !== "Unknown";
  const placementDesc = hasHouse
    ? `${name} whose Chiron is in ${chironSign} in the ${chironHouse} at ${chironDegree.toFixed(2)} degrees`
    : `${name} whose Chiron is in ${chironSign} at ${chironDegree.toFixed(2)} degrees. Birth time was not provided, so focus on the sign-based interpretation`;

  const houseNote = hasHouse
    ? `- The intersection of the sign wound and house area of life\n`
    : '';

  const openingExamples = hasHouse
    ? `- "Your Chiron in ${chironSign} in the ${chironHouse} tells a story of [pattern]. It probably started with [early experience]. Now it looks like [current manifestation]."`
    : `- "Your Chiron in ${chironSign} tells a story of [pattern]. It probably started with [early experience]. Now it looks like [current manifestation]."`;

  const shadowCount = hasHouse ? 7 : 5;
  const shadowItems = Array.from({ length: shadowCount }, (_, i) => `- [Shadow pattern ${i + 1}${hasHouse ? ' with brief explanation' : ''}]`).join('\n');

  const medicineCount = hasHouse ? 5 : 4;
  const medicineItems = Array.from({ length: medicineCount }, (_, i) => `- [Healing gift ${i + 1}]`).join('\n');

  return `Generate a comprehensive, deeply personal shadow work report for ${placementDesc}.

Format EXACTLY like this, with these sections (do NOT include a header for the placement, start directly with Archetype):

**Archetype:** [Give archetype name - do NOT include "The" prefix]

**Theme:** [One sentence about the core theme]

**Chiron's Story**

[Opening paragraph about their Chiron placement - use varied openings like "You've spent your whole life...", "There's a pattern here that's been with you since...", "The wound runs deep...", or "Your Chiron whispers a story..." - NOT always "Here's the thing about..."]

**Core Wound**

[Write 3-4 paragraphs explaining:
${houseNote}- Early life patterns and what they learned
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

${shadowItems}

${hasHouse ? '[Add a closing sentence about the overall pattern]\n\n' : ''}**Your Medicine**

When integrated, this placement becomes POWERFUL:

${medicineItems}

Your wound becomes your superpower:
[One powerful line about their transformation]

**Your Invitation**

[Write 3-4 paragraphs that:
- Name their healing edge
- Contrast past patterns with future self
- Give them a specific practice or way of being
- End with empowerment]

**Journal / Reflection Prompts**

IMPORTANT: Provide EXACTLY 2 reflection questions - no more, no less:

- [Deep reflection question 1]
- [Deep reflection question 2]

Example openings (vary these - use different ones each time):
- "You've spent your whole life [pattern]. Maybe [experience 1], maybe [experience 2]. But somewhere along the way, you learned [belief]."
- "There's a pattern here that's been with you since the beginning. [Describe early pattern]. And it still shows up as [current manifestation]."
- "The wound runs deep with this placement. [Describe the core issue]. You learned early that [belief]. Now? [Current struggle]."
${openingExamples}

Write like you're having coffee with them, telling them the truth they need to hear.`;
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

    const userMessage = buildUserMessage(name, chironSign, chironHouse, chironDegree);

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 4096,
          temperature: 0.85,
        }),
      });
      if (response.ok || response.status === 401 || response.status === 403) break;
      console.log(`Chat completion attempt ${attempt + 1} failed (HTTP ${response.status}), retrying...`);
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }

    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      const body = response ? await response.text() : 'no response';
      throw new Error(`Failed to generate report (HTTP ${status}): ${body || 'empty response'}`);
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content;

    if (!report) {
      throw new Error("No content in OpenAI response");
    }

    const validation = validateReport(report);

    return new Response(
      JSON.stringify({
        report,
        status: validation.status,
        isValid: validation.isValid,
        length: validation.length,
        missingSections: validation.missingSections
      }),
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
