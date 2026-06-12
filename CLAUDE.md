# Prospkt — Front Office for Local Service Businesses (YALID LLC)

> **Canonical V1 design lives in:** `docs/superpowers/specs/2026-05-20-prospkt-v1-design.md`
> Read that before any V1 implementation decision. This file captures conventions and the high-level "why."

## Project Overview

Prospkt is the AI front office for local service businesses — HVAC, plumbing, electrical, and roofing operators running 1–5 trucks who don't have a receptionist and miss 30–60% of their inbound calls.

**V1 wedge (shipping):** an AI receptionist that answers missed and after-hours calls, qualifies callers using trade-specific intelligence, books appointments directly into Cal.com, and texts the owner a summary in real time. Self-serve in <15 minutes. $99/mo with booking included; $0 free tier (25 calls/mo, no credit card).

**Long-game (years 2–5):** Receptionist is the trojan horse. The company becomes the front office daily-driver for the operator — adding outbound revival (V2, built on the existing outbound code), CRM integrations (Jobber first), review collection, lead routing, cross-trade referral marketplace, and eventually a vertical financial layer. See the V1 spec's "Ambition Arc" section.

**Why this exists:** Avoca AI ($1B valuation, 800 customers) owns the enterprise segment ($3M+ rev, 5+ CSRs, ServiceTitan-required). They explicitly exclude the 1–5 truck operator who has no CSR at all. That segment loses $45k–$120k/yr per shop to missed calls. No incumbent serves them well — Goodcall is robotic, Rosie gates booking behind $149/mo, human services run $200–700/mo. We win this segment by being trade-native, self-serve, and undeniably good on voice quality.

## Tech Stack

**Application:**
- Next.js 14 App Router (Turbopack)
- TypeScript — no `any` types ever
- Tailwind CSS + shadcn/ui (Dialog, Select, Tabs, Sheet, Tooltip) + @phosphor-icons/react
- Switzer font (Fontshare CDN) — confirmed in use; do not swap (Fraunces/Poppins were tried and rejected)
- Clerk (`@clerk/nextjs` v7) for auth + native waitlist (`clerk.joinWaitlist`)
- Vercel for hosting
- Data: `node:sqlite` for local dev (`data/prospkt.sqlite`) → Postgres via `pg` + Drizzle for prod (waitlist storage switches on `DATABASE_URL`; see `lib/prelaunch-storage.ts`)

> **Stack reality vs. plan (read this):** The original "V1 Voice stack" below (Pipecat + Twilio media streams + Cartesia + Claude Haiku via Vercel AI Gateway) was the *intended* target. **It was never built.** As of June 2026 the shipped voice stack is the Vapi pipeline. There is no Pipecat, no Cartesia, and no `ai` SDK / AI Gateway installed. Treat the block below as aspirational; treat "Actual voice stack (shipped)" as truth.

**Actual voice stack (shipped — the live "Max" demo):**
- **Orchestration:** Vapi (`@vapi-ai/web`) — config in `app/api/voice/vapi-config/route.ts`
- **LLM:** Groq (Llama 3.3 70B) — low-latency inference
- **STT:** Deepgram nova-3
- **TTS:** ElevenLabs `eleven_turbo_v2_5` (tuned calm/steady: stability 0.58, style 0.22, speed 0.98)
- `@anthropic-ai/sdk` is installed and used for Claude elsewhere (not the voice path)

**Aspirational / future voice stack (NOT built):**
- **Telephony:** Twilio Programmable Voice (websocket media streams)
- **Orchestration:** Pipecat (Apache 2.0, Python)
- **STT:** Whisper Turbo via Groq
- **LLM:** Claude Haiku via Vercel AI Gateway
- **TTS:** Cartesia Sonic 2
- **Recording:** Twilio dual-channel → Vercel Blob (private)

**Integrations:**
- Cal.com for booking (`lib/calendar.ts`, env `CALCOM_API_KEY`) — live
- Resend for email (`lib/email.ts`) — wired; sends only once a domain is verified
- Twilio for SMS notifications + phone numbers
- Stripe for billing — NOT installed yet (future)

## Folder Conventions

