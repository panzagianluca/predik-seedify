CREATE INDEX "token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "email_verification_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_stats_user_id_idx" ON "user_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "total_volume_idx" ON "user_stats" USING btree ("total_volume");--> statement-breakpoint
CREATE INDEX "last_trade_idx" ON "user_stats" USING btree ("last_trade_at");--> statement-breakpoint
CREATE INDEX "wallet_address_idx" ON "users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "username_idx" ON "users" USING btree ("username");