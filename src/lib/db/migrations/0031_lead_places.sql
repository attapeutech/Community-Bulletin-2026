ALTER TABLE "leads" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "place_id" text;--> statement-breakpoint
CREATE INDEX "leads_place_idx" ON "leads" USING btree ("place_id");