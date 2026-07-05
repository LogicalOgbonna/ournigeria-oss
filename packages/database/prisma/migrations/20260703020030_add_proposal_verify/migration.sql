-- CreateTable
CREATE TABLE "proposal_verify_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anchor_type" VARCHAR(20) NOT NULL,
    "anchor_id" VARCHAR(100) NOT NULL,
    "proposal_id" UUID NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "social_post_id" UUID,
    "tweet_id" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_verify_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_proposal_verify_status" ON "proposal_verify_posts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_proposal_verify_anchor" ON "proposal_verify_posts"("anchor_type", "anchor_id");
