-- CreateTable
CREATE TABLE "socials_telegram_poll_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "update_offset" BIGINT NOT NULL DEFAULT 0,
    "leader_host" VARCHAR(120),
    "leader_pid" INTEGER,
    "lease_until" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socials_telegram_poll_state_pkey" PRIMARY KEY ("id")
);
