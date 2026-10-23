CREATE TYPE "public"."earning_status" AS ENUM('pending', 'available', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."payout_method" AS ENUM('zelle', 'check');--> statement-breakpoint
CREATE TABLE "owner_earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid,
	"owner_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"ad_title" text NOT NULL,
	"gross_cents" integer NOT NULL,
	"fee_cents" integer,
	"share_rate_bps" integer NOT NULL,
	"amount_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "earning_status" DEFAULT 'pending' NOT NULL,
	"available_at" timestamp,
	"released_at" timestamp,
	"payout_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "owner_earnings_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"method" "payout_method" NOT NULL,
	"reference" text,
	"note" text,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_website" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "payout_method" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "payout_zelle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "payout_mailing_address" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "store_number" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "price_per_week_cents" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "equipment_provided" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "category" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "logo_url" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "business_hours" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "contact_phone" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "contact_address" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "contact_website" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "show_phone" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "show_address" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "show_website" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "website_click_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "fee_cents" integer;--> statement-breakpoint
ALTER TABLE "owner_earnings" ADD CONSTRAINT "owner_earnings_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_earnings" ADD CONSTRAINT "owner_earnings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_earnings" ADD CONSTRAINT "owner_earnings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_earnings" ADD CONSTRAINT "owner_earnings_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owner_earnings_owner_status_idx" ON "owner_earnings" USING btree ("owner_id","status");