# Prospkt prelaunch signup pipeline — audit & runbook

_Date: 2026-05-24 — Author: code audit pass_

## TL;DR

The signup pipeline is **functionally wired end-to-end** and should work in dev
(SQLite fallback) and in prod once one DNS step is finished. The current prod
path stores signups in **Resend Contacts**, which is not queryable from the admin
UI. The recommended move is to provision **Neon Postgres** via the Vercel
Marketplace and redeploy — the storage layer auto-switches to Postgres the moment
`DATABASE_URL` is set.

## Pipeline trace

| Step | Where | Status |
| --- | --- | --- |
| Form submit | `components/marketing/prelaunch-email-form.tsx` POSTs `/api/waitlist` with `{ email, source: "prelaunch" }` | OK |
| Validation | `app/api/waitlist/route.ts` — Zod schema accepts `email`, optional `companyName`, `city`, `source` | OK |
| Persistence | `lib/prelaunch-storage.ts` → `createWaitlistSignupRecord` | OK |
| Admin notify email | `lib/email.ts` → `sendWaitlistSignupNotification` to `PROSPKT_NOTIFICATION_EMAIL` (default `abeni@yalid.com`) | OK |
| User confirmation email | `lib/email.ts` → `sendWaitlistConfirmation` from `RESEND_FROM_ADDRESS` (default `Prospkt <notifications@prospkt.ai>`), `reply_to` = notification address | OK |
| Failure mode | If both storage AND notification fail → 500. If storage fails but notification succeeds → 200 with `storage: "email_only"` | OK (graceful degradation) |

### Storage fallback order (`lib/prelaunch-storage.ts`)

1. `DATABASE_URL` present → Postgres (table auto-creates on first insert).
2. `process.env.VERCEL && RESEND_API_KEY` → POST `https://api.resend.com/contacts` with custom properties.
3. Otherwise → local SQLite (`data/prospkt.sqlite`) via `lib/database.ts`.

Local dev hits path 3 because there is no `DATABASE_URL` in `.env.local`.

## What works

- The hero form posts to the right route and renders success state on `{ ok: true }`.
- Both emails are sent in parallel; one failing does not block the other.
- `waitlistStorageMode()` correctly reports what backend was used and is included in the admin notification email body.
- Storage fallback chain is sound and well-typed.

## What needs founder action

### 1. Resend domain verification (REQUIRED for prod delivery)

The `from` address is `notifications@prospkt.ai`. Resend will silently sink or 403 emails from an **unverified sending domain**. You must verify the `prospkt.ai` domain inside Resend:

1. Resend dashboard → **Domains** → **Add Domain** → `prospkt.ai`.
2. Resend lists SPF/DKIM/DMARC TXT records — add them to the DNS provider for `prospkt.ai` (Vercel DNS / wherever the domain is registered).
3. Click **Verify** in Resend. Wait for green checks on SPF + DKIM (DMARC optional but recommended).
4. Confirm `RESEND_FROM_ADDRESS` matches a sender on the verified domain (default already does).
5. Optional but recommended: set up a `notifications@prospkt.ai` mailbox or forwarder so user replies land somewhere — `reply_to` is the admin email, so replies route to `abeni@yalid.com` regardless.

Until this is done, **prod sign-ups will store the row but the user won't get a confirmation email** (and the admin notify will also fail).

### 2. Pick a source-of-truth storage (recommend Postgres — see below)

Right now Vercel prod is using Resend Contacts. That's fine as a contact list, but:
- Not queryable from this dashboard.
- No clean schema; relies on custom `properties` blob.
- Duplicate handling is by Resend's email key with no merge logic of your own.

Switch to Neon Postgres (steps below). Once `DATABASE_URL` is set on Vercel, the next signup is automatically written to Postgres instead.

### 3. (Optional) Set `PROSPKT_NOTIFICATION_EMAIL` env var

