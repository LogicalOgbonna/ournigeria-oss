-- CreateTable
CREATE TABLE "graph_extraction_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "domain" VARCHAR(20) NOT NULL,
    "pass" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "last_chunk_id" TEXT,
    "chunks_total" INTEGER NOT NULL DEFAULT 0,
    "chunks_processed" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "error_log" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graph_extraction_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_graph_jobs_domain_pass_status" ON "graph_extraction_jobs"("domain", "pass", "status");
