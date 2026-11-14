ALTER TABLE "ads" ADD COLUMN "qr_scan_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "directions_click_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "call_click_count" integer DEFAULT 0 NOT NULL;