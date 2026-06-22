-- CreateTable
CREATE TABLE "telegram_login_requests" (
    "id" UUID NOT NULL,
    "start_param" VARCHAR(64) NOT NULL,
    "poll_key" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "intent" VARCHAR(10) NOT NULL DEFAULT 'login',
    "telegram_id" VARCHAR(20),
    "user_id" UUID,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_login_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_login_requests_start_param_key" ON "telegram_login_requests"("start_param");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_login_requests_poll_key_key" ON "telegram_login_requests"("poll_key");

-- CreateIndex
CREATE INDEX "telegram_login_requests_expires_at_idx" ON "telegram_login_requests"("expires_at");
