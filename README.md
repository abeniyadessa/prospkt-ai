# Prospkt

**Autonomous AI sales rep that books discovery calls for local service businesses.**

Prospkt finds local businesses with weak or missing websites, calls them with a natural-sounding AI voice, qualifies interest, and books discovery calls directly onto Cal.com — all without manual input.

Built and maintained by [YALID LLC](https://yalid.co).

---

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict, no `any`)
- **Styling:** Tailwind CSS
- **Auth & multi-tenancy:** Clerk Organizations
- **Voice:** Vapi.ai + OpenAI Realtime (`gpt-realtime-2025-08-28`, Marin by default)
- **Calendar:** Cal.com v2 API
- **SMS / Email:** Twilio + Resend
- **Lead sourcing:** Yelp + Google Places
- **Storage:** SQLite (built-in CRM)

## Local development

```bash
npm install
cp .env.example .env.local   # populate keys
npm run dev
```

Open <http://localhost:3000>.

## Compliance

Prospkt is TCPA-compliant by default:

- AI identifies itself as automated at the start of every call
- Honors STOP / opt-out and adds to internal DNC immediately
- Calling hours: 9 AM – 7 PM local time only
- Daily call caps and weekend pauses enforced server-side
- DNC scrubbed before every dial

## License

Copyright © 2026 YALID LLC. All rights reserved.
This is proprietary software. No license is granted for redistribution or commercial use without written permission.
