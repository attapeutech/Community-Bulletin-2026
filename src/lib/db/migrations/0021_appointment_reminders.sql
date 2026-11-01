ALTER TYPE "public"."notification_type" ADD VALUE 'appointments_today';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'appointment_soon';--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" timestamp with time zone;