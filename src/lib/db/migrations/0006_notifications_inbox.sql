ALTER TYPE "public"."notification_type" ADD VALUE 'ad_cancelled';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'ad_expiring';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'ad_pending_review';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'store_ad_paid';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'earnings_available';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payout_sent';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");