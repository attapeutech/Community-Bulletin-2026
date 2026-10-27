ALTER TYPE "public"."payout_method" ADD VALUE 'stripe';--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_details_submitted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_payouts_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manual_payout_allowed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "period" text;--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_owner_period_uq" ON "payouts" USING btree ("owner_id","period");