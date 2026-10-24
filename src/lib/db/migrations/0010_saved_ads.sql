CREATE TABLE "saved_ads" (
	"user_id" uuid NOT NULL,
	"ad_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_ads_user_id_ad_id_pk" PRIMARY KEY("user_id","ad_id")
);
--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_ads_ad_idx" ON "saved_ads" USING btree ("ad_id");