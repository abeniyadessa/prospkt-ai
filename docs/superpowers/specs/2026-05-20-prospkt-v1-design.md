# Prospkt V1 — Design Spec

**Date:** 2026-05-20
**Status:** Approved direction. Ready for implementation planning.
**Author:** PM lead (Claude), with founder approval at each gate.

---

## Context

Prospkt was originally scoped as an outbound AI sales rep for local service businesses — missed-call recovery, estimate revival, and reactivation via voice. The existing codebase (per `CLAUDE.md` and the current `app/` tree) implements outbound dialing through Vapi.ai, a Cal.com booking integration, a prelaunch waitlist, and a SQLite-backed leads/calls schema.

Pre-launch market research (see signal report in conversation) surfaced two strategic findings:

1. **The "AI sales rep" outbound category is crowded and capital-saturated.** Avoca AI ($1B valuation, $125M raised, 800 customers) owns the enterprise segment ($3M+ rev, 5+ CSRs, ServiceTitan/HCP required). Hatch dominates SMS nurture for mid-market roofers. The space is well-funded and the buyer is paranoid about outbound AI.
2. **The 1–5 truck owner-operator segment is open.** These operators are missing 27–62% of inbound calls (worth $45k–$120k/yr per shop, $350–$1,200 per missed HVAC call). Avoca explicitly excludes them. Goodcall serves them but reviews flag latency and robotic voice. Rosie AI starts at $49/mo but gates booking behind a $149 tier. No incumbent owns this segment well.

The V1 pivot: keep the trade-tuned AI agent core, but lead with **inbound missed-call coverage** for the operator-who-never-had-a-receptionist. The outbound work already built becomes the V2 upsell.

## Positioning

> **"The AI receptionist for the operator who's never had one."**
> Built for 1–5 truck HVAC, plumbing, electrical, and roofing shops. No ServiceTitan required. No demo. Live in 15 minutes. Pay per booked job available.

**ICP (Ideal Customer Profile):**
- Trade: HVAC primary, plumbing/electrical/roofing secondary
- Size: $300k–$3M annual revenue, 1–5 trucks
- Phone reality: Owner answers or it goes to voicemail. No dedicated CSR/receptionist.
- CRM reality: Uses Jobber, Joist, Google Sheets, or nothing. **Does not use ServiceTitan or Housecall Pro.** This is intentional — Avoca owns that segment.
- Budget: $0–$200/mo per tool
- Behavior: Will not sit through a sales demo. Will set up software at 9pm on a Tuesday between jobs.

**Defensible differentiation:**
1. **Trade-tuned voice agents** — HVAC vocabulary, emergency-keyword detection ("no heat," "leak," "no AC"), age-of-unit qualification, repair-vs-replace logic. Plumbing and electrical get their own prompt sets.
2. **Booking at the entry tier** — competitors (Rosie) gate booking behind their $149 plan; we ship it at $99.
3. **Outcome-priced upgrade option** — $25/booked-job add-on past included cap. No incumbent offers true outcome pricing. Operators understand it instantly.
4. **Self-serve in <15 min** — forward your number, pick trade, set hours, done. Zero sales touch in V1.
5. **Premium voice quality** — Cartesia Sonic 2 over older bundled options. Voice naturalness is the moat.

## Goals & Non-goals

**V1 goals:**
- Ship a working inbound AI receptionist within 6–8 weeks.
- Acquire first 25 paying customers via product-led, content-led GTM (no sales calls).
- Validate the $99 price point and per-booked-job add-on through usage data.
- Voice quality must be indistinguishable from a human receptionist in the first 5 seconds of a call.
- COGS per call must support 60–70% gross margin at the $99 tier (matches the pricing-table targets below).

