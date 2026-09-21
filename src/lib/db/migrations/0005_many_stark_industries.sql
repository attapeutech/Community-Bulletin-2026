ALTER TABLE "users" ADD COLUMN "default_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_website" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "store_number" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "price_per_week_cents" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "equipment_provided" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "business_hours" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "contact_address" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "contact_website" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "show_phone" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "show_address" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "show_website" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "website_click_count" integer DEFAULT 0 NOT NULL;