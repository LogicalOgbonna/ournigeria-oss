-- Add status column to ingestion_runs table
ALTER TABLE "ingestion_runs" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'running';

-- Backfill existing rows based on current data
UPDATE "ingestion_runs"
SET "status" = CASE
  WHEN "error_msg" IS NOT NULL AND "completed_at" IS NOT NULL THEN 'failed'
  WHEN "completed_at" IS NOT NULL THEN 'completed'
  ELSE 'running'
END
WHERE "status" = 'running' AND "completed_at" IS NOT NULL;
