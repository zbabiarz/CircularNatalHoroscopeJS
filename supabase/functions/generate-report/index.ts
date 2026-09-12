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

const SYSTEM_PROMPT = `You are writing a 26-page deep dive Chiron placement report called "Your Shadow Map" for Love, Light, and Black Holes (Morgan Garza). This is a premium paid report that should produce the reaction: "Holy shit, that's me."

You are a psychological astrologer who writes like a smart friend who happens to know depth psychology. You see patterns other people miss. You name things people have felt but never had words for.

CRITICAL VOICE RULES:
- Write in flowing paragraphs (3-6 sentences each). This is NOT a bullet-point report.
- Psychological truth delivered with warmth. Never clinical, never preachy.
- Humor targets coping mechanisms, never the pain itself. "You probably have a PhD in pretending you don't care" not "your pain is funny."
- Use "you" and "your" constantly. This is written TO the person.
- Mix sentence lengths. Short punches after longer observations.
- Use modern language and metaphors. No mystical oracle energy.
- Ask rhetorical questions that land: "Sound familiar?" "Want to know the real reason?"
- Be specific with examples of how patterns show up in daily life.
- No profanity in the report text.
- Every Chiron sign + house combination gets a unique wound. Synthesize sign and house. Never staple them side by side.
- Sign = "what hurts" / House = "where it became personal"

BANNED PHRASES (never use these):
"healing journey", "step into your power", "embrace your authentic self", "sacred wound", "divine feminine/masculine", "cosmic dance", "illuminate the path", "gentle soul", "tender heart", "ancient wisdom", "journey of awakening", "quiet chambers", "tapestry of your soul", "delicate thread", "higher self", "soul contract", "karmic lesson", "twin flame", "starseed", "lightworker", "holding space"

EMOTIONAL ARC (the reader should feel this progression):
1. "Holy shit, that's me" (recognition)
2. "That's why I do that" (understanding the pattern)
3. "Wait, this is actually my superpower" (power recognition)

STRUCTURE: Generate the following 5 sections. Each section should be substantial (multiple rich paragraphs). The total report should be 6000-10000 characters.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

===WOUND_NAME===
[A unique 2-5 word name for this specific wound. Creative, punchy, immediately recognizable. Examples: "The Invisible Expert", "The Emotional Translator", "Performance as Love Language", "The Competence Trap"]

===SECTION_1: THE WOUND===
[Title: Something evocative about this specific wound, not generic]

[3-5 rich paragraphs covering:]
- Name the core wound pattern with startling specificity
- How this wound formed in childhood/early life
- The specific emotional imprint and what they learned to believe
- The protection strategy they developed (their "armor")
- How this shows up in their inner dialogue today
- Sign energy (what hurts) woven with house energy (where it plays out)

===SECTION_2: WHERE IT SHOWS UP===
[Title: Something specific to their patterns]

[3-5 rich paragraphs covering:]
- Adult behavioral patterns (relationships, work, friendships)
- The specific ways they sabotage or protect themselves
- What they do when triggered (fight/flight/freeze/fawn for this placement)
- The stories they tell themselves
- Relationship dynamics this creates
- How other people experience them (the gap between intention and impact)

===SECTION_3: THE POWER===
[Title: Something about transformation or hidden strength]

[3-5 rich paragraphs covering:]
- The adaptive skill hidden inside the wound
- Why this wound made them unusually good at something
- The career/life differentiator nobody else has
- How the thing they thought was broken is actually their edge
- Specific abilities they developed because of this wound
- What wealth/success looks like when they lead with this power

===SECTION_4: PUT IT TO WORK===
[Title: Action-oriented, specific]

[3-5 rich paragraphs covering:]
- Concrete ways to channel this power professionally
- How to recognize when the wound is driving vs. the power
- Daily practices or shifts in perspective (not generic advice, specific to THIS placement)
- What to do when old patterns resurface
- How to build a life/career around this specific strength

===SECTION_5: READ THE PEOPLE YOU LOVE===
[Title: About understanding others through this lens]

[2-3 paragraphs covering:]
- How to spot other people with similar wound patterns
- How understanding their own Chiron helps them in relationships
- A closing message that lands with power and recognition

Remember: every section should read like Morgan is sitting across from the person at a coffee shop, telling them something true about themselves that nobody else has ever put into words. This is not therapy-speak. This is not astrology-speak. This is pattern recognition delivered with love and a little bit of humor.`;

