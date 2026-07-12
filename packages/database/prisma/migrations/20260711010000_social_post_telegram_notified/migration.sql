ALTER TABLE "social_posts"
  ADD COLUMN "telegram_notified_at" TIMESTAMPTZ;

CREATE INDEX "idx_social_posts_telegram_notified"
  ON "social_posts" ("telegram_notified_at", "created_at" DESC);
