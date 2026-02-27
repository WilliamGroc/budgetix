CREATE TABLE "scheduled_transfer" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"from_account_id" integer NOT NULL,
	"to_account_id" integer NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"day_of_month" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduled_transfer" ADD CONSTRAINT "scheduled_transfer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transfer" ADD CONSTRAINT "scheduled_transfer_from_account_id_bank_account_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transfer" ADD CONSTRAINT "scheduled_transfer_to_account_id_bank_account_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_transfer_user_idx" ON "scheduled_transfer" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_transfer_from_idx" ON "scheduled_transfer" USING btree ("from_account_id");--> statement-breakpoint
CREATE INDEX "scheduled_transfer_to_idx" ON "scheduled_transfer" USING btree ("to_account_id");