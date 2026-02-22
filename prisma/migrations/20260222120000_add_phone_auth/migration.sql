-- Clean break: delete all anonymous users (cascades to conversations, messages, etc.)
TRUNCATE TABLE "users" CASCADE;

-- AddColumn: non-nullable phone_number on users
ALTER TABLE "users" ADD COLUMN "phone_number" VARCHAR(20) NOT NULL;

-- CreateIndex: unique constraint on phone_number
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateTable: OTP verifications
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" VARCHAR(20) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: composite index for active OTP lookups
CREATE INDEX "idx_otp_phone_active" ON "otp_verifications"("phone_number", "verified", "expires_at");
