ALTER TABLE "bank_account" ADD COLUMN "current_balance" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "is_realized" boolean DEFAULT false NOT NULL;