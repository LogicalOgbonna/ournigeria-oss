-- AlterTable
ALTER TABLE "social_posts" ADD COLUMN     "dispatched_at" TIMESTAMPTZ,
ADD COLUMN     "reconcile_status" VARCHAR(20),
ADD COLUMN     "telegram_actor" VARCHAR(120),
ADD COLUMN     "telegram_carded_at" TIMESTAMPTZ,
ADD COLUMN     "telegram_claimed_at" TIMESTAMPTZ,
ADD COLUMN     "telegram_claimed_by" VARCHAR(120),
ADD COLUMN     "telegram_post_chat_id" VARCHAR(64),
ADD COLUMN     "telegram_post_message_id" VARCHAR(64);

-- AlterTable
ALTER TABLE "socials_bot_session" ADD COLUMN     "user_tweets_op_hash" VARCHAR(100);

-- CreateIndex
CREATE INDEX "idx_social_posts_telegram_carded" ON "social_posts"("platform", "status", "telegram_carded_at");
