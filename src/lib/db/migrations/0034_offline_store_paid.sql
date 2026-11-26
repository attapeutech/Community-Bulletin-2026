ALTER TABLE "payments" ADD COLUMN "offline_store_paid_cents" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "offline_store_paid_method" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "offline_store_paid_on" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "offline_store_paid_note" text;