CREATE TYPE "public"."ad_swap_status" AS ENUM('pending', 'approved', 'denied', 'withdrawn');--> statement-breakpoint
CREATE TABLE "ad_swaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "ad_swap_status" DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"image_key" text NOT NULL,
	"contact_phone" text,
	"contact_address" text,
	"contact_website" text,
	"show_phone" boolean DEFAULT false NOT NULL,
	"show_address" boolean DEFAULT false NOT NULL,
	"show_website" boolean DEFAULT false NOT NULL,
	"template" text,
	"template_data" jsonb,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_swaps" ADD CONSTRAINT "ad_swaps_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_swaps" ADD CONSTRAINT "ad_swaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_swaps" ADD CONSTRAINT "ad_swaps_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_swaps_ad_idx" ON "ad_swaps" USING btree ("ad_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_swaps_one_pending_idx" ON "ad_swaps" USING btree ("ad_id") WHERE "ad_swaps"."status" = 'pending';