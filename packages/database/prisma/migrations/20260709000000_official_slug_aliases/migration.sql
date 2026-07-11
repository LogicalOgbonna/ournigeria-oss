-- Old slugs an official has been known by. On a name *correction* the canonical
-- slug (nigerian_officials.slug) is regenerated from the new name and the previous
-- slug is recorded here so /officials/<old-slug> 308-redirects to the current one.
-- A slug is never simultaneously a live canonical slug and an alias (enforced in
-- application code: the reslug helper drops any alias equal to the new canonical
-- slug and skips recording an old slug that is still in use).

-- CreateTable
CREATE TABLE "official_slug_aliases" (
    "slug" VARCHAR(160) NOT NULL,
    "official_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_slug_aliases_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE INDEX "idx_slug_alias_official" ON "official_slug_aliases"("official_id");

-- AddForeignKey
ALTER TABLE "official_slug_aliases" ADD CONSTRAINT "official_slug_aliases_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant enrichment_apply write access so the agent ChangeProposal apply path can
-- record an old slug when it corrects nigerian_officials.name. Mirrors the grant
-- style in 20260602030000_enrichment_roles / 20260619002500_party_enrichment_apply_grants.
-- (enrichment_apply already holds table-level UPDATE on nigerian_officials, which
-- covers the slug column, so no new grant is needed there.)
-- SELECT+INSERT to record an old slug, UPDATE for the upsert's on-conflict repoint,
-- DELETE to drop a stale alias that collides with a new canonical slug.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "official_slug_aliases" TO enrichment_apply;
