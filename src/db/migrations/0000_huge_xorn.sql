CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"distance_meters" real NOT NULL,
	"duration_seconds" integer NOT NULL,
	"steps" integer,
	"calories" integer,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"source" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"healthkit_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_healthkit_id_unique" UNIQUE("healthkit_id")
);
--> statement-breakpoint
CREATE TABLE "allowances" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"earned_minutes" integer DEFAULT 0 NOT NULL,
	"used_minutes" integer DEFAULT 0 NOT NULL,
	"bonus_minutes" integer DEFAULT 0 NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allowances_user_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_type" text NOT NULL,
	"activity_type" text NOT NULL,
	"target_value" real NOT NULL,
	"target_unit" text NOT NULL,
	"reward_minutes" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_completed_date" date,
	"multiplier" real DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"push_token" text,
	"notifications_enabled" boolean DEFAULT false NOT NULL,
	"daily_reminder_enabled" boolean DEFAULT true NOT NULL,
	"daily_reminder_time" text DEFAULT '08:00' NOT NULL,
	"streak_alerts_enabled" boolean DEFAULT true NOT NULL,
	"weekly_summary_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowances" ADD CONSTRAINT "allowances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_user_id_idx" ON "activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activities_started_at_idx" ON "activities" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "activities_user_started_idx" ON "activities" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "allowances_user_id_idx" ON "allowances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "allowances_date_idx" ON "allowances" USING btree ("date");--> statement-breakpoint
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_user_active_idx" ON "goals" USING btree ("user_id","is_active");