| Path | Purpose |
|---|---|
| `app/api/twilio/` | Twilio voice webhooks, SMS outbound, number provisioning |
| `app/api/waitlist/` | Prelaunch list (existing) |
| `app/prelaunch/` | Public waitlist page (existing) |
| `app/app/` | Authenticated dashboard (existing) |
| `lib/voice/` | Pipecat session, provider adapters, trade prompts, outcome classifier |
| `lib/voice/providers/` | `cartesia.ts`, `groq-whisper.ts`, `claude-haiku.ts` |
| `lib/voice/prompts/` | `hvac.ts`, `plumbing.ts`, `electrical.ts`, `roofing.ts` |
| `lib/calendar.ts` | Cal.com booking integration |
| `lib/sms.ts` | Twilio SMS outbound |
| `lib/database.ts` | SQLite schema + queries |
| `lib/onboarding/` | Number provisioning, carrier-specific forwarding instructions |
| `lib/v2/` | Parked outbound code (lead scraper, dialer, revival) — out of V1 scope |
| `components/ui/` | shadcn primitives |
| `components/app/` | Authenticated app shell components |
| `components/marketing/` | Prelaunch / public marketing components |
| Environment vars | `.env.local` only — never hardcode API keys |

## Design (Light Mode — see `app/globals.css` for tokens)

Source of truth is the CSS variables in `globals.css` (`--canvas`, `--surface`, `--foreground`, `--muted-foreground`, `--hairline`, `--border`, `--success`, `--warning`, `--danger`). Use Tailwind utility classes that map to those tokens (`bg-surface`, `text-muted-foreground`, `border-hairline`).

- Aesthetic: editorial minimalism — Notion meets Linear, clean and spacious
- NO dark mode, NO gradients, NO glow effects, NO shadows beyond subtle borders
- Status indicators: colored dots only — no filled badge backgrounds
- Font: Switzer — 700–800 for headings, 400–500 for body, 600 uppercase for labels (use `tracking-[0.06em]`)

> **Deliberate prelaunch exception:** `app/prelaunch/` intentionally breaks the "no gradients / no glow" rule — it uses a soft pastel voice-reactive bottom glow (`components/marketing/voice-glow.tsx`) and a matte pastel "voice orb" (`components/marketing/voice-orb.tsx`). This is approved, marketing-only, and must NOT propagate to the app/dashboard. Do not "fix" it. The orb is locked to the matte-pastel look (glass/saturated/pearl variants were rejected). Keep prelaunch copy tight and em-dash-free.

## Component Rules

- Use shadcn/ui for: Dialog, Select, Tabs, Sheet, Tooltip, Toast (when added), Progress (when added)
- Use native HTML for: tables, lists, buttons, forms — accessibility-first
- Use `cn()` from `@/lib/utils` for all conditional classNames
- Never manually recreate shadcn primitives

## Icons

- Use `@phosphor-icons/react` for ALL icons
- NEVER use `lucide-react`
- Server Components: import from `@phosphor-icons/react/dist/ssr`
- Weights: `regular` for nav, `bold` for emphasis, `fill` for active states
- Sizes: 18px nav, 20px stat cards, 16px table actions

## Next.js Rules

- App Router only — never pages directory
- Server components by default, `"use client"` only when needed
- API routes use `route.ts` with named GET/POST exports
- Use `next/image` for all images
- For AI features, default to the Vercel AI Gateway with `"anthropic/claude-haiku-4-5"` string IDs — preserve provider portability

## Core TypeScript Interfaces (V1)

```ts
// Inbound caller during a Prospkt-handled call
interface CallSession {
  id: string;
  workspaceId: string;
  twilioCallSid: string;
  callerPhone: string;
  callerName: string | null;        // captured during conversation
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;       // Vercel Blob (private)
  transcript: string | null;          // full conversation, populated post-call
  status: 'ringing' | 'in_progress' | 'completed' | 'failed';
}

// Booking handed off to Cal.com during a call
interface Booking {
  id: string;
  workspaceId: string;
  callId: string;
  calcomEventId: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  ownerApproved: boolean;             // optional review step
  createdAt: string;
}

// Structured trade-intelligence record — the moat
// Schema lives in canonical V1 spec; do not modify without updating spec
interface CallOutcome {
  id: string;
  workspaceId: string;
  callId: string;
  trade: 'hvac' | 'plumbing' | 'electrical' | 'roofing';
  primaryIntent: 'emergency_service' | 'routine_service' | 'install_quote'
               | 'repair_quote' | 'maintenance' | 'complaint' | 'inquiry' | 'spam' | 'other';
  tradeSubcategory: string;
  urgency: 'now' | 'this_week' | 'this_month' | 'unspecified';
  jobSizeEstimate: 'small' | 'medium' | 'large' | 'unknown';
  jobValueMentioned: number | null;
  isRepeatCustomer: boolean | null;
  homeOrBusiness: 'residential' | 'commercial' | 'unknown';
  unitAgeYears: number | null;
  durationSeconds: number;
  customerTurnCount: number;
  agentTurnCount: number;
  sentimentStart: -1 | 0 | 1;
  sentimentEnd: -1 | 0 | 1;
  ownerNotified: boolean;
  outcome: 'booked' | 'captured_callback' | 'transferred_owner' | 'voicemail_left'
         | 'hung_up' | 'spam_filtered' | 'agent_failure';
  bookingId: string | null;
  bookedAppointmentTime: string | null;
  trainingDataConsent: boolean;
  piiRedactedTranscript: string | null;
  createdAt: string;
}

interface Workspace {
  id: string;
  ownerId: string;                    // Clerk user
  businessName: string;
  trade: 'hvac' | 'plumbing' | 'electrical' | 'roofing';
  twilioPhoneNumber: string;          // assigned at signup
  forwardingState: 'pending' | 'verified' | 'failed';
  businessHours: BusinessHours;
  afterHoursRouting: 'always_ai' | 'after_hours_only' | 'busy_only';
  calcomConnected: boolean;
  calcomEventTypeId: string | null;
  voicePersonaName: string;           // "Sarah", "Jess", etc.
  trainingDataOptIn: boolean;         // defaults true, one-click toggle
  stripeCustomerId: string | null;
  plan: 'free' | 'starter' | 'pro';
  createdAt: string;
}
```

