-- Plan 36 Phase 0: Admin Hierarchy Schema Foundations
-- + Drop budget_summaries (superseded by fiscal data models)
-- + Add NigerianWard, SenatorialDistrictLga, ConstituencyWard (Phases 2/3 schema)
-- + Add pcode to nigerian_constituencies
-- + PoliticalTerm, PoliticalParty tables
-- + Refactor official_positions: exclusive arcs, provenance, party normalization

-- ============================================================
-- 0. Drop budget_summaries (superseded by BudgetLineItem + BudgetMetadata)
-- ============================================================

DROP TABLE IF EXISTS "budget_summaries" CASCADE;

-- ============================================================
-- 1. Create political_parties table
-- ============================================================

CREATE TABLE "political_parties" (
  "acronym" VARCHAR(20) PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- Seed canonical parties
INSERT INTO "political_parties" ("acronym", "name", "is_active") VALUES
  ('APC', 'All Progressives Congress', true),
  ('PDP', 'Peoples Democratic Party', true),
  ('LP', 'Labour Party', true),
  ('NNPP', 'New Nigeria Peoples Party', true),
  ('APGA', 'All Progressives Grand Alliance', true),
  ('YPP', 'Young Progressives Party', true),
  ('SDP', 'Social Democratic Party', true)
ON CONFLICT ("acronym") DO NOTHING;

-- ============================================================
-- 2. Create political_terms table
-- ============================================================

CREATE TABLE "political_terms" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "term_number" INT,
  "level" VARCHAR(10) NOT NULL,
  "kind" VARCHAR(20) NOT NULL,
  "state_code" VARCHAR(30) REFERENCES "nigerian_states"("code"),
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  CONSTRAINT "uq_term_level_kind_state_number" UNIQUE ("level", "kind", "state_code", "term_number"),
  CONSTRAINT "chk_term_level" CHECK ("level" IN ('federal', 'state')),
  CONSTRAINT "chk_term_kind" CHECK ("kind" IN ('national_assembly', 'governorship', 'state_assembly', 'lga_election_cycle', 'administration')),
  CONSTRAINT "chk_term_scope" CHECK (
    ("level" = 'federal' AND "state_code" IS NULL) OR
    ("level" = 'state' AND "state_code" IS NOT NULL)
  )
);

-- Seed current federal term (10th National Assembly)
INSERT INTO "political_terms" ("name", "term_number", "level", "kind", "state_code", "start_date")
VALUES ('10th National Assembly', 10, 'federal', 'national_assembly', NULL, '2023-06-13');

-- Seed current state assembly terms (all 36 states, not FCT)
INSERT INTO "political_terms" ("name", "term_number", "level", "kind", "state_code", "start_date")
SELECT '10th ' || s.name || ' State Assembly', 10, 'state', 'state_assembly', s.code, '2023-05-29'
FROM "nigerian_states" s
WHERE s.code != 'fct';

-- Seed current governorship terms (all 36 states, not FCT)
INSERT INTO "political_terms" ("name", "term_number", "level", "kind", "state_code", "start_date")
SELECT s.name || ' Governorship Cycle 2023-2027', NULL, 'state', 'governorship', s.code, '2023-05-29'
FROM "nigerian_states" s
WHERE s.code != 'fct';

-- FCT Administration term
INSERT INTO "political_terms" ("name", "term_number", "level", "kind", "state_code", "start_date")
VALUES ('FCT Administration 2023-2027', NULL, 'state', 'administration', 'fct', '2023-05-29');

-- ============================================================
-- 3. Add new columns to official_positions
-- ============================================================

ALTER TABLE "official_positions"
  ADD COLUMN "term_id" UUID,
  ADD COLUMN "party_acronym" VARCHAR(20),
  ADD COLUMN "appointment_type" VARCHAR(20) NOT NULL DEFAULT 'elected',
  ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN "end_reason" VARCHAR(30),
  ADD COLUMN "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN "source_url" TEXT,
  ADD COLUMN "source_date" DATE,
  ADD COLUMN "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
  ADD COLUMN "last_verified_at" TIMESTAMPTZ,
  ADD COLUMN "reviewed_by" VARCHAR(100),
  ADD COLUMN "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
  ADD COLUMN "state_code" VARCHAR(30),
  ADD COLUMN "constituency_code" VARCHAR(80),
  ADD COLUMN "lga_code" VARCHAR(60),
  ADD COLUMN "ward_code" VARCHAR(80);

