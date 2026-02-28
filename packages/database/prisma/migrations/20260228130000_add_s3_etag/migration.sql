-- Add S3 ETag column for deduplication without downloading
ALTER TABLE "ingestion_records" ADD COLUMN "s3_etag" VARCHAR(128);

-- Index for fast ETag lookups per pipeline
CREATE INDEX "idx_ingestion_pipeline_etag" ON "ingestion_records"("pipeline", "s3_etag");