## API Rules

- All external calls go through `/lib/` files — never call APIs directly from components or route handlers
- Always use try/catch and return typed responses
- Log errors to console in development; structured logging in production
- Return `{ success: false, error: string }` shape on failure
- Voice provider failures must trigger Pipecat fallback chain (Cartesia → ElevenLabs Flash → OpenAI TTS) so a single provider outage doesn't kill a call

## V1 TCPA / Recording Compliance (Inbound)

V1 is inbound-only, which changes the compliance shape from the original outbound spec:
- **Recording disclosure** at the start of every call: hardcoded into the agent's greeting ("This call may be recorded for quality and training purposes.")
- **Two-party consent states** (CA, FL, IL, MA, MD, MT, NH, PA, WA, others): explicit per-state handling configured in `lib/voice/compliance.ts`. If caller is in a two-party state, agent confirms consent before substantive conversation.
- **PII redaction** before any structured record enters a training pipeline (names, addresses, phone numbers, payment info)
- **Per-workspace training opt-in** with clear disclosure in onboarding and one-click toggle in settings
- **Recordings stored encrypted** at rest (Vercel Blob private). Workspace owner has explicit data-deletion right.
- **No outbound calling in V1** — the original outbound TCPA rules (DNC scrubbing, calling hours, disclosure, opt-out keypress) ship with V2 when outbound revival lands.

## Build Roadmap

**V1 (10–14 weeks, current focus) — see canonical spec for full breakdown:**
- Twilio number provisioning + carrier forwarding instructions
- Pipecat voice agent (Cartesia + Whisper-Groq + Haiku)
- Trade-tuned prompts (HVAC, plumbing, electrical, roofing)
- Cal.com booking handoff
- Owner SMS notifications + daily digest email
- Web dashboard: call log, transcripts, recordings, settings, billing
- Free tier + Stripe billing (Starter $99 / Pro $249 + per-booked-job opt-in add-on)
- Structured `CallOutcome` capture on every call (P0 — the moat)

**V2 (year 2):**
- Outbound revival engine (existing outbound code, parked in `lib/v2/`)
- Jobber integration (read estimates, write bookings back)
- Review collection workflow
- SMS broadcast / drip campaigns
- Trade-specific fine-tuned models (using V1 outcome data)

**V3+ (years 3–5):**
- Housecall Pro + ServiceTitan integrations
- Cross-trade in-app referral marketplace
- Manufacturer / distributor channel partnerships (Ferguson, Carrier, Lennox, GAF)
- Vertical financial layer (financing, factoring, payments)

## Strategic Save-Points

| Commit | What it captures |
|---|---|
| `e01bc03` | Pre-pivot state (prelaunch + outbound dashboard) |
| `f7a0f01` | V1 design spec landed |
| `dfa4f77` | V1 spec + WIP snapshot of outbound dashboard work |

If V1 doesn't pan out, `git reset --hard e01bc03` returns to pre-pivot state with the outbound work intact.

## What NOT to Do

- Do not add features to V1 beyond the canonical spec — scope creep is the V1-killer risk
- Do not skip structured `CallOutcome` capture under shipping pressure — it's the year 2–5 moat
- Do not call Anthropic SDK directly — go through Vercel AI Gateway
- Do not introduce dark mode, gradients, or fake-glossy SaaS art
- Do not use `lucide-react` (Phosphor only)
- Do not write outbound dialer code in V1 paths — it goes in `lib/v2/`
- Do not commit anything to public training pipelines without PII redaction + workspace opt-in
- Do not make channel partnership promises before having a working V1 product
