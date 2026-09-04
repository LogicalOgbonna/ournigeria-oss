-- CreateTable
CREATE TABLE "socials_scouted_handle" (
    "id" UUID NOT NULL,
    "rest_id" VARCHAR(100) NOT NULL,
    "handle" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "bio" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "profile_image_url" TEXT,
    "state_code" VARCHAR(30) NOT NULL,
    "lga_code" VARCHAR(60),
    "ward_code" VARCHAR(100),
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT NOT NULL,
    "source_tweet_id" VARCHAR(100),
    "source_tweet_text" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "times_tagged" INTEGER NOT NULL DEFAULT 0,
    "last_tagged_at" TIMESTAMPTZ,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socials_scouted_handle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socials_scout_state" (
    "state_code" VARCHAR(30) NOT NULL,
    "last_run_at" TIMESTAMPTZ,
    "handles_found" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "socials_scout_state_pkey" PRIMARY KEY ("state_code")
);

-- CreateTable
CREATE TABLE "socials_scout_run" (
    "id" UUID NOT NULL,
    "window_date" DATE NOT NULL,
    "window_hour" INTEGER NOT NULL,
    "state_code" VARCHAR(30),
    "claimed_by_pid" INTEGER NOT NULL,
    "claimed_by_host" VARCHAR(200) NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    "stop_reason" VARCHAR(50),
    "tweets_scanned" INTEGER NOT NULL DEFAULT 0,
    "authors_seen" INTEGER NOT NULL DEFAULT 0,
    "classified" INTEGER NOT NULL DEFAULT 0,
    "stored" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "socials_scout_run_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "socials_scouted_handle_rest_id_key" ON "socials_scouted_handle"("rest_id");

-- CreateIndex
CREATE INDEX "idx_socials_scouted_handle_state_status" ON "socials_scouted_handle"("state_code", "status");

-- CreateIndex
CREATE INDEX "idx_socials_scouted_handle_lga" ON "socials_scouted_handle"("lga_code");

-- CreateIndex
CREATE INDEX "idx_socials_scout_run_started_at" ON "socials_scout_run"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_socials_scout_run_window" ON "socials_scout_run"("window_date", "window_hour");

