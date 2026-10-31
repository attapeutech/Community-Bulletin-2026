CREATE TABLE "demos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_by" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "demos_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "demo_id" uuid;--> statement-breakpoint
ALTER TABLE "demos" ADD CONSTRAINT "demos_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demos" ADD CONSTRAINT "demos_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demos" ADD CONSTRAINT "demos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demos_lead_idx" ON "demos" USING btree ("lead_id");--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_demo_id_demos_id_fk" FOREIGN KEY ("demo_id") REFERENCES "public"."demos"("id") ON DELETE cascade ON UPDATE no action;