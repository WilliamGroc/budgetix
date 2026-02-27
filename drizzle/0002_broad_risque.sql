CREATE TABLE "bank_account_share" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_account_id" integer NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_account_share" ADD CONSTRAINT "bank_account_share_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account_share" ADD CONSTRAINT "bank_account_share_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_account_share_account_idx" ON "bank_account_share" USING btree ("bank_account_id");--> statement-breakpoint
CREATE INDEX "bank_account_share_user_idx" ON "bank_account_share" USING btree ("shared_with_user_id");