Defaults to `abeni@yalid.com`. If you want signups to land elsewhere, set this on Vercel.

## How to add Neon Postgres

Neon is a serverless Postgres provider with first-class Vercel Marketplace integration. This is the cleanest path.

### Step 1 — Open the Vercel Marketplace

1. Go to **vercel.com/dashboard** → click into the **prospkt** project (or its team).
2. In the top nav, click **Storage** (project-scoped) or **Marketplace** (team-scoped). Either works.
3. If on the team Marketplace, search for **Neon** and click **Install**. If on the Storage tab, click **Create Database** → **Neon Postgres**.

### Step 2 — Provision the database

1. Choose **Free tier** (0.5 GiB storage, plenty for waitlist).
2. Pick a **region** geographically close to your Vercel deployment region (e.g. `us-east-1`).
3. Name the database something like `prospkt-prod`.
4. Click **Create**.

### Step 3 — Connect it to the Prospkt project

1. When the Marketplace flow asks **"Connect to a project"**, select **prospkt**.
2. Choose which environments to inject env vars into. Pick **Production**, **Preview**, **Development** (yes to all three for now — you can prune later).
3. Click **Connect**.

Vercel will auto-inject these env vars into the project:

- `DATABASE_URL` — pooled connection string (this is the one the storage layer reads).
- `DATABASE_URL_UNPOOLED` — direct connection (not used by Prospkt today).
- `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` — Neon-flavored aliases (also unused).
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — discrete fields.

**Prospkt only needs `DATABASE_URL`.** The fact that the others get auto-injected doesn't hurt anything.

### Step 4 — Redeploy

Env var changes do **not** apply to existing deployments. You must redeploy.

1. Vercel → **Deployments** tab.
2. Find the latest production deployment → kebab menu → **Redeploy**.
3. Leave **Use existing Build Cache** checked. Click **Redeploy**.

Or push any commit to `main` and Vercel auto-deploys.

### Step 5 — Verify

1. Submit a test email via the prelaunch form on prospkt.ai.
2. Visit **/app/admin/signups** (must be signed in via Clerk). You should see:
   - Total count > 0.
   - Source label: **"Postgres"**.
   - The test signup at the top of the table.
3. (Optional sanity check) In the Neon console: **SQL Editor** → `SELECT * FROM waitlist_signups ORDER BY created_at DESC LIMIT 5;`. The `waitlist_signups` table is created lazily on first insert by `ensurePgTables()`.

### Step 6 — Pull env vars locally (optional)

To run against Neon from your local machine:

```bash
vercel link            # one-time, links cwd to the prospkt project
vercel env pull .env.local
```

This appends `DATABASE_URL` to `.env.local`. Now `npm run dev` writes to Neon instead of SQLite.

## Admin view

Live at **/app/admin/signups** (gated by Clerk via the parent `/app/app/layout.tsx` workspace check). It:

- Calls `listWaitlistSignups(200)` from `lib/prelaunch-storage.ts` — a new helper that handles all three storage modes.
- Shows total count + which backend served the data.
- Renders email / source / company / city / joined date (`tabular-nums`).
- "Refresh" button (top-right) runs a server action that `revalidatePath`s the route.
- Empty state surfaces a "Connect Neon Postgres" message when storage is unreachable or in `resend_contacts` mode (Resend's contacts API isn't a clean list source for an admin grid).

## Risks & follow-ups

- **Resend domain not verified** → no emails will deliver in prod. Highest priority.
- **No deduping in admin notify** → if the same email signs up twice, you get two admin notifications. Acceptable for now.
- **Resend Contacts mode has no admin listing.** If you don't want to provision Postgres, the admin view will show the "connect Neon" empty state. The data is still in your Resend dashboard under Audiences.
- **Migration from Resend Contacts → Postgres is not automatic.** Existing signups stored in Resend Contacts won't appear in Postgres after you flip the switch. If that matters, export from Resend and `INSERT` them manually.
