-- Campaign dashboard sub-plan 1: draft status + review gate columns, the
-- race-key unique becomes partial over PUBLIC rows, and the 19 seeded
-- presidential tickets are marked reviewed so the new visibility rule
-- (status public AND review_status = 'reviewed') does not blank the site.

ALTER TABLE "campaigns" DROP CONSTRAINT "chk_campaigns_status";
ALTER TABLE "campaigns" ADD CONSTRAINT "chk_campaigns_status" CHECK ("status" IN
  ('draft', 'active', 'suspended', 'withdrawn', 'dissolved', 'concluded'));

ALTER TABLE "campaigns" ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "campaigns"
  ADD COLUMN "review_requested_at" TIMESTAMPTZ,
  ADD COLUMN "review_requested_by" VARCHAR(100),
  ADD COLUMN "review_note" TEXT;

-- Partial: uniqueness only matters among rows the public can see.
DROP INDEX "uq_campaigns_race_party_faction";
CREATE UNIQUE INDEX "uq_campaigns_race_party_faction" ON "campaigns"
  ("election_type", "year", "state_code", "constituency_code", "lga_code", "party_acronym", "faction_label")
  NULLS NOT DISTINCT
  WHERE "status" IN ('active', 'concluded');

-- Backfill: everything live today was seeded from the human-verified dataset.
UPDATE "campaigns"
SET "review_status" = 'reviewed',
    "reviewed_by" = COALESCE("reviewed_by", 'seed-campaigns'),
    "last_verified_at" = COALESCE("last_verified_at", now())
WHERE "status" = 'active' AND "review_status" = 'unreviewed';

CREATE INDEX "idx_campaigns_review_queue" ON "campaigns" ("review_status", "review_requested_at")
  WHERE "review_status" <> 'reviewed';
