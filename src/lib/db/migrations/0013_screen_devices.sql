CREATE TABLE "screen_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"ip" text,
	"user_agent" text,
	"current_path" text,
	"label" text,
	"location_id" uuid,
	"assigned_at" timestamp,
	"checkins" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "screen_devices" ADD CONSTRAINT "screen_devices_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "screen_devices_last_seen_idx" ON "screen_devices" USING btree ("last_seen_at");