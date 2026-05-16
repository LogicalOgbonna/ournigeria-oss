-- AlterTable
ALTER TABLE "social_posts" ADD COLUMN     "agent_confidence" DOUBLE PRECISION,
ADD COLUMN     "agent_reasoning" TEXT,
ADD COLUMN     "classifier_intent" VARCHAR(50),
ADD COLUMN     "classifier_score" DOUBLE PRECISION,
ADD COLUMN     "discovered_tweet_id" VARCHAR(100),
ADD COLUMN     "original_tweet_snapshot" JSONB,
ADD COLUMN     "quoted_tweet_id" VARCHAR(100),
ADD COLUMN     "safety_warnings" JSONB;

-- CreateTable
CREATE TABLE "socials_bot_session" (
    "id" UUID NOT NULL,
    "cookie" TEXT NOT NULL,
    "csrf_token" TEXT NOT NULL,
    "authorization" TEXT NOT NULL,
    "x_client_transaction_id" TEXT NOT NULL,
    "x_client_uuid" TEXT NOT NULL,
    "user_name" VARCHAR(100) NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "search_timeline_op_hash" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'idle',
    "cooldown_until" TIMESTAMPTZ,
    "started_working_at" TIMESTAMPTZ,
    "stopped_working_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ NOT NULL,
    "last_error" TEXT,
    "consecutive_errors" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socials_bot_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socials_topic" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "query" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "cursor" TEXT,
    "description" TEXT NOT NULL,
    "positive_examples" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "negative_examples" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domain" VARCHAR(20) NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "min_followers" INTEGER NOT NULL DEFAULT 1000,
    "max_followers" INTEGER NOT NULL DEFAULT 500000,
    "lang" VARCHAR(10) NOT NULL DEFAULT 'en',
    "min_text_length" INTEGER NOT NULL DEFAULT 20,
    "max_age_hours" INTEGER NOT NULL DEFAULT 48,
    "last_run_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socials_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socials_discovered_tweet" (
    "id" VARCHAR(100) NOT NULL,
    "author_rest_id" VARCHAR(100) NOT NULL,
    "author_screen_name" VARCHAR(100) NOT NULL,
    "author_name" VARCHAR(200) NOT NULL,
    "author_bio" TEXT NOT NULL,
    "author_followers" INTEGER NOT NULL,
    "author_profile_image_url" TEXT,
    "text" TEXT NOT NULL,
    "lang" VARCHAR(10),
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "quote_count" INTEGER NOT NULL DEFAULT 0,
    "retweet_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "is_quote" BOOLEAN NOT NULL DEFAULT false,
    "is_reply" BOOLEAN NOT NULL DEFAULT false,
    "tweet_created_at" TIMESTAMPTZ NOT NULL,
    "draft_status" VARCHAR(20),
    "draft_attempts" INTEGER NOT NULL DEFAULT 0,
    "draft_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socials_discovered_tweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socials_tweet_classification" (
    "tweet_id" VARCHAR(100) NOT NULL,
    "topic_id" UUID NOT NULL,
    "model_version" VARCHAR(50) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "intent" VARCHAR(50) NOT NULL,
    "passed_threshold" BOOLEAN NOT NULL,
    "classified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socials_tweet_classification_pkey" PRIMARY KEY ("tweet_id","topic_id","model_version")
);

-- CreateTable
CREATE TABLE "socials_tweet_seen" (
    "tweet_id" VARCHAR(100) NOT NULL,
    "topic_id" UUID NOT NULL,
    "classified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passed_threshold" BOOLEAN NOT NULL,

    CONSTRAINT "socials_tweet_seen_pkey" PRIMARY KEY ("tweet_id","topic_id")
);

-- CreateTable
CREATE TABLE "socials_session_run" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    "stop_reason" VARCHAR(50),
    "tweets_scanned" INTEGER NOT NULL DEFAULT 0,
    "tweets_filtered" INTEGER NOT NULL DEFAULT 0,
    "tweets_classified" INTEGER NOT NULL DEFAULT 0,
    "matches_stored" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "socials_session_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socials_roam_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "pid" INTEGER,
    "host" VARCHAR(200),
    "heartbeat_at" TIMESTAMPTZ,
    "alert_no_sessions" BOOLEAN NOT NULL DEFAULT false,
    "alert_no_topics" BOOLEAN NOT NULL DEFAULT false,
    "agent_budget_alert" BOOLEAN NOT NULL DEFAULT false,
    "drafter_backlog_alert" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "socials_roam_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socials_x_oauth_tokens" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "rotated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socials_x_oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_socials_bot_session_claimable" ON "socials_bot_session"("status", "cooldown_until");

-- CreateIndex
CREATE UNIQUE INDEX "uq_socials_bot_session_user_path" ON "socials_bot_session"("user_name", "path");

-- CreateIndex
CREATE UNIQUE INDEX "socials_topic_name_key" ON "socials_topic"("name");

-- CreateIndex
CREATE INDEX "idx_socials_topic_stale" ON "socials_topic"("enabled", "last_run_at");

-- CreateIndex
CREATE INDEX "idx_socials_discovered_tweet_author" ON "socials_discovered_tweet"("author_rest_id");

-- CreateIndex
CREATE INDEX "idx_socials_discovered_tweet_draft_status" ON "socials_discovered_tweet"("draft_status", "created_at");

-- CreateIndex
CREATE INDEX "idx_socials_tweet_classification_topic_passed" ON "socials_tweet_classification"("topic_id", "passed_threshold", "classified_at");

-- CreateIndex
CREATE INDEX "idx_socials_tweet_seen_classified_at" ON "socials_tweet_seen"("classified_at");

-- CreateIndex
CREATE INDEX "idx_socials_session_run_started_at" ON "socials_session_run"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "social_posts_discovered_tweet_id_key" ON "social_posts"("discovered_tweet_id");

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_discovered_tweet_id_fkey" FOREIGN KEY ("discovered_tweet_id") REFERENCES "socials_discovered_tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socials_tweet_classification" ADD CONSTRAINT "socials_tweet_classification_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "socials_discovered_tweet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socials_tweet_classification" ADD CONSTRAINT "socials_tweet_classification_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "socials_topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socials_tweet_seen" ADD CONSTRAINT "socials_tweet_seen_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "socials_topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socials_session_run" ADD CONSTRAINT "socials_session_run_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "socials_bot_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socials_session_run" ADD CONSTRAINT "socials_session_run_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "socials_topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
