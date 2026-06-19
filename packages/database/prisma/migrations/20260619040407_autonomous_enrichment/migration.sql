-- CreateTable
CREATE TABLE "enrichment_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "proposal_count" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "last_attempted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_eligible_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment_budget" (
    "day" DATE NOT NULL,
    "invocations" INTEGER NOT NULL DEFAULT 0,
    "est_cost_usd" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_budget_pkey" PRIMARY KEY ("day")
);

CREATE INDEX "idx_enrichment_attempts_status_eligible" ON "enrichment_attempts"("status", "next_eligible_at");

CREATE UNIQUE INDEX "uq_enrichment_attempt_official_category" ON "enrichment_attempts"("official_id", "category");

ALTER TABLE "enrichment_attempts" ADD CONSTRAINT "enrichment_attempts_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Sweeper operational-table grants. enrichment_agent already has
-- SELECT on all tables + INSERT on the proposal tables; widen it to
-- read/write ONLY these two operational tables — never live domain data.
-- ============================================================
GRANT INSERT, UPDATE ON TABLE enrichment_attempts, enrichment_budget TO enrichment_agent;

-- CHECK constraint for the attempt status enum
ALTER TABLE "enrichment_attempts"
  ADD CONSTRAINT "chk_enrichment_attempt_status"
  CHECK ("status" IN ('pending', 'filled', 'nothing_found', 'error'));
