-- Add comments table for market discussions
CREATE TABLE IF NOT EXISTS "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" text NOT NULL,
	"user_address" text NOT NULL,
	"content" text NOT NULL,
	"gif_url" text,
	"parent_id" uuid,
	"votes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "comments_market_id_idx" ON "comments" ("market_id");
CREATE INDEX IF NOT EXISTS "comments_parent_id_idx" ON "comments" ("parent_id");
CREATE INDEX IF NOT EXISTS "comments_votes_idx" ON "comments" ("votes");
CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments" ("created_at");
