ALTER TABLE "locations" ADD COLUMN "tax_rate_bps" integer;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "tax_location_code" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "tax_area_name" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "tax_rate_period" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "tax_rate_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tax_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tax_rate_bps" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tax_location_code" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tax_area_name" text;