-- ============================================================
-- 4. Normalize party values via alias table
-- ============================================================

CREATE TABLE "party_aliases" (
  "alias" VARCHAR(100) PRIMARY KEY,
  "party_acronym" VARCHAR(20) NOT NULL REFERENCES "political_parties"("acronym")
);

INSERT INTO "party_aliases" ("alias", "party_acronym") VALUES
  ('APC', 'APC'),
  ('A.P.C', 'APC'),
  ('ALL PROGRESSIVES CONGRESS', 'APC'),
  ('PDP', 'PDP'),
  ('P.D.P', 'PDP'),
  ('PEOPLES DEMOCRATIC PARTY', 'PDP'),
  ('LP', 'LP'),
  ('LABOUR PARTY', 'LP'),
  ('NNPP', 'NNPP'),
  ('NEW NIGERIA PEOPLES PARTY', 'NNPP'),
  ('APGA', 'APGA'),
  ('ALL PROGRESSIVES GRAND ALLIANCE', 'APGA'),
  ('YPP', 'YPP'),
  ('YOUNG PROGRESSIVES PARTY', 'YPP'),
  ('SDP', 'SDP'),
  ('SOCIAL DEMOCRATIC PARTY', 'SDP')
ON CONFLICT ("alias") DO NOTHING;

-- Migrate party from nigerian_officials to official_positions.party_acronym
UPDATE "official_positions" op
SET "party_acronym" = pa."party_acronym"
FROM "nigerian_officials" o
JOIN "party_aliases" pa ON pa."alias" = UPPER(TRIM(o."party"))
WHERE op."official_id" = o."id"
  AND o."party" IS NOT NULL;

-- Capture any unmapped parties for review
CREATE TABLE "unmapped_position_parties" AS
SELECT op."id" AS position_id, o."party" AS raw_party
FROM "official_positions" op
JOIN "nigerian_officials" o ON o."id" = op."official_id"
WHERE o."party" IS NOT NULL
  AND op."party_acronym" IS NULL;

-- Add party FK
ALTER TABLE "official_positions"
  ADD CONSTRAINT "fk_positions_party" FOREIGN KEY ("party_acronym") REFERENCES "political_parties"("acronym");

-- ============================================================
-- 4b. Normalize role values before term assignment
-- ============================================================
UPDATE "official_positions" SET "role" = 'rep' WHERE "role" = 'representative';

-- ============================================================
-- 5. Assign existing positions to their terms
-- ============================================================

-- All current senators and reps → 10th National Assembly
UPDATE "official_positions" op
SET "term_id" = pt."id"
FROM "political_terms" pt
WHERE pt."level" = 'federal' AND pt."kind" = 'national_assembly' AND pt."term_number" = 10
  AND op."jurisdiction_type" = 'constituency'
  AND op."role" IN ('senator', 'rep');

-- All current governors → their state's governorship term (or FCT administration term)
UPDATE "official_positions" op
SET "term_id" = pt."id"
FROM "political_terms" pt
WHERE pt."level" = 'state' AND pt."state_code" = op."jurisdiction_code"
  AND pt."kind" IN ('governorship', 'administration')
  AND op."jurisdiction_type" = 'state'
  AND op."role" = 'governor';

-- Add term FK
ALTER TABLE "official_positions"
  ADD CONSTRAINT "fk_positions_term" FOREIGN KEY ("term_id") REFERENCES "political_terms"("id");

-- ============================================================
-- 6. Migrate jurisdiction_type/code to exclusive arc columns
-- ============================================================

UPDATE "official_positions"
SET "state_code" = "jurisdiction_code"
WHERE "jurisdiction_type" = 'state';

