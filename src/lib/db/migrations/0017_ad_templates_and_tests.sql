ALTER TABLE "ads" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "template" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "template_data" jsonb;