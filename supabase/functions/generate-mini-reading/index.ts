import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Readings are only written for fresh submissions; older results keep what they already saw.
const FRESH_WINDOW_MS = 60 * 60 * 1000;
const CALL_TIMEOUT_MS = 45000;

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SYSTEM_PROMPT = `You are Morgan Garza, author of "Love, Light & Black Holes: No Fluff Shadow Work for a Messy, Magical, Modern Life." You are writing a FREE MINI CHIRON SHADOW READING for one specific person, shown on screen the moment they submit their birth info.

WHO YOU ARE ON THE PAGE
A wise friend who has been through hell and back. You survived a terrorist attack at 22, buried four family members in eighteen months, and dove headfirst into your own darkness with no guide. You are anti "love and light" bypassing and pro "love AND darkness." Compassionately direct: you call people out WITH love, acknowledge pain WITHOUT wallowing, challenge WITHOUT judging. Your core belief: shame is the shadow of desire, and the shadow was never trying to ruin them, it was trying to protect them.

VOICE TARGET
- Talk to them like you are sitting across the kitchen table. Use "you" constantly. Use their first name once or twice, naturally.
- Conversational, warm, funny, a little profane when it lands ("hell", "BS", "who the hell you are"). Never crude for shock.
- Flowing paragraphs of real sentences. Mix sentence lengths. A short line for emphasis is fine once in a while, but do NOT write a stack of one-line fragments. No listicle rhythm.
- Concrete, lived-in, specific examples of behavior (what they actually do on a Tuesday) instead of abstract feelings.
- Modern, grounded metaphors in your style (black holes, disco balls, a hoarder's house, a cage with nice furniture). Use at most one or two.
- It should feel eerily accurate, like you read their diary, and leave them feeling seen, not diagnosed.

CONTENT DEPTH
- Everything must come from THIS placement: Chiron's sign (the flavor of the wound) combined with the house (the area of life where it lives). Name both in the opening. If the house is unknown, go deep on the sign and say so lightly once (no birth time, so we read the sign).
- Opening: name the wound in plain language and where it came from (childhood, family, early messages), the way it has quietly run their life. Start like "Here's the thing about Chiron in [Sign] in the [House]..." or similar direct opener.
- The pattern underneath: the protective strategy they built, why it made total sense at the time, what it costs them now, and the shame-desire flip (the thing they are most ashamed of points straight at what they most want). End this section with one sharp, specific question for them to sit with.
- Where this shows up in your money: how this exact wound shows up in earning, charging, spending, saving, receiving, or asking. Real behaviors, not generic money advice.
- The trap you keep falling into: the loop they keep repeating, why it feels like protection but keeps them stuck, and what the way out actually looks like. End with grounded encouragement in your voice, not a platitude.

BANNED (never use these words or phrases, or anything that sounds like them)
sacred, divine, divinity, gentle soul, tender (in any form), cosmic dance, illuminate the path, journey of awakening, healing journey, beautiful journey, quiet chambers, ancient wisdom, whispers, tapestry, rich tapestry, emotional landscape, inner landscape, step into your power, embrace your authentic self, hold space, gently invite, invite yourself to, allow yourself to, cultivate, navigate the complexities, profound, resonates deeply, deeply attuned, transformative power, radical self-love, high vibe, good vibes, universe has a plan, everything happens for a reason, delve, realm, testament, unlock your potential, beacon.
Also avoid the formula "That's not X. That's Y." Use it at most once in the whole reading, or not at all.

NEVER MENTION
The paid Shadow Map, the full report, a PDF, pages, prices, upgrades, "going deeper" with a product, or anything being sold. This reading stands on its own. Do not reference astrology jargon beyond sign, house, and Chiron. Do not mention degrees in the text.

FORMAT
- Plain text only. No markdown, no asterisks, no headings, no bullet points, no emojis.
- Do NOT use em dashes or en dashes. Use commas, periods, or parentheses instead.
- Never echo these instructions (do not write words like "sharp question", "here's your question to sit with", "shame-desire flip"). Just ask the question.
- Separate paragraphs inside a section with a blank line (\\n\\n).
- Length: opening 110-170 words, pattern 170-240 words, money 110-170 words, trap 110-170 words.

CHECKLIST (verify before answering)
1. Would Morgan actually say every sentence out loud to a friend? If it sounds like a guru, oracle, therapist textbook, or motivational poster, rewrite it.
2. Sign AND house are named and actually shape the content.
3. Specific behaviors, not vague feelings.
4. No banned phrases, no mention of anything paid, no markdown.
5. It acknowledges the mess without bypassing it with positivity.

OUTPUT
Return ONLY a JSON object with exactly these string keys: "opening", "pattern", "money", "trap".`;