UPDATE "official_positions"
SET "constituency_code" = "jurisdiction_code"
WHERE "jurisdiction_type" = 'constituency';

UPDATE "official_positions"
SET "lga_code" = "jurisdiction_code"
WHERE "jurisdiction_type" = 'lga';

UPDATE "official_positions"
SET "ward_code" = "jurisdiction_code"
WHERE "jurisdiction_type" = 'ward';

-- Add FK constraints for exclusive arc columns
-- NOTE: constituency FK is DEFERRED to Phase 4 (constituency audit) because
-- the seed_legislators migration used abbreviated codes that don't match
-- nigerian_constituencies.code. Phase 4 reconciles the codes and adds the FK.
ALTER TABLE "official_positions"
  ADD CONSTRAINT "fk_positions_state" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code"),
  ADD CONSTRAINT "fk_positions_lga" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code");
  -- constituency FK deferred to Phase 4 (constituency code reconciliation)
  -- ward FK deferred to after nigerian_wards table creation (below)

-- ============================================================
-- 7. Add CHECK constraints
-- ============================================================

-- Exclusive jurisdiction: exactly one non-null
ALTER TABLE "official_positions"
  ADD CONSTRAINT "chk_exclusive_jurisdiction" CHECK (
    (("state_code" IS NOT NULL)::int +
     ("constituency_code" IS NOT NULL)::int +
     ("lga_code" IS NOT NULL)::int +
     ("ward_code" IS NOT NULL)::int) = 1
  );

ALTER TABLE "official_positions"
  ADD CONSTRAINT "chk_appointment_type" CHECK (
    "appointment_type" IN ('elected', 'appointed', 'caretaker', 'acting')
  ),
  ADD CONSTRAINT "chk_status" CHECK (
    "status" IN ('active', 'contested', 'suspended')
  ),
  ADD CONSTRAINT "chk_end_reason" CHECK (
    "end_reason" IS NULL OR "end_reason" IN (
      'term_end', 'impeached', 'resigned', 'deceased', 'tribunal_sacked', 'dissolved'
    )
  ),
  ADD CONSTRAINT "chk_role" CHECK (
    "role" IN ('governor', 'deputy_governor', 'senator', 'rep', 'mha', 'chairman', 'vice_chairman', 'councilor')
  ),
  ADD CONSTRAINT "chk_confidence" CHECK ("confidence" IN ('high', 'medium', 'low')),
  ADD CONSTRAINT "chk_review_status" CHECK ("review_status" IN ('unreviewed', 'reviewed', 'disputed')),
  ADD CONSTRAINT "chk_source_type" CHECK ("source_type" IN ('election_result', 'official_site', 'news', 'manual')),
  ADD CONSTRAINT "chk_role_scope" CHECK (
    ("role" IN ('governor', 'deputy_governor') AND "state_code" IS NOT NULL AND "constituency_code" IS NULL AND "lga_code" IS NULL AND "ward_code" IS NULL) OR
    ("role" IN ('senator', 'rep', 'mha') AND "constituency_code" IS NOT NULL AND "state_code" IS NULL AND "lga_code" IS NULL AND "ward_code" IS NULL) OR
    ("role" IN ('chairman', 'vice_chairman') AND "lga_code" IS NOT NULL AND "state_code" IS NULL AND "constituency_code" IS NULL AND "ward_code" IS NULL) OR
    ("role" = 'councilor' AND "ward_code" IS NOT NULL AND "state_code" IS NULL AND "constituency_code" IS NULL AND "lga_code" IS NULL)
  );

-- ============================================================
-- 8. Drop old columns and indexes
-- ============================================================

DROP INDEX IF EXISTS "idx_positions_jurisdiction_current";
DROP INDEX IF EXISTS "uq_current_official_per_role";

ALTER TABLE "official_positions"
  DROP COLUMN "jurisdiction_type",
  DROP COLUMN "jurisdiction_code",
  DROP COLUMN "is_current";

ALTER TABLE "nigerian_officials" DROP COLUMN "party";

