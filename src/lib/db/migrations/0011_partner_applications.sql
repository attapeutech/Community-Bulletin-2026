CREATE TYPE "public"."partner_application_status" AS ENUM('pending', 'approved', 'declined');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'partner_application';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'partner_approved';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'partner_declined';--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"phone" text NOT NULL,
	"store_type" text NOT NULL,
	"address_line1" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"locations_count" text NOT NULL,
	"has_screen" text NOT NULL,
	"notes" text,
	"status" "partner_application_status" DEFAULT 'pending' NOT NULL,
	"decline_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"location_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_agreement_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_agreement_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_applications_status_idx" ON "partner_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "partner_applications_user_idx" ON "partner_applications" USING btree ("user_id");