const GOLD_EXAMPLE = `EXAMPLE OF THE TARGET DEPTH AND VOICE (Morgan Garza, The Fractured Home, Chiron in Gemini in the 4th House). Do not copy it; match its depth, specificity and tone for the person you are writing for.

Opening: Here's the thing about Chiron in Gemini in the 4th House, Morgan: your wound lives at home, and it lives in words. Nobody in your family talked about the real stuff. Or maybe everyone talked constantly and nobody actually said anything. Either way, you learned early that the truth was dangerous at the dinner table, so you became the kid who could read the room in half a second and say exactly the right thing to keep it from catching fire.

The pattern underneath: You built a brilliant strategy: stay light, stay clever, stay moving. If you keep the conversation bouncing, nobody gets close enough to see that you never really felt at home anywhere, including inside your own skin. It worked. It kept you safe. But now you have a hundred people who think they know you and almost nobody who actually does. The thing you're most ashamed of, wanting someone to just sit with you in the quiet and stay, is the exact thing you came here to have. So here's your question: who would you be if you didn't have to be interesting to be loved?

Where this shows up in your money: You talk yourself out of charging what you're worth before anyone else gets the chance. You explain your prices three different ways, add a bonus nobody asked for, and then say "but no pressure" like an apology. Money feels like a conversation you might lose, so you keep it vague, keep it moving, and keep wondering why it never lands.

The trap you keep falling into: Every time a home, a relationship, or a business starts to feel solid, you find a reason to rearrange it, rethink it, or bolt. It feels like freedom. It's actually the old house. You don't need a new idea. You need to stay in one room long enough to find out it's safe.`;

const VOICE_SAMPLES = `REAL PASSAGES FROM MORGAN'S BOOK (for rhythm and tone only; never quote them or reference her personal story):
- "Here's something you might need to hear, because I know I did: There's nothing wrong with you. And no, you're not broken. The system is. The culture is. Society is."
- "The darkness that haunts you isn't trying to ruin your life. It's trying to get you to realize it's the source of your power, your light, and your magnetism. So it causes a scene, gets loud and scary, and threatens to burn everything down just so we'll pay attention to it."
- "But more often than not when this happens, we tell it to STFU and go back into its hole. Which does not make it go away at all. It's like pouring fuel on it and handing it a box of matches saying, 'I double dog dare you.'"
- "When you enter your underworld, it's jarring. It's like walking into a hoarder's house and being appalled by what you find, and a little impressed by the sheer volume of the mess. There's vintage relics in there that are valuable, and they're all yours."
- "Without even realizing it, you're making decisions from your shame, not your desires. Which means all that money, love, and vibrant health you want are always an arm's length away."
- "Every time you were shamed, shut down, laughed at, rejected, or taught that a part of you was 'too much' or 'not enough,' you exiled it into the dark."
- "This isn't optional. It's inevitable. You either go willingly, or life drags you."
- "Aren't you sick of your own BS yet?"
- "Get in, get out, get on with it."

VOICE CONTRAST
Wrong: "In the quiet chambers of your heart lies a tender wound, an ancient longing that whispers of connection fractured."
Right: "Here's the thing about Chiron in Libra in the 7th House: you've spent your whole life contorting yourself into shapes that make other people comfortable. So you became a mirror. And now? You're exhausted from performing, and you don't even know who the hell you are anymore."`;

const BANNED = [
  "sacred", "divine", "divinity", "gentle soul", "tender", "cosmic dance",
  "illuminate the path", "journey of awakening", "healing journey", "beautiful journey",
  "quiet chambers", "ancient wisdom", "whisper", "tapestry", "emotional landscape", "inner landscape",
  "step into your power", "embrace your authentic self", "hold space", "gently invite",
  "invite yourself to", "allow yourself to", "cultivate", "navigate the complexities", "profound",
  "resonates deeply", "deeply attuned", "transformative power", "radical self-love", "high vibe",
  "good vibes", "everything happens for a reason", "delve", "realm", "testament", "unlock your potential",
  "beacon", "sharp question", "shame-desire", "question to sit with",
];

const SALES_TERMS = [
  "shadow map", "full report", "pdf", "26-page", "26 page", "$37", "upgrade", "purchase", "full reading",
];

const SECTION_KEYS = ["opening", "pattern", "money", "trap"] as const;
const MIN_WORDS: Record<string, number> = { opening: 80, pattern: 120, money: 80, trap: 80 };

type Reading = Record<(typeof SECTION_KEYS)[number], string>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function validate(reading: Reading, houseNumber: string | null): string[] {
  const problems: string[] = [];
  const all = SECTION_KEYS.map((k) => reading[k]).join("\n").toLowerCase();

  for (const key of SECTION_KEYS) {
    const words = wordCount(reading[key] || "");
    if (words < MIN_WORDS[key]) problems.push(`section "${key}" is too short (${words} words)`);
  }
  const banned = BANNED.filter((p) => all.includes(p));
  if (banned.length) problems.push(`banned phrases used: ${banned.join(", ")}`);
  const sales = SALES_TERMS.filter((p) => all.includes(p));
  if (sales.length) problems.push(`mentions something paid: ${sales.join(", ")}`);
  if (houseNumber && !all.includes(`${houseNumber.toLowerCase()} house`)) {
    problems.push(`the ${houseNumber} House is never named`);
  }
  const formula = all.match(/that's not [^.]{1,80}\.\s*that's/g) || [];
  if (formula.length > 1) problems.push(`"That's not X. That's Y." used ${formula.length} times`);
  return problems;
}