-- ============================================================
-- 9. Create new indexes
-- ============================================================

CREATE INDEX "idx_positions_term" ON "official_positions" ("term_id");
CREATE INDEX "idx_positions_state_status" ON "official_positions" ("state_code", "status");
CREATE INDEX "idx_positions_constituency_status" ON "official_positions" ("constituency_code", "status");
CREATE INDEX "idx_positions_lga_status" ON "official_positions" ("lga_code", "status");
CREATE INDEX "idx_positions_ward_status" ON "official_positions" ("ward_code", "status");

-- ============================================================
-- 10. Create convenience views
-- ============================================================

CREATE VIEW "current_positions" AS
SELECT *
FROM "official_positions"
WHERE "status" = 'active'
  AND "start_date" <= CURRENT_DATE
  AND ("end_date" IS NULL OR "end_date" > CURRENT_DATE);

CREATE VIEW "preferred_current_positions" AS
SELECT DISTINCT ON (
  "role",
  COALESCE("state_code", ''),
  COALESCE("constituency_code", ''),
  COALESCE("lga_code", ''),
  COALESCE("ward_code", '')
)
  *
FROM "current_positions"
ORDER BY
  "role",
  COALESCE("state_code", ''),
  COALESCE("constituency_code", ''),
  COALESCE("lga_code", ''),
  COALESCE("ward_code", ''),
  CASE "review_status" WHEN 'reviewed' THEN 0 WHEN 'unreviewed' THEN 1 ELSE 2 END,
  CASE "confidence" WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
  COALESCE("source_date", DATE '1900-01-01') DESC,
  "created_at" DESC;

-- ============================================================
-- 11. Add pcode to nigerian_constituencies
-- ============================================================

ALTER TABLE "nigerian_constituencies"
  ADD COLUMN "pcode" VARCHAR(20);

-- ============================================================
-- 12. Create nigerian_wards table (Phase 3 schema)
-- ============================================================

CREATE TABLE "nigerian_wards" (
  "code" VARCHAR(80) PRIMARY KEY,
  "name" VARCHAR(150) NOT NULL,
  "lga_code" VARCHAR(60) NOT NULL REFERENCES "nigerian_lgas"("code"),
  "pcode" VARCHAR(20)
);

CREATE INDEX "idx_wards_lga" ON "nigerian_wards" ("lga_code");

-- Deferred ward FK from official_positions (now that nigerian_wards exists)
ALTER TABLE "official_positions"
  ADD CONSTRAINT "fk_positions_ward" FOREIGN KEY ("ward_code") REFERENCES "nigerian_wards"("code");

-- ============================================================
-- 13. Create mapping tables (Phase 2A/2B schema)
-- ============================================================

CREATE TABLE "senatorial_district_lgas" (
  "senatorial_district_code" VARCHAR(80) NOT NULL REFERENCES "nigerian_constituencies"("code"),
  "lga_code" VARCHAR(60) NOT NULL REFERENCES "nigerian_lgas"("code"),
  "source" VARCHAR(30) NOT NULL,
  CONSTRAINT "senatorial_district_lgas_pkey" PRIMARY KEY ("senatorial_district_code", "lga_code")
);

CREATE INDEX "idx_senatorial_lga_lga" ON "senatorial_district_lgas" ("lga_code");

CREATE TABLE "constituency_wards" (
  "constituency_code" VARCHAR(80) NOT NULL REFERENCES "nigerian_constituencies"("code"),
  "ward_code" VARCHAR(80) NOT NULL REFERENCES "nigerian_wards"("code"),
  "source" VARCHAR(30) NOT NULL,
  CONSTRAINT "constituency_wards_pkey" PRIMARY KEY ("constituency_code", "ward_code")
);

CREATE INDEX "idx_constituency_ward_ward" ON "constituency_wards" ("ward_code");

-- ============================================================
-- 14. Cleanup: drop temporary alias table (keep unmapped for review)
-- ============================================================

DROP TABLE IF EXISTS "party_aliases";