**V1 non-goals (explicit defer):**
- ❌ Outbound calling (missed-call callback, estimate revival, reactivation) — V2
- ❌ ServiceTitan / Housecall Pro CRM integration — V2 (we talk about it in marketing, don't ship it)
- ❌ Email channel — V2
- ❌ Multi-location / team seats — V2
- ❌ Custom script builder UI — V1 ships 4 trade-tuned scripts (HVAC, plumbing, electrical, roofing), no editor
- ❌ Mobile app — V2 (responsive web only)
- ❌ SMS broadcast / drip campaigns — V2
- ❌ Reviews / reputation management — out of scope entirely

## Product surface (V1 includes)

### 1. Self-serve onboarding (<15 min target)
- Sign up with email + business name + trade (HVAC / Plumbing / Electrical / Roofing)
- Provision a Twilio phone number scoped to the workspace
- Show forwarding instructions for the operator's existing carrier (T-Mobile, Verizon, AT&T cards)
- Set business hours + after-hours routing rule (always / after-hours only / busy only)
- Optional: connect Cal.com for direct booking handoff (skip = bookings get logged for manual follow-up)
- Stripe billing setup, start on free tier (25 calls/mo, no CC required)

### 2. AI inbound voice agent
- Pipecat-orchestrated voice agent on Twilio inbound stream
- **Stack:** Whisper Turbo (Groq) STT → Claude Haiku 4.5 LLM → Cartesia Sonic 2 TTS
- Trade-specific system prompts with hardcoded TCPA-style disclosure
- Emergency-keyword detection routes urgent calls (broken AC mid-summer, leak, no heat) to direct owner ring or text
- Booking flow: agent reads available Cal.com slots, confirms, books, ends call
- Voicemail fallback: if AI can't qualify, capture name/number/issue and SMS the owner
- Sub-700ms end-to-end response latency target (Cartesia TTFT <100ms, Haiku ~300ms, Whisper ~200ms)

### 3. Owner notification flow
- Inbound call ends → immediate SMS to owner with summary: name, phone, issue, urgency, booking status
- Owner can tap a link to listen to recording, see transcript, and approve/reject any booked appointment
- Daily digest email at 6pm: calls handled, leads captured, bookings made

### 4. Web dashboard (responsive)
- Live call status (only relevant if multiple operators ever)
- Call log with: caller name, phone, timestamp, recording, transcript, sentiment, outcome (booked/captured/spam/transferred)
- Lead detail drawer: full conversation, captured fields, booking link, manual notes
- Settings: business hours, trade selection, voice persona name ("Hi, this is Sarah from Miller HVAC..."), Cal.com connection, billing
- Usage: calls this month, calls remaining on plan, bookings this month, opt-in to outcome pricing

### 5. Free tier (no credit card)
- 25 calls/month
- Message-taking only (no booking handoff)
- Owner SMS notification
- 7-day call history retention
- Watermarked recordings ("Powered by Prospkt")
- Enough to feel the product. Not enough to depend on it.

## User flows

### Flow A — First-time signup (target: 12 minutes)
1. Land on `/sign-up` from organic content or referral
2. Email + password + business name + trade (4 fields)
3. Workspace created, Twilio number provisioned in <30s, shown immediately
4. Carrier-specific call-forwarding instructions with screenshots (we cover top 5 US carriers)
5. Test call button: agent calls the user's phone, the user answers, hears a 30-second demo
6. Business hours + after-hours rule (3 clicks)
7. Optional Cal.com OAuth (skip allowed)
8. "You're live" screen

### Flow B — First production call
1. Customer dials operator's published phone number
2. Operator's carrier forwards (after-hours / busy / no-answer) to Prospkt Twilio number
3. Pipecat session opens; agent answers in <2 rings with operator's branded greeting
4. Conversation: greet → identify need → qualify (emergency? home/business? unit age?) → propose booking
5. If booking confirmed: agent reads slot, confirms, calls Cal.com API, sends owner SMS
6. If not bookable (price-shopping, spam, complex): capture details, end call, SMS owner with summary
7. Recording + transcript saved, dashboard updated, owner notified within 30s of call end

### Flow C — Owner morning review
1. Owner opens daily digest email or dashboard
2. Sees 4 calls overnight: 2 booked, 1 captured-for-callback, 1 spam
3. Taps on captured-for-callback → reads transcript → calls customer back manually
4. Approves or reschedules the 2 AI-booked appointments
5. Total time: ~3 minutes

## Technical architecture

### Voice stack (replaces current Vapi integration)
| Layer | Choice | Notes |
|---|---|---|
| Telephony | Twilio Programmable Voice (websocket media streams) | ~$0.0085/min inbound |
| Orchestration | Pipecat (Apache 2.0, Python) | Replaces Vapi orchestration entirely |
| STT | Whisper Turbo via Groq (free tier → cheap) | Fallback: Deepgram Nova 3 |
| LLM | Claude Haiku 4.5 | Via Anthropic API |
| TTS | Cartesia Sonic 2 | ~$0.025/min, sub-90ms TTFT |
| Recording | Twilio dual-channel recordings | Stored in Vercel Blob (private) |
| Transcript persistence | Whisper batch on full recording (Groq) | More accurate than streaming chunks |

**Per-call cost (5-min avg):** ~$0.18–$0.22. At 200 calls/mo on $99 plan, COGS ~$36/mo → 64% gross margin. At 500 calls on $249, COGS ~$90/mo → 64% gross margin. Healthy.

### Application stack (keep current)
- Next.js 14 App Router on Vercel
- TypeScript everywhere
- Tailwind + shadcn/ui (existing)
- SQLite via node:sqlite for V1 → migrate to Neon Postgres before scale-out
- Vercel AI Gateway for LLM access (not direct Anthropic — keeps provider portability)
- Clerk for auth (existing)
- Stripe for billing
- Twilio for SMS notifications + phone numbers
- Cal.com OAuth for booking (existing)

### What gets removed/rebuilt
- ❌ `lib/agents/orchestrator.ts` outbound dialer logic — moved to `lib/v2/` for later
- ❌ Vapi webhook handler → replaced by Pipecat session events
- ❌ Outbound call routes in `app/api/agent/run` — feature-flagged off
- ❌ Lead scraper (`lib/scraper.ts`) — out of scope, defer to V2
- ❌ DNC scrubbing (relevant for outbound only) — defer
- ✅ Keep: workspace model, calls schema, leads schema, Cal.com integration, prelaunch page, settings tabs

### New code (rough surface)
- `lib/voice/pipecat-session.ts` — orchestrates per-call session
- `lib/voice/providers/cartesia.ts`, `groq-whisper.ts`, `claude-haiku.ts` — provider adapters
- `lib/voice/prompts/{hvac,plumbing,electrical,roofing}.ts` — trade-tuned system prompts
- `app/api/twilio/incoming/route.ts` — Twilio voice webhook, opens Pipecat session
- `app/api/twilio/sms-notify/route.ts` — outbound owner SMS notification
- `lib/onboarding/provision-number.ts` — Twilio number purchase + assign
- `lib/onboarding/forwarding-instructions.tsx` — carrier-specific UI
- Dashboard pages: live call view, settings/voice persona, billing tier picker

## Pricing & business model

| Tier | Price | Included | Margin target |
|---|---|---|---|
| **Free** | $0 | 25 calls/mo, message-taking, owner SMS, 7-day history | Loss leader |
| **Starter** | **$99/mo** | 200 calls, booking, recordings, transcripts, trade scripts, all integrations | 60–70% gross |
| **Pro** | $249/mo | 800 calls, analytics, priority numbers, multi-number routing | 70%+ gross |
| **Outcome add-on** | +$25/booked job over plan cap | Optional, opt-in | Highest margin tier |

**Why Starter at $99 not $149:** Rosie's booking-included tier is $149. Undercutting by $50 with a better voice and trade-specific prompts is a violent differentiator at the same time as a clear cost-savings comparison ("less than half a hired CSR's first hour").

**Why outcome pricing as add-on, not core:** Pure outcome pricing is hard to evaluate (unpredictable monthly bill scares solo operators). Adding it as opt-in past the included call cap means heavy users grow into outcome pricing as their business grows — and we capture revenue scaling with their success.

## GTM motion (D-path: no customer interviews, build-to-find-out)

Because the founder explicitly declined the "do customer interviews" path, V1 GTM compensates via:

### Content engine
- **Free missed-call ROI calculator** as the primary lead magnet (`/calculator`). Inputs: trade, monthly revenue, missed-call estimate. Outputs: $/yr lost. Captures email at the end. SEO-targeted at "how much does a missed call cost HVAC."
- Weekly comparison post: "Prospkt vs Goodcall," "Prospkt vs Ruby," "AnswerForce vs AI receptionist for HVAC" — content built to capture decision-stage search traffic
- YouTube shorts: 60-second demos of the AI handling specific HVAC scenarios (no AC, after-hours emergency, price shopper)
- Reddit presence: r/HVAC, r/plumbing, r/roofing, r/electricians — answer questions, soft-mention Prospkt only on direct relevance threads
- Trade FB groups (where indexed): comment value-first

### Public signal mining (replaces interviews)
- Weekly scrape of r/HVAC, r/Roofing, r/Plumbing for missed-call / answering-service threads
- G2/Capterra review monitoring on Goodcall, Rosie, AnswerForce, Ruby — pull complaint patterns
- Synthesize into product backlog and content topics

### Free tier as the qualification funnel
- Free tier acquires usage data we'd otherwise get from interviews
- Behavior tells us what to build: which trade has highest activation, what gets configured most, which integrations get requested in support
- Convert at 5–10% to paid based on call volume hitting the 25-call cap

### Distribution beachheads
- Trade podcast sponsorships once at $5k MRR (HVAC School, Roofing Insights, To The Top)
- Stripe Atlas / open-source repo as a credibility signal (lean into the "open source" tag the prelaunch page already advertises — at minimum publish the voice prompts, the Cal.com integration, and the carrier-forwarding guides as open repos)

## What we defer to V2

- **Outbound revival engine** — your existing code, reborn as the upsell
- **CRM integrations** — Jobber first (largest small-operator overlap), then Housecall Pro, then ServiceTitan
- **Estimate-revival workflow** — upload your CRM, AI calls back stale estimates
- **Reactivation campaigns** — dormant-customer outreach
- **Email channel** for follow-ups
- **Team / multi-seat** support
- **Mobile app**
- **Custom script editor**

## Success metrics for V1 (90 days post-launch)

| Metric | Target | Why |
|---|---|---|
| Free signups | 500 | Validates content/SEO motion |
| Free→Paid conversion | 5–10% | Industry-standard freemium |
| Paying customers at day 90 | 25 | Cash-flow positive vs voice COGS |
| MRR at day 90 | $3k–$5k | Funds podcast sponsorships |
| Voice quality NPS | >50 | "Did the AI sound human?" survey |
| First-call activation | 85% | % of new accounts that handle a real call within 7 days of signup |
| Booking conversion | 30%+ | % of qualified inbound calls that result in confirmed booking |
| COGS per call | <$0.25 | Margin guardrail |

## Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Cartesia outage / pricing change | High | Pipecat is provider-swappable. Fallback to ElevenLabs Flash configured behind a flag. |
| Voice still scares customers despite Cartesia | Existential | Build TTS A/B framework week 1. Test Cartesia vs ElevenLabs vs OpenAI Realtime in real calls. Pick the highest measured NPS. |
| Rosie / Goodcall undercut on price | Medium | Outcome pricing is the moat — competitors won't follow easily. Continued voice quality investment. |
| Avoca moves down-market | Medium | They have an institutional moat against this (sales motion, demo-heavy, enterprise sales cycle). 12+ month runway before they could re-platform. |
| Open-source TTS catches up faster than expected | Low (good problem) | Pipecat lets us swap to Kokoro self-hosted in a sprint. Margin upside. |
| Twilio number provisioning friction (porting, carrier-specific forwarding bugs) | High | Manual onboarding fallback for first 50 customers — direct CS via email/Slack. Document carrier quirks. |
| TCPA / call-recording compliance | High | Hardcoded disclosure in every greeting. Recordings stored encrypted. Per-state opt-in handling in onboarding settings. |
| Founder writing code alone burns out | Medium | Spec is sized for 6–8 weeks of work, not 16. Cut V2 features aggressively if any slip. |

## Open questions (resolve in writing-plans phase)

- Migration plan for existing prelaunch waitlist signups → V1 free tier invite
- SOC2 / data residency posture for recordings (defer formal compliance, document data flow now)
- Whether to ship a Chrome extension for desktop call review or keep mobile-web only
- Twilio Verified Caller ID timing — needed for outbound V2, can wait until then

## Decision log (key strategic choices made during brainstorming)

1. **Pivot direction: B (AI receptionist), not A (current sales rep) or C (marketing OS).** Self-serve trial, public-signal mining, content GTM, sticky from day one, natural expansion path.
2. **ICP: 1–5 truck operators, sub-$3M rev, no CSR, not on ServiceTitan.** Avoca won't compete here. Real moat is institutional, not technical.
3. **Pricing: $99 with booking included.** Undercut Rosie's gated $149 tier.
4. **Outcome pricing as opt-in add-on, not core.** Solo operators fear unpredictable bills.
5. **Voice stack: hybrid (Cartesia + Pipecat + Whisper Groq + Haiku).** Voice quality is the moat. Self-hosted open TTS not yet production-ready for phone calls. Revisit Kokoro in 6–12 months.
6. **Defer outbound to V2.** The existing outbound code becomes the natural upsell, not the wedge.
7. **D-path GTM constraint.** Content + free tier + public signal mining + free-tool lead magnets. No sales motion.

---

**Next step:** invoke `superpowers:writing-plans` to turn this spec into an executable implementation plan with phases, dependencies, and concrete tasks.
