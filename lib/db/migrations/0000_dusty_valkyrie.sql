CREATE TABLE "agent_events" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text,
	"type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"lead_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"status" text NOT NULL,
	"mode" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"calls_attempted" integer DEFAULT 0 NOT NULL,
	"calls_skipped" integer DEFAULT 0 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "agent_settings" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"max_calls_per_day" integer DEFAULT 20 NOT NULL,
	"max_cost_per_day_cents" integer DEFAULT 500 NOT NULL,
	"weekend_pause" boolean DEFAULT true NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dnc_entries" (
	"workspace_id" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	CONSTRAINT "dnc_entries_workspace_id_phone_pk" PRIMARY KEY("workspace_id","phone")
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"type" text NOT NULL,
	"body" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"vapi_call_id" text,
	"outcome" text NOT NULL,
	"duration_seconds" integer,
	"transcript" text,
	"summary" text,
	"recording_url" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_memory" (
	"workspace_id" text NOT NULL,
	"phone" text NOT NULL,
	"lead_id" text,
	"business_name" text,
	"city" text,
	"category" text,
	"timezone" text,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_memory_workspace_id_phone_pk" PRIMARY KEY("workspace_id","phone")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Business' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text,
	"timezone" text,
	"website_status" text DEFAULT 'outdated' NOT NULL,
	"priority_score" integer DEFAULT 5 NOT NULL,
	"scraped_at" timestamp with time zone NOT NULL,
	"yelp_url" text,
	"yelp_rating" real,
	"yelp_review_count" integer,
	"status" text DEFAULT 'new' NOT NULL,
	"status_updated_at" timestamp with time zone NOT NULL,
	"last_call_at" timestamp with time zone,
	"call_attempts" integer DEFAULT 0 NOT NULL,
	"next_follow_up_at" timestamp with time zone,
	"notes" text,
	"contact_type" text DEFAULT 'business' NOT NULL,
	"source" text DEFAULT 'Lead scraper' NOT NULL,
	"consent_note" text,
	"service_need" text,
	"service_area" text,
	"estimate_value_cents" integer,
	"campaign_lane" text DEFAULT 'cold_b2b' NOT NULL,
	"playbook" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"user_role" text DEFAULT 'Owner' NOT NULL,
	"timezone" text DEFAULT 'America/Detroit' NOT NULL,
	"offer" text DEFAULT '' NOT NULL,
	"target_buyer" text DEFAULT '' NOT NULL,
	"pitch" text DEFAULT '' NOT NULL,
	"target_cities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"website_statuses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_calls_per_day" integer DEFAULT 20 NOT NULL,
	"max_cost_per_day_cents" integer DEFAULT 500 NOT NULL,
	"weekend_pause" boolean DEFAULT true NOT NULL,
	"booking_email" text,
	"notification_email" text,
	"compliance_accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "script_settings" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"system_prompt_suffix" text DEFAULT '' NOT NULL,
	"first_message_template" text DEFAULT '' NOT NULL,
	"realtime_model" text DEFAULT 'gpt-realtime-2025-08-28' NOT NULL,
	"realtime_voice_id" text DEFAULT 'marin' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_settings" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"timezone" text DEFAULT 'America/Detroit' NOT NULL,
	"booking_email" text,
	"notification_email" text,
	"target_cities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"timezone" text DEFAULT 'America/Detroit' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"owner_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_settings" ADD CONSTRAINT "agent_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_settings" ADD CONSTRAINT "script_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_events_workspace_run" ON "agent_events" USING btree ("workspace_id","run_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_agent_events_workspace_created" ON "agent_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_workspace_started" ON "agent_runs" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_workspace_status" ON "agent_runs" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_dnc_phone" ON "dnc_entries" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_activities_workspace_lead" ON "lead_activities" USING btree ("workspace_id","lead_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_calls_workspace_lead" ON "lead_calls" USING btree ("workspace_id","lead_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_calls_workspace_vapi" ON "lead_calls" USING btree ("workspace_id","vapi_call_id");--> statement-breakpoint
CREATE INDEX "idx_lead_memory_workspace_contacted" ON "lead_memory" USING btree ("workspace_id","last_contacted_at");--> statement-breakpoint
CREATE INDEX "idx_lead_memory_workspace_outcome" ON "lead_memory" USING btree ("workspace_id","outcome");--> statement-breakpoint
CREATE INDEX "idx_leads_workspace_status" ON "leads" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_leads_workspace_priority" ON "leads" USING btree ("workspace_id","priority_score");--> statement-breakpoint
CREATE INDEX "idx_leads_workspace_city" ON "leads" USING btree ("workspace_id","city");
