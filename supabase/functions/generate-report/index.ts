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
  if (!report || typeof report !== 'string') {
    return {
      isValid: false,
      status: 'failed',
      missingSections: REQUIRED_SECTIONS,
      length: 0
    };
  }

  const reportLength = report.trim().length;
  const missingSections: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!report.includes(section)) {
      missingSections.push(section);
    }
  }

  let status = 'completed';
  let isValid = true;

  if (missingSections.length > 0) {
    status = 'partial';
    isValid = false;
  } else if (reportLength < MIN_REPORT_LENGTH) {
    status = 'partial';
    isValid = false;
  }

  return {
    isValid,
    status,
    missingSections,
    length: reportLength
  };
}

async function pollRunStatus(
  apiKey: string,
  threadId: string,
  runId: string,
  maxWaitTime = 180000
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

  throw new Error("Assistant run timed out after 180 seconds");
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

Format EXACTLY like this, with these sections (do NOT include a header for the placement, start directly with Archetype):

**Archetype:** [Give archetype name - do NOT include "The" prefix]

**Theme:** [One sentence about the core theme]

**Chiron's Story**

[Opening paragraph about their Chiron placement - use varied openings like "You've spent your whole life...", "There's a pattern here that's been with you since...", "The wound runs deep...", or "Your Chiron whispers a story..." - NOT always "Here's the thing about..."]

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

IMPORTANT: Provide EXACTLY 2 reflection questions - no more, no less:

- [Deep reflection question 1]
- [Deep reflection question 2]

CRITICAL FORMATTING RULE - ABSOLUTELY NO EXCEPTIONS:
❌ FORBIDDEN: Em-dashes (—), en-dashes (–), or double hyphens (--)
✅ INSTEAD USE: Periods, commas, parentheses, or rewrite as two sentences
✅ EXAMPLE: Instead of "You learned early—maybe from a parent" write "You learned early. Maybe from a parent" OR "You learned early (maybe from a parent)"

MORGAN'S VOICE - MANDATORY REQUIREMENTS:

TONE: Compassionately direct. Like a wise friend who's been through hell and back. Calls you out WITH love, not judgment.

LANGUAGE YOU MUST USE:
- "as hell" (magnetic as hell, scary as hell, exhausted as hell)
- "Let's be real..."
- "Here's the thing..."
- "Stop [pattern]. Start [action]."
- "You're not broken, you're just..."
- "That's not [fear], that's [truth]."
- "WTF" (when appropriate)
- "sick of your own BS"
- "who the hell"
- Questions directly to them: "Want to know why?" "Sound familiar?"

LANGUAGE YOU MUST NEVER USE:
❌ "sacred" ❌ "divine" ❌ "cosmic dance" ❌ "illuminate the path"
❌ "gentle soul" ❌ "tender heart" ❌ "ancient wisdom" ❌ "journey of awakening"
❌ "quiet chambers" ❌ "tapestry of your soul" ❌ "delicate thread"
❌ Any overly poetic or mystical descriptions

SENTENCE STRUCTURE:
- Mix short punchy sentences with flowing paragraphs
- Use "you" and "your" constantly
- Direct questions to the reader
- Modern metaphors (not mystical ones)
- Specific examples, not vague generalities

VOICE EXAMPLES FROM MORGAN'S BOOK:
✅ "There's nothing wrong with you. And no, you're not broken. The system is."
✅ "If anyone tells you they do have it all figured out, run. They're probably a cult leader."
✅ "When you stop abandoning yourself to keep others comfortable, you become magnetic as hell."
✅ "You say yes when you mean no. You stay quiet when you should speak up."
✅ "That discomfort you're feeling? That's not a sign you're doing it wrong. That's the signal that you're finally doing it right."

WHAT THIS SOUNDS LIKE vs WHAT IT DOESN'T:
✅ "You learned early that your needs don't matter as much as keeping the peace. Now you're exhausted from performing."
❌ "Within the tapestry of your soul, a delicate thread has been severed."

✅ "Stop apologizing for taking up space. Start asking for what you need without softening it first."
❌ "Gently invite yourself to explore the tender places within."

✅ "Your wound becomes your superpower when you finally choose yourself over everyone's comfort."
❌ "Your gift is to illuminate the path for others seeking authentic connection."

READ THIS OUT LOUD TEST: Does it sound like a wise friend having coffee with you, or like a mystical oracle delivering prophecies? If it's the latter, rewrite it.

Example openings (vary these - use different ones each time):
- "You've spent your whole life [pattern]. Maybe [experience 1], maybe [experience 2]. But somewhere along the way, you learned [belief]."
- "There's a pattern here that's been with you since the beginning. [Describe early pattern]. And it still shows up as [current manifestation]."
- "The wound runs deep with this placement. [Describe the core issue]. You learned early that [belief]. Now? [Current struggle]."
- "Your Chiron in ${chironSign} in the ${chironHouse} tells a story of [pattern]. It probably started with [early experience]. Now it looks like [current manifestation]."

Write like you're having coffee with them, telling them the truth they need to hear.`
      : `Generate a comprehensive, deeply personal shadow work report for ${name} whose Chiron is in ${chironSign} at ${chironDegree.toFixed(2)} degrees. Birth time was not provided, so focus on the sign-based interpretation.

Format EXACTLY like this (do NOT include a header for the placement, start directly with Archetype):

**Archetype:** [Give archetype name - do NOT include "The" prefix]

**Theme:** [One sentence about the core theme]

**Chiron's Story**

[Opening paragraph about their Chiron placement - use varied openings like "You've spent your whole life...", "There's a pattern here...", "The wound runs deep..." - NOT always "Here's the thing about..."]

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

IMPORTANT: Provide EXACTLY 2 reflection questions - no more, no less:

- [Deep reflection question 1]
- [Deep reflection question 2]

CRITICAL FORMATTING RULE - ABSOLUTELY NO EXCEPTIONS:
❌ FORBIDDEN: Em-dashes (—), en-dashes (–), or double hyphens (--)
✅ INSTEAD USE: Periods, commas, parentheses, or rewrite as two sentences
✅ EXAMPLE: Instead of "You learned early—maybe from a parent" write "You learned early. Maybe from a parent" OR "You learned early (maybe from a parent)"

MORGAN'S VOICE - MANDATORY REQUIREMENTS:

TONE: Compassionately direct. Like a wise friend who's been through hell and back. Calls you out WITH love, not judgment.

LANGUAGE YOU MUST USE:
- "as hell" (magnetic as hell, scary as hell, exhausted as hell)
- "Let's be real..."
- "Here's the thing..."
- "Stop [pattern]. Start [action]."
- "You're not broken, you're just..."
- "That's not [fear], that's [truth]."
- "WTF" (when appropriate)
- "sick of your own BS"
- "who the hell"
- Questions directly to them: "Want to know why?" "Sound familiar?"

LANGUAGE YOU MUST NEVER USE:
❌ "sacred" ❌ "divine" ❌ "cosmic dance" ❌ "illuminate the path"
❌ "gentle soul" ❌ "tender heart" ❌ "ancient wisdom" ❌ "journey of awakening"
❌ "quiet chambers" ❌ "tapestry of your soul" ❌ "delicate thread"
❌ Any overly poetic or mystical descriptions

SENTENCE STRUCTURE:
- Mix short punchy sentences with flowing paragraphs
- Use "you" and "your" constantly
- Direct questions to the reader
- Modern metaphors (not mystical ones)
- Specific examples, not vague generalities

VOICE EXAMPLES FROM MORGAN'S BOOK:
✅ "There's nothing wrong with you. And no, you're not broken. The system is."
✅ "If anyone tells you they do have it all figured out, run. They're probably a cult leader."
✅ "When you stop abandoning yourself to keep others comfortable, you become magnetic as hell."
✅ "You say yes when you mean no. You stay quiet when you should speak up."
✅ "That discomfort you're feeling? That's not a sign you're doing it wrong. That's the signal that you're finally doing it right."

WHAT THIS SOUNDS LIKE vs WHAT IT DOESN'T:
✅ "You learned early that your needs don't matter as much as keeping the peace. Now you're exhausted from performing."
❌ "Within the tapestry of your soul, a delicate thread has been severed."

✅ "Stop apologizing for taking up space. Start asking for what you need without softening it first."
❌ "Gently invite yourself to explore the tender places within."

✅ "Your wound becomes your superpower when you finally choose yourself over everyone's comfort."
❌ "Your gift is to illuminate the path for others seeking authentic connection."

READ THIS OUT LOUD TEST: Does it sound like a wise friend having coffee with you, or like a mystical oracle delivering prophecies? If it's the latter, rewrite it.

Example openings (vary these - use different ones each time):
- "You've spent your whole life [pattern]. Maybe [experience 1], maybe [experience 2]. But somewhere along the way, you learned [belief]."
- "There's a pattern here that's been with you since the beginning. [Describe early pattern]. And it still shows up as [current manifestation]."
- "The wound runs deep with this placement. [Describe the core issue]. You learned early that [belief]. Now? [Current struggle]."
- "Your Chiron in ${chironSign} tells a story of [pattern]. It probably started with [early experience]. Now it looks like [current manifestation]."

Write like you're having coffee with them, telling them the truth they need to hear.`;

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

    const validation = validateReport(report);

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