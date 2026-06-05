-- CreateTable
CREATE TABLE "change_proposals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "target_table" VARCHAR(63) NOT NULL,
    "target_pk" VARCHAR(255) NOT NULL,
    "target_field" VARCHAR(63) NOT NULL,
    "current_value" JSONB,
    "proposed_value" JSONB NOT NULL,
    "change_kind" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "reasoning" TEXT,
    "agent_run_id" UUID,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "review_note" TEXT,
    "applied_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proposal_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "archive_url" TEXT,
    "publisher" VARCHAR(255) NOT NULL,
    "snippet" TEXT NOT NULL,
    "format" VARCHAR(20) NOT NULL,
    "locator" TEXT,
    "source_tier" VARCHAR(20) NOT NULL,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "retrieved_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_change_proposals_status_date" ON "change_proposals"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_change_proposals_target" ON "change_proposals"("target_table", "target_pk");

-- CreateIndex
CREATE INDEX "idx_change_proposals_run" ON "change_proposals"("agent_run_id");

-- CreateIndex
CREATE INDEX "idx_proposal_sources_proposal" ON "proposal_sources"("proposal_id");

-- AddForeignKey
ALTER TABLE "proposal_sources" ADD CONSTRAINT "proposal_sources_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "change_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
