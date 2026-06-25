-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'RELATIONAL');

-- CreateTable
CREATE TABLE "backup_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "type" "BackupType" NOT NULL,
    "s3_bucket" VARCHAR(255),
    "s3_key" VARCHAR(512),
    "size_bytes" BIGINT,
    "error" TEXT,
    "created_by_admin_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "finished_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "backup_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backup_jobs_status_idx" ON "backup_jobs"("status");

-- CreateIndex
CREATE INDEX "backup_jobs_created_at_idx" ON "backup_jobs"("created_at");
