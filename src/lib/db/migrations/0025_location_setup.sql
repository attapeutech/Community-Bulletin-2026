CREATE TABLE "location_setup" (
	"location_id" uuid PRIMARY KEY NOT NULL,
	"wifi_name" text,
	"wifi_password_enc" text,
	"contact_name" text,
	"contact_phone" text,
	"network_notes" text,
	"checklist" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "location_setup" ADD CONSTRAINT "location_setup_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_setup" ADD CONSTRAINT "location_setup_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;