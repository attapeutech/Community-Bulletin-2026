CREATE TABLE "ad_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "ad_orders" ADD CONSTRAINT "ad_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_orders_user_idx" ON "ad_orders" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_order_id_ad_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."ad_orders"("id") ON DELETE set null ON UPDATE no action;