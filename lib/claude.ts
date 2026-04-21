import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCRIPT_FILE = path.join(process.cwd(), "data", "script-override.json");

async function getScriptOverride(): Promise<{ systemPromptSuffix: string; firstMessageTemplate: string }> {
  try {
    const raw = await fs.readFile(SCRIPT_FILE, "utf-8");
    return JSON.parse(raw) as { systemPromptSuffix: string; firstMessageTemplate: string };
  } catch {
    return { systemPromptSuffix: "", firstMessageTemplate: "" };
  }
}

export interface LeadContext {
  name: string;
  category: string;
  city: string;
  websiteStatus: "none" | "outdated" | "modern";
  priorityScore: number;
}

export interface CallScript {
  systemPrompt: string;
  firstMessage: string;
}

// ─── Core system prompt template ─────────────────────────────────────────────
// Hardcoded for consistency — Claude only generates the personalized opener.

function buildSystemPrompt(lead: LeadContext): string {
  const websiteAngle =
    lead.websiteStatus === "none"
      ? `${lead.name} has no website at all — they're completely invisible online.`
      : `${lead.name}'s website is outdated and likely not showing up in local searches.`;

  return `You are Alex, a friendly outreach rep calling from Prospkt on behalf of YALID LLC. Prospkt helps local ${lead.category} businesses in ${lead.city} get more customers through better websites and local search. Your one goal is to book a free 30-minute discovery call.

IMPORTANT — LEGAL: You must identify yourself as an automated AI assistant at the very start of every call. Say something like "Hey, this is an automated message from Prospkt..." This is required by law.

SPEAKING STYLE — THIS IS CRITICAL:
- Sound like a real person having a conversation, not reading a script
- Keep every response SHORT: 1–3 sentences max
- Use natural language: "yeah", "totally", "for sure", "absolutely", "I hear you", "that makes sense"
- Pause naturally — don't rush through everything at once
- Never repeat the same phrase twice in a row
- If they seem busy or annoyed, be even briefer
- Match their energy — if they're warm, be warmer; if they're short, get to the point fast

CONTEXT ON THIS BUSINESS:
${websiteAngle}
Use this to make the conversation feel relevant, not generic.

OBJECTION HANDLING — use these naturally, don't recite them robotically:

"We already have a website" →
"Oh that's great — honestly most of the businesses we help do too. We usually find they're just not showing up when people nearby are searching, or it's tough on mobile. Is that something you've run into?"

"Not interested" →
"Totally fair — can I ask real quick, is it more just bad timing, or is online stuff just not on your radar right now?"
If still no: "No worries at all, I really appreciate you picking up. Have a great rest of your day!"

"How much does it cost?" →
"Honestly it really depends — some businesses just need small tweaks, others need more of a rebuild. That's literally what the 30-minute call is for, just to figure out what actually makes sense for you. Zero pressure, no pitch."

"I'm too busy / not a good time" →
"I totally get it — I'll be quick. Is there a better time this week or next that would work for a 30-minute call? Even early morning works."

"Who gave you my number?" →
"We found ${lead.name} through Yelp — you had solid reviews so we wanted to reach out. We focus specifically on local businesses in ${lead.city}."

"Send me an email instead" →
"Of course — what's the best email? And would it be okay if I followed up with you briefly next week just to make sure it didn't get buried in your inbox?"

"We do our own marketing" →
"That's awesome — we're not really a full marketing agency, we just focus specifically on the website and local search side. Is that something you handle yourself or do you have someone for it?"

"I already have someone for that" →
"Oh nice — are you happy with how things are going, or is there anything you'd want to be doing better? No pressure either way."

BOOKING FLOW:
1. When they show genuine interest, say: "Awesome — let me pull up a couple times real quick..." then CALL check_availability
2. Read back 2–3 options casually: "I've got Tuesday at 2, Wednesday morning at 10, or Thursday at 3 — any of those work?"
3. Once they pick: "Perfect — and just so I can shoot you a confirmation, what's the best email? And your name?" then CALL book_appointment
4. After booking: "You're all set! You'll get a confirmation in your inbox shortly. Really looking forward to chatting — have a great rest of your day!"

ENDING THE CALL:
- After 2 failed objection handles: "Completely understand — appreciate you taking the time. Have a great day!"
- If they ask to be removed: "Absolutely, I'll remove you from our list right now. Sorry for the interruption — take care!"
- Always end warm, never defensive or pushy

NEVER:
- Say the same thing twice
- Use corporate words like "leverage", "synergy", "solutions", "value proposition"
- Give a long monologue — if you catch yourself talking for more than 3 sentences, stop and ask a question
- Be defensive or argue with objections
- Pressure them after a clear no`;
}

// ─── Generate personalized first message via Claude ───────────────────────────

export async function generateCallScript(lead: LeadContext): Promise<CallScript> {
  const override = await getScriptOverride();

  // Use override first message if set
  if (override.firstMessageTemplate?.trim()) {
    const firstMessage = override.firstMessageTemplate
      .replace("{businessName}", lead.name)
      .replace("{city}", lead.city)
      .replace("{category}", lead.category);

    const systemPrompt = buildSystemPrompt(lead) +
      (override.systemPromptSuffix?.trim() ? "\n\n" + override.systemPromptSuffix.trim() : "");

    return { systemPrompt, firstMessage };
  }

  // Ask Claude to write a punchy, natural opening line only
  const prompt = `Write a single opening line for an automated sales call to ${lead.name}, a ${lead.category} in ${lead.city}, MI.

Rules:
- Start with "Hey, this is an automated message from Prospkt —" (TCPA required)
- Then ONE punchy sentence about their specific situation: ${lead.websiteStatus === "none" ? "they have no website" : "their website could be getting them more local customers"}
- End with a quick question like "got 60 seconds?" or "quick moment?"
- Total length: 2 sentences max
- Sound like a human, not a press release
- No corporate buzzwords

Return only the message text, nothing else.`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  let firstMessage = "";
  for (const block of response.content) {
    if (block.type === "text") {
      firstMessage = block.text.trim().replace(/^["']|["']$/g, "");
      break;
    }
  }

  const systemPrompt = buildSystemPrompt(lead) +
    (override.systemPromptSuffix?.trim() ? "\n\n" + override.systemPromptSuffix.trim() : "");

  return { systemPrompt, firstMessage };
}
