CREATE TABLE "blocked_apps" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"selection_data" text NOT NULL,
	"selection_id" text NOT NULL,
	"app_count" integer DEFAULT 0 NOT NULL,
	"category_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_apps_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "emergency_bypasses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"bypass_count" integer DEFAULT 1 NOT NULL,
	"total_minutes" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emergency_bypasses_user_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "usage_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"allowance_id" text,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allowances" ADD COLUMN "real_used_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "allowances" ADD COLUMN "enforcement_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "blocked_apps" ADD CONSTRAINT "blocked_apps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_bypasses" ADD CONSTRAINT "emergency_bypasses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_sessions" ADD CONSTRAINT "usage_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_sessions" ADD CONSTRAINT "usage_sessions_allowance_id_allowances_id_fk" FOREIGN KEY ("allowance_id") REFERENCES "public"."allowances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocked_apps_user_id_idx" ON "blocked_apps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "emergency_bypasses_user_id_idx" ON "emergency_bypasses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "emergency_bypasses_date_idx" ON "emergency_bypasses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "usage_sessions_user_id_idx" ON "usage_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usage_sessions_allowance_id_idx" ON "usage_sessions" USING btree ("allowance_id");--> statement-breakpoint
CREATE INDEX "usage_sessions_started_at_idx" ON "usage_sessions" USING btree ("started_at");