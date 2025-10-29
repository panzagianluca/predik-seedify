-- Notifications table migration (standalone)
CREATE TABLE IF NOT EXISTS "notifications" (
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

-- Add foreign key if notifications table was created
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_comments_id_fk" 
        FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "notifications_user_address_idx" ON "notifications" USING btree ("user_address");
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" USING btree ("user_address","is_read");
