-- CreateTable
CREATE TABLE "ingestion_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pipeline" VARCHAR(30) NOT NULL,
    "file_path" VARCHAR(1000) NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "source_type" VARCHAR(10) NOT NULL,
    "identity" JSONB NOT NULL DEFAULT '{}',
    "chunks" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'processing',
    "error_msg" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pipeline" VARCHAR(30) NOT NULL,
    "trigger" VARCHAR(20) NOT NULL,
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "processed_files" INTEGER NOT NULL DEFAULT 0,
    "skipped_files" INTEGER NOT NULL DEFAULT 0,
    "error_files" INTEGER NOT NULL DEFAULT 0,
    "total_chunks" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_ingestion_pipeline_filepath" ON "ingestion_records"("pipeline", "file_path");

-- CreateIndex
CREATE INDEX "idx_ingestion_pipeline_status" ON "ingestion_records"("pipeline", "status");

-- CreateIndex
CREATE INDEX "idx_runs_pipeline_started" ON "ingestion_runs"("pipeline", "started_at" DESC);
