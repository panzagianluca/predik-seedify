-- Create comment_votes table for tracking upvotes
CREATE TABLE IF NOT EXISTS "comment_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_address" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_votes_comment_id_user_address_unique" UNIQUE("comment_id","user_address")
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "comment_votes_comment_id_idx" ON "comment_votes" USING btree ("comment_id");
CREATE INDEX IF NOT EXISTS "comment_votes_user_address_idx" ON "comment_votes" USING btree ("user_address");
