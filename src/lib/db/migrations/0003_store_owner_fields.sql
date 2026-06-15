ALTER TABLE "locations" ADD COLUMN "price_per_week_cents" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "equipment_provided" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "business_hours" text;
