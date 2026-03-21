-- CreateEnum
CREATE TYPE "donation_provider" AS ENUM ('PAYSTACK', 'FLUTTERWAVE');

-- CreateEnum
CREATE TYPE "donation_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN',
    "email" VARCHAR(255) NOT NULL,
    "donor_name" VARCHAR(200),
    "provider" "donation_provider" NOT NULL,
    "status" "donation_status" NOT NULL DEFAULT 'PENDING',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "subscription_code" VARCHAR(200),
    "provider_ref" VARCHAR(200),
    "user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donations_reference_key" ON "donations"("reference");

-- CreateIndex
CREATE INDEX "idx_donations_status_date" ON "donations"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_donations_user_date" ON "donations"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_donations_provider_status" ON "donations"("provider", "status");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
