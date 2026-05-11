<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


<claude-mem-context>
# Memory Context

# [prospkt.ai] recent context, 2026-05-11 1:29pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (22,432t read) | 124,083t work | 82% savings

### May 4, 2026
S2 Audit Prospkt.ai codebase for launch readiness: identify blockers, technical debt, and next steps for successful AI sales rep agent launch (May 4 at 10:23 PM)
S1 Implement animations inspired by ReadyLaunch Framer Motion template into prospkt.ai marketing website (May 4 at 10:23 PM)
S3 Product strategy lock for Prospkt: decide core positioning, ICP, outbound scope, and vertical focus through guided questionnaire. (May 4 at 10:26 PM)
### May 5, 2026
83 1:32p ✅ SQLite Migration: Service-Sales Columns Added with Backward Compatibility
84 " ✅ Lead Upsert Logic: Service-Sales Fields with Smart Defaults
85 1:33p ✅ Lead Lifecycle Updates: Service-Sales Profile Mutations with Audit Trail
86 " ✅ Type Guard Functions: Runtime Validation for ContactType and CampaignLane
87 1:34p ✅ PATCH /api/leads: Input Validation for Service-Sales Fields
88 " ✅ Source Field Default: Manual vs Lead Scraper
89 " 🔵 Lead Scraper: Yelp Integration with Website Quality Detection and Priority Scoring
90 1:35p ✅ Lead Scraper: Yelp Leads Enriched with Campaign and Service Metadata
91 " 🟣 Campaigns View: Multi-Lane Campaign Dashboard with Playbook Details
92 1:36p 🔵 App Layout: Navigation Structure and View Routing
93 1:47p ✅ Updated help view navigation shortcuts and onboarding content
94 1:48p 🟣 Added service preset templates to onboarding form
95 " 🔵 Home view uses campaign-lane-aware lead display with guardrail enforcement
96 " 🔵 Sidebar navigation structure reflects new campaign-first navigation model
97 " 🔵 Sidebar invite banner and user menu reflect campaign-first positioning
98 " ✅ Home view imports and uses campaign lane labels constant
99 " ✅ Landing page repositioned from lead-scraping tool to service-sales revenue layer
100 1:50p ✅ Landing page LeadsMockup updated to show campaign-lane-focused queue
101 " ✅ Landing page target industry labels refined for service-business positioning
102 " ✅ Landing page testimonial, features, FAQ, and CTA reframed for warm-recovery-first positioning
103 1:51p ✅ Landing page workflow steps and activity log reframed for warm-recovery-first flow
104 " ✅ Landing page campaign example updated from Lansing no-website list to estimate follow-up campaign
105 1:52p 🔵 Landing page patch verification failed - expected TCPA window guardrail not found in page.tsx
106 " 🔵 Landing page.tsx guardrails checklist missing TCPA/Local-hour window label; Lansing example not yet updated
107 " 🔵 Landing page DialerMockup section confirmed with TCPA window and Lansing example; patch context located
108 " ✅ Landing page DialerMockup steps and campaign example successfully updated
109 " ✅ Landing page AI voice mockup script updated to show estimate follow-up scenario
110 1:53p ✅ Landing page activity log updated to show warm-recovery and compliance filtering examples
111 " ✅ Landing page bookings mockup updated to show service job appointments instead of discovery calls
112 " 🔵 Database schema includes service-business fields and campaign-lane support
113 1:54p 🔵 Agent guardrails and orchestration enforce compliance checks before every call
114 " 🔵 Agent orchestrator implements guarded automation with dry-run, budget checks, guardrail evaluation, and failure lockout
115 " 🔵 Lead ranker uses website status multiplier to adjust priority scores
116 " 🔵 Caller module generates dynamic scripts and integrates Vapi for mid-call booking with fallback test mode
117 1:55p 🔵 Guardrails module enforces local-hour calling windows and state-based timezone inference
118 " ✅ Added campaign-lane and compliance field validation to evaluateLeadGuardrails
119 " ✅ Lead ranker enhanced to prioritize warm-recovery lanes and estimate values
120 " 🔵 Claude script generation engine produces warm, AI-disclosed openers with comprehensive objection handling
121 1:56p ✅ Claude script generation updated to use service-business context and campaign-lane-aware prompts
122 " ✅ Caller's leadToContext function expanded to include all service-business fields
123 " ✅ Vapi call invocation updated to pass campaign-lane context as variableValues and metadata
124 1:57p 🔵 Types module defines navigation keys, label mappings for status/contact type/campaign lanes
125 " ✅ Appointments view retitled to Bookings with service-sales terminology
126 1:58p 🔵 Codebase fully integrated with campaign-lane and service-business terminology
127 2:00p 🔵 API leads route.ts updated from file-based mock to database-backed service-business lead management
128 2:01p 🔵 Session changes: 60+ files modified, 7 deleted, 20+ new files for campaign-lane and service-business refactor
### May 11, 2026
129 1:28p 🔵 Active refactoring of prospkt.ai codebase with marketing homepage restructuring
130 " 🔵 prospkt.ai architecture expansion: 70 uncommitted changes with auth, database, and multi-tenant workspace support
131 " 🔵 TypeScript type checking passes without errors on prospkt.ai refactored codebase
S4 Status check on prospkt.ai refactoring: 70 uncommitted changes introducing auth, database, workspace, and agent systems. User presented three strategic forks for next action. (May 11 at 1:28 PM)
132 1:29p 🔵 New directory structure detailed: auth routes, API endpoints, and component organization confirmed

Access 124k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>