function buildUserMessage(
  name: string,
  chironSign: string,
  chironHouse: string | undefined,
  chironDegree: number
): string {
  const hasHouse = chironHouse && chironHouse !== "Unknown";

  if (hasHouse) {
    return `Write the full Shadow Map deep dive report for ${name}.

Chiron placement: ${chironSign} in the ${chironHouse} at ${chironDegree.toFixed(2)} degrees.

This person has Chiron in ${chironSign} (the sign tells you WHAT hurts, the emotional flavor of the wound) in the ${chironHouse} (the house tells you WHERE it became personal, what area of life it plays out in).

Synthesize sign and house into ONE unified wound narrative. Do not treat them as separate topics stapled together. The sign colors how they experience the wound; the house is where it shows up most intensely.

Write all 5 sections with the wound name. Make it deeply personal and specific to this exact combination. The reader paid $37 for this. Make it worth ten times that.`;
  }

  return `Write the full Shadow Map deep dive report for ${name}.

Chiron placement: ${chironSign} at ${chironDegree.toFixed(2)} degrees. No birth time was provided, so house placement is unknown.

Focus entirely on the sign-based interpretation of Chiron in ${chironSign}. Go deep on the emotional wound pattern, protection strategies, and hidden power of this sign placement. Since we don't have the house, you can explore multiple life areas where this wound commonly manifests.

Write all 5 sections with the wound name. Make it deeply personal. The reader paid $37 for this. Make it worth ten times that.`;
}

const REQUIRED_MARKERS = [
  "===WOUND_NAME===",
  "===SECTION_1:",
  "===SECTION_2:",
  "===SECTION_3:",
  "===SECTION_4:",
  "===SECTION_5:",
];

const MIN_REPORT_LENGTH = 5000;

function validateReport(report: string): {
  isValid: boolean;
  status: string;
  missingMarkers: string[];
  length: number;
} {
  const missingMarkers: string[] = [];
  for (const marker of REQUIRED_MARKERS) {
    if (!report.includes(marker)) {
      missingMarkers.push(marker);
    }
  }

  const isValid = missingMarkers.length === 0 && report.length >= MIN_REPORT_LENGTH;

  let status = "completed";
  if (!isValid) {
    if (missingMarkers.length > 0 && report.length < MIN_REPORT_LENGTH) {
      status = "incomplete_missing_sections_and_short";
    } else if (missingMarkers.length > 0) {
      status = "incomplete_missing_sections";
    } else {
      status = "incomplete_too_short";
    }
  }

  return { isValid, status, missingMarkers, length: report.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("Missing OpenAI API key");
    }

    const { name, chironSign, chironHouse, chironDegree }: RequestBody =
      await req.json();

    const userMessage = buildUserMessage(name, chironSign, chironHouse, chironDegree);

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 8192,
          temperature: 0.82,
        }),
      });
      if (response.ok || response.status === 401 || response.status === 403)
        break;
      console.log(
        `Chat completion attempt ${attempt + 1} failed (HTTP ${response.status}), retrying...`
      );
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }

    if (!response || !response.ok) {
      const status = response?.status ?? "unknown";
      const body = response ? await response.text() : "no response";
      throw new Error(
        `Failed to generate report (HTTP ${status}): ${body || "empty response"}`
      );
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
        missingMarkers: validation.missingMarkers,
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
        error:
          error instanceof Error ? error.message : "Failed to generate report",
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
