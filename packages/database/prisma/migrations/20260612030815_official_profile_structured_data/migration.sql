-- AlterTable
ALTER TABLE "nigerian_officials" ADD COLUMN     "official_type" VARCHAR(20);

-- CreateTable
CREATE TABLE "official_education" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "institution" VARCHAR(255) NOT NULL,
    "institution_type" VARCHAR(20),
    "qualification" VARCHAR(120),
    "field" VARCHAR(150),
    "start_year" INTEGER,
    "end_year" INTEGER,
    "graduated" BOOLEAN,
    "location" VARCHAR(150),
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_careers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "organization" VARCHAR(255) NOT NULL,
    "role" VARCHAR(150),
    "industry" VARCHAR(100),
    "employment_type" VARCHAR(20),
    "start_year" INTEGER,
    "end_year" INTEGER,
    "description" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_party_affiliations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "party_acronym" VARCHAR(20) NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "reason" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_party_affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_committees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "committee_name" VARCHAR(255) NOT NULL,
    "chamber" VARCHAR(30) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "position_id" UUID,
    "term_id" UUID,
    "start_date" DATE,
    "end_date" DATE,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_sponsored_bills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "bill_number" VARCHAR(60),
    "chamber" VARCHAR(30) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'sponsor',
    "status" VARCHAR(30),
    "introduced_date" DATE,
    "status_date" DATE,
    "summary" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_sponsored_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_elections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "election_type" VARCHAR(30) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER NOT NULL,
    "election_date" DATE,
    "party_acronym" VARCHAR(20),
    "state_code" VARCHAR(30),
    "constituency_code" VARCHAR(80),
    "lga_code" VARCHAR(60),
    "ward_code" VARCHAR(100),
    "result" VARCHAR(20) NOT NULL,
    "votes" INTEGER,
    "vote_percentage" DECIMAL(5,2),
    "winner_name" VARCHAR(200),
    "resulted_in_position_id" UUID,
    "notes" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_asset_declarations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "declared_to" VARCHAR(100),
    "amount" DECIMAL(18,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'NGN',
    "summary" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_asset_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_awards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "awarded_by" VARCHAR(255),
    "year" INTEGER,
    "category" VARCHAR(100),
    "description" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_publications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "type" VARCHAR(20),
    "publisher" VARCHAR(255),
    "year" INTEGER,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_family_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "relationship" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200),
    "related_official_id" UUID,
    "is_public_figure" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_legal_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "case_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "forum" VARCHAR(150),
    "case_number" VARCHAR(100),
    "filed_date" DATE,
    "resolved_date" DATE,
    "outcome" TEXT,
    "related_corruption_case_id" UUID,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_legal_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corruption_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "summary" TEXT,
    "case_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "forum" VARCHAR(30),
    "amount_involved" DECIMAL(18,2),
    "amount_recovered" DECIMAL(18,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'NGN',
    "state_code" VARCHAR(30),
    "sector" VARCHAR(50),
    "opened_date" DATE,
    "charge_date" DATE,
    "verdict_date" DATE,
    "outcome" TEXT,
    "sentence" TEXT,
    "is_landmark" BOOLEAN NOT NULL DEFAULT false,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corruption_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corruption_case_parties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "subject_type" VARCHAR(20) NOT NULL,
    "subject_id" UUID,
    "subject_name" VARCHAR(255) NOT NULL,
    "party_type" VARCHAR(20) NOT NULL DEFAULT 'person',
    "role" VARCHAR(30) NOT NULL,
    "outcome" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corruption_case_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corruption_case_updates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "event_date" DATE NOT NULL,
    "event_type" VARCHAR(30) NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corruption_case_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_type" VARCHAR(30) NOT NULL,
    "entry_id" UUID NOT NULL,
    "field" VARCHAR(63),
    "url" TEXT NOT NULL,
    "archive_url" TEXT,
    "publisher" VARCHAR(255) NOT NULL,
    "snippet" TEXT NOT NULL,
    "format" VARCHAR(20) NOT NULL,
    "locator" TEXT,
    "source_tier" VARCHAR(20) NOT NULL,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "retrieved_at" TIMESTAMPTZ NOT NULL,
    "snapshot_key" TEXT,
    "snapshot_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "captured_at" TIMESTAMPTZ,
    "content_hash" VARCHAR(64),
    "byte_size" INTEGER,
    "original_accessible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_education_official" ON "official_education"("official_id");

-- CreateIndex
CREATE INDEX "idx_careers_official" ON "official_careers"("official_id");

-- CreateIndex
CREATE INDEX "idx_party_affiliations_official" ON "official_party_affiliations"("official_id");

-- CreateIndex
CREATE INDEX "idx_committees_official" ON "official_committees"("official_id");

-- CreateIndex
CREATE INDEX "idx_bills_official" ON "official_sponsored_bills"("official_id");

-- CreateIndex
CREATE INDEX "idx_elections_official" ON "official_elections"("official_id");

-- CreateIndex
CREATE INDEX "idx_elections_type_year" ON "official_elections"("election_type", "year");

-- CreateIndex
CREATE INDEX "idx_assets_official" ON "official_asset_declarations"("official_id");

-- CreateIndex
CREATE INDEX "idx_awards_official" ON "official_awards"("official_id");

-- CreateIndex
CREATE INDEX "idx_publications_official" ON "official_publications"("official_id");

-- CreateIndex
CREATE INDEX "idx_family_official" ON "official_family_members"("official_id");

-- CreateIndex
CREATE INDEX "idx_legal_cases_official" ON "official_legal_cases"("official_id");

-- CreateIndex
CREATE UNIQUE INDEX "corruption_cases_slug_key" ON "corruption_cases"("slug");

-- CreateIndex
CREATE INDEX "idx_corruption_cases_status" ON "corruption_cases"("status");

-- CreateIndex
CREATE INDEX "idx_corruption_cases_state" ON "corruption_cases"("state_code");

-- CreateIndex
CREATE INDEX "idx_case_parties_case" ON "corruption_case_parties"("case_id");

-- CreateIndex
CREATE INDEX "idx_case_parties_subject" ON "corruption_case_parties"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "idx_case_updates_case_date" ON "corruption_case_updates"("case_id", "event_date");

-- CreateIndex
CREATE INDEX "idx_evidence_entry" ON "evidence"("entry_type", "entry_id");

-- CreateIndex
CREATE INDEX "idx_evidence_entry_id" ON "evidence"("entry_id");

-- AddForeignKey
ALTER TABLE "official_education" ADD CONSTRAINT "official_education_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_careers" ADD CONSTRAINT "official_careers_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_party_affiliations" ADD CONSTRAINT "official_party_affiliations_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_party_affiliations" ADD CONSTRAINT "official_party_affiliations_party_acronym_fkey" FOREIGN KEY ("party_acronym") REFERENCES "political_parties"("acronym") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_committees" ADD CONSTRAINT "official_committees_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_committees" ADD CONSTRAINT "official_committees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "official_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_committees" ADD CONSTRAINT "official_committees_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "political_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_sponsored_bills" ADD CONSTRAINT "official_sponsored_bills_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_party_acronym_fkey" FOREIGN KEY ("party_acronym") REFERENCES "political_parties"("acronym") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_constituency_code_fkey" FOREIGN KEY ("constituency_code") REFERENCES "nigerian_constituencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_ward_code_fkey" FOREIGN KEY ("ward_code") REFERENCES "nigerian_wards"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_resulted_in_position_id_fkey" FOREIGN KEY ("resulted_in_position_id") REFERENCES "official_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_asset_declarations" ADD CONSTRAINT "official_asset_declarations_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_awards" ADD CONSTRAINT "official_awards_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_publications" ADD CONSTRAINT "official_publications_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_family_members" ADD CONSTRAINT "official_family_members_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_family_members" ADD CONSTRAINT "official_family_members_related_official_id_fkey" FOREIGN KEY ("related_official_id") REFERENCES "nigerian_officials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_legal_cases" ADD CONSTRAINT "official_legal_cases_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_legal_cases" ADD CONSTRAINT "official_legal_cases_related_corruption_case_id_fkey" FOREIGN KEY ("related_corruption_case_id") REFERENCES "corruption_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corruption_cases" ADD CONSTRAINT "corruption_cases_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corruption_case_parties" ADD CONSTRAINT "corruption_case_parties_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "corruption_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corruption_case_updates" ADD CONSTRAINT "corruption_case_updates_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "corruption_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Plan 45 appendix: CHECK constraints, enrichment grants, backfill
-- (hand-authored — prisma migrate diff does not emit these)
-- ============================================================

-- officialType classifier on the person record
ALTER TABLE "nigerian_officials"
  ADD CONSTRAINT "chk_official_type" CHECK ("official_type" IS NULL OR "official_type" IN
    ('elected', 'appointed', 'civil_servant', 'judicial', 'security', 'traditional', 'other'));

-- Shared provenance enums (every Plan-45 table)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'official_education', 'official_careers', 'official_party_affiliations',
    'official_committees', 'official_sponsored_bills', 'official_elections',
    'official_asset_declarations', 'official_awards', 'official_publications',
    'official_family_members', 'official_legal_cases',
    'corruption_cases', 'corruption_case_parties', 'corruption_case_updates'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (confidence IN (''high'', ''medium'', ''low''))', t, 'chk_' || t || '_confidence');
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (review_status IN (''unreviewed'', ''reviewed'', ''disputed''))', t, 'chk_' || t || '_review_status');
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (source_type IN (''manual'', ''agent'', ''citizen'', ''import''))', t, 'chk_' || t || '_source_type');
  END LOOP;
END $$;

-- Per-table domain enums
ALTER TABLE "official_education"
  ADD CONSTRAINT "chk_education_institution_type" CHECK ("institution_type" IS NULL OR "institution_type" IN
    ('primary', 'secondary', 'university', 'polytechnic', 'professional'));

ALTER TABLE "official_careers"
  ADD CONSTRAINT "chk_careers_employment_type" CHECK ("employment_type" IS NULL OR "employment_type" IN
    ('employee', 'founder', 'owner', 'partner', 'consultant'));

ALTER TABLE "official_committees"
  ADD CONSTRAINT "chk_committees_chamber" CHECK ("chamber" IN ('senate', 'house', 'state_assembly')),
  ADD CONSTRAINT "chk_committees_role" CHECK ("role" IN ('chair', 'deputy', 'member'));

ALTER TABLE "official_sponsored_bills"
  ADD CONSTRAINT "chk_bills_chamber" CHECK ("chamber" IN ('senate', 'house', 'state_assembly')),
  ADD CONSTRAINT "chk_bills_role" CHECK ("role" IN ('sponsor', 'co_sponsor'));

ALTER TABLE "official_elections"
  ADD CONSTRAINT "chk_elections_type" CHECK ("election_type" IN
    ('presidential', 'gubernatorial', 'senatorial', 'house_of_reps', 'state_assembly', 'lga_chairman', 'councilor', 'other')),
  ADD CONSTRAINT "chk_elections_result" CHECK ("result" IN
    ('won', 'lost', 'withdrawn', 'disqualified', 'annulled', 'runoff', 'pending'));

ALTER TABLE "official_legal_cases"
  ADD CONSTRAINT "chk_legal_case_type" CHECK ("case_type" IN
    ('criminal', 'civil', 'electoral', 'tribunal', 'investigation')),
  ADD CONSTRAINT "chk_legal_status" CHECK ("status" IN
    ('alleged', 'under_investigation', 'charged', 'on_trial', 'convicted', 'acquitted', 'dismissed', 'settled'));

ALTER TABLE "corruption_cases"
  ADD CONSTRAINT "chk_corruption_case_type" CHECK ("case_type" IN
    ('fraud', 'embezzlement', 'bribery', 'money_laundering', 'abuse_of_office', 'procurement_fraud', 'diversion', 'other')),
  ADD CONSTRAINT "chk_corruption_status" CHECK ("status" IN
    ('alleged', 'under_investigation', 'charged', 'on_trial', 'convicted', 'acquitted', 'dismissed', 'settled', 'appeal'));

ALTER TABLE "corruption_case_parties"
  ADD CONSTRAINT "chk_party_subject_type" CHECK ("subject_type" IN ('official', 'person', 'company', 'agency', 'mda')),
  ADD CONSTRAINT "chk_party_party_type" CHECK ("party_type" IN ('person', 'company', 'agency', 'mda')),
  ADD CONSTRAINT "chk_party_role" CHECK ("role" IN
    ('accused', 'defendant', 'co_defendant', 'convicted', 'witness', 'whistleblower', 'prosecutor', 'complainant'));

ALTER TABLE "evidence"
  ADD CONSTRAINT "chk_evidence_entry_type" CHECK ("entry_type" IN
    ('official_field', 'education', 'career', 'position', 'election', 'party_affiliation',
     'committee', 'bill', 'asset', 'award', 'publication', 'family', 'legal_case',
     'corruption_case', 'corruption_case_party', 'corruption_case_update')),
  ADD CONSTRAINT "chk_evidence_source_tier" CHECK ("source_tier" IN ('canonical', 'official', 'web')),
  ADD CONSTRAINT "chk_evidence_confidence" CHECK ("confidence" IN ('high', 'medium', 'low')),
  ADD CONSTRAINT "chk_evidence_snapshot_status" CHECK ("snapshot_status" IN ('pending', 'captured', 'failed'));

-- ============================================================
-- Enrichment grants (Fix #2): enrichment_apply writes the new tables via
-- the apply service (SET LOCAL ROLE). Default privileges only auto-grant
-- SELECT to enrichment_agent; INSERT/UPDATE must be explicit.
-- enrichment_agent keeps INSERT on change_proposals/proposal_sources ONLY.
-- ============================================================
GRANT INSERT, UPDATE ON TABLE
  official_education, official_careers, official_party_affiliations,
  official_committees, official_sponsored_bills, official_elections,
  official_asset_declarations, official_awards, official_publications,
  official_family_members, official_legal_cases,
  corruption_cases, corruption_case_parties, corruption_case_updates,
  evidence
TO enrichment_apply;

-- ============================================================
-- Backfill: every existing official is an elected politician today.
-- ============================================================
UPDATE "nigerian_officials" SET "official_type" = 'elected' WHERE "official_type" IS NULL;
