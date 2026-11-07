CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid,
	"type" text NOT NULL,
	"status" text DEFAULT 'in_stock' NOT NULL,
	"label" text,
	"brand" text,
	"model" text,
	"serial_number" text,
	"screen_device_id" text,
	"purchased_on" date,
	"cost_cents" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_screen_device_id_screen_devices_id_fk" FOREIGN KEY ("screen_device_id") REFERENCES "public"."screen_devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipment_location_idx" ON "equipment" USING btree ("location_id");