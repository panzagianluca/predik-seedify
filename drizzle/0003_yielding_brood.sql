CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text NOT NULL,
	"market_slug" varchar(255),
	"comment_id" uuid,
	"from_user_address" varchar(42),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_address_idx" ON "notifications" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_address","is_read");