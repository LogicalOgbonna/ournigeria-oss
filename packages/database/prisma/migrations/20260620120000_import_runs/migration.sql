-- Audit log of curated bulk-import runs.
CREATE TABLE "import_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dataset" VARCHAR(63) NOT NULL,
    "admin_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_import_runs_dataset" ON "import_runs"("dataset", "started_at");
