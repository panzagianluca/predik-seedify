CREATE TABLE "comment_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_address" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_votes_comment_id_user_address_unique" UNIQUE("comment_id","user_address")
);
--> statement-breakpoint
CREATE TABLE "comments" (
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
--> statement-breakpoint
CREATE TABLE "market_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"end_date" timestamp NOT NULL,
	"source" text,
	"outcomes" text NOT NULL,
	"created_by" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"voter_address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_votes_unique" UNIQUE("proposal_id","voter_address")
);
--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_votes" ADD CONSTRAINT "proposal_votes_proposal_id_market_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."market_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_votes_comment_id_idx" ON "comment_votes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_votes_user_address_idx" ON "comment_votes" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "comments_market_id_idx" ON "comments" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "comments_parent_id_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "comments_votes_idx" ON "comments" USING btree ("votes");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "proposals_category_idx" ON "market_proposals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "proposals_status_idx" ON "market_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposals_upvotes_idx" ON "market_proposals" USING btree ("upvotes");--> statement-breakpoint
CREATE INDEX "proposals_created_at_idx" ON "market_proposals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "proposal_votes_proposal_id_idx" ON "proposal_votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "proposal_votes_voter_address_idx" ON "proposal_votes" USING btree ("voter_address");