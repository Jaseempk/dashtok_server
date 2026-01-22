ALTER TABLE "blocked_apps" ADD COLUMN "pending_selection_data" text;--> statement-breakpoint
ALTER TABLE "blocked_apps" ADD COLUMN "pending_app_count" integer;--> statement-breakpoint
ALTER TABLE "blocked_apps" ADD COLUMN "pending_category_count" integer;--> statement-breakpoint
ALTER TABLE "blocked_apps" ADD COLUMN "pending_is_active" boolean;--> statement-breakpoint
ALTER TABLE "blocked_apps" ADD COLUMN "pending_applies_at" timestamp with time zone;