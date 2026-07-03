CREATE TABLE "identify_campaign_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "window_date" DATE NOT NULL,
    "window_slot" INTEGER NOT NULL,
    "claimed_by_pid" INTEGER NOT NULL,
    "claimed_by_host" VARCHAR(120) NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "identify_campaign_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "identify_campaign_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" VARCHAR(20) NOT NULL,
    "seat_column" VARCHAR(20) NOT NULL,
    "seat_code" VARCHAR(100) NOT NULL,
    "state_code" VARCHAR(30) NOT NULL,
    "position_id" UUID,
    "social_post_id" UUID,
    "tweet_id" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "identify_campaign_targets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_identify_run_window" ON "identify_campaign_runs"("window_date", "window_slot");
CREATE UNIQUE INDEX "uq_identify_target_seat" ON "identify_campaign_targets"("category", "seat_code");
CREATE INDEX "idx_identify_target_category_status" ON "identify_campaign_targets"("category", "status");
