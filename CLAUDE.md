# Prospkt — AI Sales Rep by YALID LLC

## Project Overview
Prospkt is a fully autonomous AI sales rep that finds local businesses with weak websites, calls them using a natural AI voice, qualifies their interest, and books discovery calls directly onto Cal.com — all without manual input. Built by YALID LLC as an internal growth tool, with plans to productize for other businesses.

## Tech Stack
- Next.js 14 App Router (Turbopack)
- TypeScript — no `any` types ever
- Tailwind CSS
- shadcn/ui for complex components (dialogs, selects, toasts)
- Native HTML elements preferred for simple tables, lists, buttons
- @phosphor-icons/react for all icons
- Switzer font (Fontshare CDN)

## Folder Conventions
- API routes → /app/api/
- Vapi.ai call routes → /app/api/vapi/
- Cal.com booking logic → /lib/calendar.ts
- Lead scraping logic → /lib/scraper.ts
- Claude API logic → /lib/claude.ts
- ClickUp logging → /lib/clickup.ts
- Twilio SMS → /lib/sms.ts
- Resend email → /lib/email.ts
- Scraped leads cached → /data/leads.json
- Environment variables → .env.local only — never hardcode API keys

## Design — Current (Light Mode)
- Background: #FFFFFF / #FAFAFA
- Card backgrounds: #FFFFFF, border: #E5E7EB
- Text primary: #0F172A
- Text muted: #737373 (neutral-500 minimum for WCAG AA contrast)
- Accent: #0EA5E9
- Success: #22C55E, Warning: #F59E0B, Danger: #EF4444
- Status indicators: colored dots only — no filled badge backgrounds
- Font: Switzer (Fontshare) — 700-800 for headings, 400-500 for body, 600 uppercase for labels
- NO dark mode, NO gradients, NO glow effects, NO shadows beyond subtle borders
- Aesthetic: editorial minimalism — Notion meets Linear, clean and spacious

## Component Rules
- Use shadcn/ui for: Dialog, Select, Toast, Tabs, Progress, Avatar
- Use native HTML for: tables, lists, buttons, forms — accessibility-first
- Use cn() from @/lib/utils for all conditional classNames
- Never manually recreate shadcn primitives

## TypeScript Interfaces
```ts
interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
  city: string;
  websiteStatus: "none" | "outdated" | "modern";
  priorityScore: number; // 1–10
  createdAt: string;
}

interface Call {
  id: string;
  leadId: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  outcome: "booked" | "not-interested" | "no-answer" | "voicemail" | null;
  duration: number; // seconds
  bookedAt: string | null;
  calcomEventId: string | null;
  createdAt: string;
}
```

## API Rules
- All external calls go through /lib/ files — never call APIs directly from components
- Always use try/catch and return typed responses
- Log errors to console in development
- Return `{ success: false, error: string }` shape on failure

## Icons
- Use @phosphor-icons/react for ALL icons
- NEVER use lucide-react
- Import: `import { HouseIcon, PhoneIcon } from "@phosphor-icons/react"`
- Server Components: import from `@phosphor-icons/react/dist/ssr`
- Weights: "regular" for nav, "bold" for emphasis, "fill" for active states
- Sizes: 18px nav, 20px stat cards, 16px table actions

## Next.js Rules
- App Router only — never pages directory
- Server components by default, "use client" only when needed
- API routes use route.ts with named GET/POST exports
- Use next/image for all images

## Phase 1 Target
- Local service businesses in Michigan with no or weak websites
- Categories: restaurants, auto repair, salons, contractors, chiropractors, retail stores
- Top 20 leads per day passed through the pipeline

## TCPA Compliance (Required)
- AI must identify itself as automated at the start of every call
- Must offer opt-out ("Press 1 to be removed")
- Only call business lines — never personal numbers
- Calling hours: 8am–9pm local time only
- Scrub against DNC registry before dialing
- Log consent/opt-out status in ClickUp for every contact

## Build Roadmap
- Phase 1 ✅ — Project setup, dashboard UI, CLAUDE.md, .env.local
- Phase 2 🔨 — Lead Scraper: /lib/scraper.ts + /app/api/scrape/route.ts
- Phase 3 — Cal.com integration: /lib/calendar.ts
- Phase 4 — Vapi + ElevenLabs AI Caller: /app/api/vapi/ + /lib/claude.ts
- Phase 5 — ClickUp CRM logging: /lib/clickup.ts
- Phase 6 — Twilio SMS follow-up: /lib/sms.ts
- Phase 7 — Live testing: 50–100 real calls, tune script
- Phase 8 — Scale + productize for other businesses
