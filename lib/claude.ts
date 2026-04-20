import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

/**
 * Generates a personalized AI call script for a specific lead.
 * The system prompt becomes the Vapi assistant's instructions.
 * The firstMessage is what the AI says when the call connects.
 */
export async function generateCallScript(lead: LeadContext): Promise<CallScript> {
  const websiteContext =
    lead.websiteStatus === "none"
      ? "they have no website at all"
      : lead.websiteStatus === "outdated"
      ? "their website is outdated and not mobile-friendly"
      : "their website could be improved";

  const prompt = `Return ONLY a JSON object — no explanation, no markdown, no preamble. The object must have exactly two keys: "systemPrompt" and "firstMessage".

Context:
- You are writing instructions for an AI voice sales assistant called Prospkt
- It calls local Michigan businesses on behalf of YALID LLC
- Goal: book a 30-minute discovery call about improving their online presence
- Lead: ${lead.category} in ${lead.city}, MI (${websiteContext})

"systemPrompt" value (2 short paragraphs):
- Para 1: Persona + goal. The AI must open every call by identifying itself as an automated AI assistant (TCPA). Be warm and concise — owners are busy. Goal is to book a discovery call.
- Para 2: Tool use. Call check_availability when the lead shows interest and asks about times. Call book_appointment once they confirm a specific slot. End the call gracefully if they are not interested or ask to be removed.

"firstMessage" value (1-2 sentences max):
- Identify as an AI calling from Prospkt
- Mention their business type and the value prop (more customers with better web presence)
- Ask if they have 60 seconds

JSON output:`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  let raw = "";
  for (const block of response.content) {
    if (block.type === "text") {
      raw = block.text.trim();
      break;
    }
  }

  // Strip markdown fences if present
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Extract JSON object in case there's any surrounding text
  const objStart = raw.indexOf("{");
  const objEnd = raw.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1) {
    raw = raw.slice(objStart, objEnd + 1);
  }

  const parsed = JSON.parse(raw) as CallScript;
  return parsed;
}
