ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "share_rate_bps" integer DEFAULT 2500 NOT NULL;--> statement-breakpoint
-- Preserve the previous rule: equipment provided = 50%, otherwise 25%
UPDATE "locations" SET "share_rate_bps" = 5000 WHERE "equipment_provided" = true;
