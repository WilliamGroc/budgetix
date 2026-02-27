CREATE TABLE "user_link" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_link" ADD CONSTRAINT "user_link_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_link" ADD CONSTRAINT "user_link_receiver_id_user_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_link_requester_idx" ON "user_link" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "user_link_receiver_idx" ON "user_link" USING btree ("receiver_id");