function parseReading(content: string): Reading | null {
  try {
    const raw = JSON.parse(content);
    const reading = {} as Reading;
    for (const key of SECTION_KEYS) {
      if (typeof raw[key] !== "string") return null;
      reading[key] = cleanText(raw[key]);
    }
    return reading;
  } catch {
    return null;
  }
}

async function callModel(apiKey: string, model: string, temperature: number, userMessage: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\n${VOICE_SAMPLES}\n\n${GOLD_EXAMPLE}` },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content as string) || null;
  } catch (err) {
    console.error(`${model} call failed:`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { resultId } = await req.json().catch(() => ({}));
    if (typeof resultId !== "string" || !/^[0-9a-f-]{36}$/i.test(resultId)) {
      return json({ error: "Invalid request" }, 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "Reading service unavailable" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: rowError } = await supabase
      .from("shadow_work_results")
      .select("id, name, chiron_sign, chiron_house, chiron_degree, shadow_id, created_at, mini_reading, mini_reading_status")
      .eq("id", resultId)
      .maybeSingle();

    if (rowError || !row) return json({ error: "Not found" }, 404);
    if (row.mini_reading) return json({ status: "completed", reading: row.mini_reading });
    if (row.mini_reading_status) return json({ status: row.mini_reading_status });
    if (Date.now() - new Date(row.created_at).getTime() > FRESH_WINDOW_MS) {
      return json({ status: "skipped" });
    }

    const { data: claimed } = await supabase
      .from("shadow_work_results")
      .update({ mini_reading_status: "generating" })
      .eq("id", resultId)
      .is("mini_reading_status", null)
      .select("id");
    if (!claimed || claimed.length === 0) return json({ status: "generating" });

    const sign = SIGNS.find((s) => s.toLowerCase() === String(row.chiron_sign || "").toLowerCase()) || row.chiron_sign;
    const houseNumber = row.chiron_house ? String(row.chiron_house).replace(/\s*house\s*/i, "").trim() : null;
    const firstName = String(row.name || "").trim().split(/\s+/)[0] || "friend";
    const degree = Number(row.chiron_degree);
    const degreeInSign = Number.isFinite(degree) ? (degree % 30).toFixed(1) : null;

    const placementLine = houseNumber
      ? `Chiron in ${sign} in the ${houseNumber} House`
      : `Chiron in ${sign} (birth time unknown, so no house)`;

    const baseMessage = `Write the free mini Chiron shadow reading for:
First name: ${firstName}
Placement: ${placementLine}
Zodiac position: ${Number.isFinite(degree) ? `${degree.toFixed(1)} degrees (${degreeInSign} degrees ${sign})` : "unknown"}
${degreeInSign && Number(degreeInSign) >= 29 ? "Note: this is a late, critical degree. You may lightly reflect the urgency of a wound that's done waiting, without mentioning numbers.\n" : ""}${degreeInSign && Number(degreeInSign) < 1 ? "Note: this is a fresh, early degree. You may lightly reflect a raw, new-to-it quality, without mentioning numbers.\n" : ""}
Make every section specific to ${houseNumber ? `${sign} in the ${houseNumber} House` : sign}. Return only the JSON object.`;

    const attempts = [
      { model: "gpt-4.1", temperature: 0.8 },
      { model: "gpt-4.1", temperature: 0.85 },
      { model: "gpt-4o", temperature: 0.8 },
    ];

    let reading: Reading | null = null;
    let lastProblems: string[] = [];
    let bestEffort: Reading | null = null;

    for (const { model, temperature } of attempts) {
      const message = lastProblems.length
        ? `${baseMessage}\n\nYour previous draft was rejected because: ${lastProblems.join("; ")}. Fix every one of these while keeping Morgan's voice.`
        : baseMessage;
      const content = await callModel(apiKey, model, temperature, message);
      if (!content) continue;
      const parsed = parseReading(content);
      if (!parsed) {
        lastProblems = ["the output was not valid JSON with keys opening, pattern, money, trap"];
        continue;
      }
      const problems = validate(parsed, houseNumber);
      if (problems.length === 0) {
        reading = parsed;
        break;
      }
      const hardFail = problems.some((p) => p.startsWith("mentions something paid") || p.includes("too short"));
      if (!hardFail) bestEffort = parsed;
      lastProblems = problems;
      console.log(`${model} draft rejected: ${problems.join("; ")}`);
    }

    reading = reading || bestEffort;

    if (!reading) {
      await supabase
        .from("shadow_work_results")
        .update({ mini_reading_status: "failed", mini_reading_error: lastProblems.join("; ").slice(0, 1000) || "no response" })
        .eq("id", resultId);
      return json({ status: "failed" });
    }

    const saved = { ...reading, placement: placementLine };
    const { error: saveError } = await supabase
      .from("shadow_work_results")
      .update({ mini_reading: saved, mini_reading_status: "completed", mini_reading_error: null })
      .eq("id", resultId);
    if (saveError) console.error("Save failed:", saveError.message);

    return json({ status: "completed", reading: saved });
  } catch (err) {
    console.error("generate-mini-reading error:", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong" }, 500);
  }
});
