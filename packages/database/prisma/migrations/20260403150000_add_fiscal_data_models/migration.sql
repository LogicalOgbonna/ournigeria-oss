-- Plan 37: Fiscal Data Models
-- Creates all fiscal data tables, enums, constraints, triggers, and views.
-- Also: SocialPost table, Document.entity_code addition, Document.state_code nullable.

-- ============================================================
-- 1. Create enums
-- ============================================================

CREATE TYPE "fiscal_entity_type" AS ENUM ('federal', 'state', 'lga');
CREATE TYPE "budget_type" AS ENUM ('recurrent_revenue', 'recurrent_expenditure', 'capital_expenditure', 'capital_receipt');
CREATE TYPE "debt_type" AS ENUM ('domestic', 'external');

-- ============================================================
-- 2. FederalGovernment (1 row — federal profile attributes)
-- ============================================================

CREATE TABLE "federal_government" (
  "code" VARCHAR(10) PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "capital" VARCHAR(50) NOT NULL,
  "president_name" VARCHAR(200),
  "vice_president_name" VARCHAR(200),
  "senate_president_name" VARCHAR(200),
  "speaker_name" VARCHAR(200),
  "sgf_name" VARCHAR(200),
  "chief_justice_name" VARCHAR(200),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single federal row
INSERT INTO "federal_government" ("code", "name", "capital", "president_name", "vice_president_name", "senate_president_name", "speaker_name")
VALUES ('federal', 'Federal Republic of Nigeria', 'Abuja', 'Bola Ahmed Tinubu', 'Kashim Shettima', 'Godswill Akpabio', 'Tajudeen Abbas');

-- ============================================================
-- 3. FiscalEntity (812 rows: 1 federal + 37 states + 774 LGAs)
-- ============================================================

CREATE TABLE "fiscal_entities" (
  "code" VARCHAR(60) PRIMARY KEY,
  "name" VARCHAR(200) NOT NULL,
  "entity_type" "fiscal_entity_type" NOT NULL,
  "federal_code" VARCHAR(10) UNIQUE,
  "state_code" VARCHAR(30) UNIQUE,
  "lga_code" VARCHAR(60) UNIQUE,
  CONSTRAINT "fk_fiscal_entity_federal" FOREIGN KEY ("federal_code") REFERENCES "federal_government"("code"),
  CONSTRAINT "fk_fiscal_entity_state" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code"),
  CONSTRAINT "fk_fiscal_entity_lga" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code"),
  CONSTRAINT "chk_fiscal_entity_exclusive_arc" CHECK (
    ("entity_type" = 'federal' AND "federal_code" IS NOT NULL AND "state_code" IS NULL AND "lga_code" IS NULL)
    OR ("entity_type" = 'state' AND "federal_code" IS NULL AND "state_code" IS NOT NULL AND "lga_code" IS NULL)
    OR ("entity_type" = 'lga'   AND "federal_code" IS NULL AND "state_code" IS NULL AND "lga_code" IS NOT NULL)
  )
);

-- Seed federal entity
INSERT INTO "fiscal_entities" ("code", "name", "entity_type", "federal_code")
VALUES ('federal', 'Federal Government', 'federal', 'federal');

-- Seed state entities
INSERT INTO "fiscal_entities" ("code", "name", "entity_type", "state_code")
SELECT s."code", s."name" || ' State', 'state', s."code"
FROM "nigerian_states" s;

-- Seed LGA entities
INSERT INTO "fiscal_entities" ("code", "name", "entity_type", "lga_code")
SELECT l."code", l."name" || ' LGA', 'lga', l."code"
FROM "nigerian_lgas" l;

-- ============================================================
-- 4. Alter documents table: add entity_code, make state_code nullable
-- ============================================================

ALTER TABLE "documents"
  ALTER COLUMN "state_code" DROP NOT NULL;

ALTER TABLE "documents"
  ADD COLUMN "entity_code" VARCHAR(60);

ALTER TABLE "documents"
  ADD CONSTRAINT "fk_documents_entity" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code");

CREATE INDEX "idx_documents_entity_year" ON "documents" ("entity_code", "fiscal_year");

-- ============================================================
-- 5. NCoA Dimension Tables
-- ============================================================

-- Admin codes (MDAs) — scoped per entity
CREATE TABLE "budget_admin_codes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(12) NOT NULL,
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "name" TEXT NOT NULL,
  "level" SMALLINT NOT NULL,
  "parent_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_admin_parent" FOREIGN KEY ("parent_id") REFERENCES "budget_admin_codes"("id")
);
CREATE UNIQUE INDEX "uq_admin_code_entity" ON "budget_admin_codes" ("code", "entity_code");
CREATE INDEX "idx_admin_codes_entity" ON "budget_admin_codes" ("entity_code");

-- Economic codes — nationally standardized (NCoA)
CREATE TABLE "budget_economic_codes" (
  "code" VARCHAR(8) PRIMARY KEY,
  "name" TEXT NOT NULL,
  "level" SMALLINT NOT NULL,
  "parent_code" VARCHAR(8),
  "type" VARCHAR(15) NOT NULL, -- "revenue" | "expenditure"
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_economic_parent" FOREIGN KEY ("parent_code") REFERENCES "budget_economic_codes"("code")
);

-- Function codes — nationally standardized (COFOG)
CREATE TABLE "budget_function_codes" (
  "code" VARCHAR(5) PRIMARY KEY,
  "name" TEXT NOT NULL,
  "level" SMALLINT NOT NULL,
  "parent_code" VARCHAR(5),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_function_parent" FOREIGN KEY ("parent_code") REFERENCES "budget_function_codes"("code")
);

-- Fund codes — nationally standardized
CREATE TABLE "budget_fund_codes" (
  "code" VARCHAR(5) PRIMARY KEY,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Programmes — scoped per entity
CREATE TABLE "budget_programmes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(14) NOT NULL,
  "name" TEXT NOT NULL,
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_programme_code_entity" ON "budget_programmes" ("code", "entity_code");
CREATE INDEX "idx_programmes_entity" ON "budget_programmes" ("entity_code");

-- Locations — scoped per entity
CREATE TABLE "budget_locations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(8) NOT NULL,
  "name" TEXT NOT NULL,
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_location_code_entity" ON "budget_locations" ("code", "entity_code");
CREATE INDEX "idx_locations_entity" ON "budget_locations" ("entity_code");

-- ============================================================
-- 6. Budget Fact Tables
-- ============================================================

-- Approved budget line items (~1M rows)
CREATE TABLE "budget_line_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "fiscal_year" SMALLINT NOT NULL,
  "admin_id" UUID NOT NULL REFERENCES "budget_admin_codes"("id"),
  "economic_code" VARCHAR(8) NOT NULL REFERENCES "budget_economic_codes"("code"),
  "function_code" VARCHAR(5) REFERENCES "budget_function_codes"("code"),
  "fund_code" VARCHAR(5) REFERENCES "budget_fund_codes"("code"),
  "location_id" UUID REFERENCES "budget_locations"("id"),
  "programme_id" UUID REFERENCES "budget_programmes"("id"),
  "budget_type" "budget_type" NOT NULL,
  "description" TEXT,
  "prev_year_budget" DECIMAL(20, 2),
  "prev_year_actual" DECIMAL(20, 2),
  "approved_budget" DECIMAL(20, 2) NOT NULL,
  "out_year_1" DECIMAL(20, 2),
  "out_year_2" DECIMAL(20, 2),
  "source_document_id" UUID REFERENCES "documents"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_bli_entity_year" ON "budget_line_items" ("entity_code", "fiscal_year");
CREATE INDEX "idx_bli_admin" ON "budget_line_items" ("admin_id");
CREATE INDEX "idx_bli_economic" ON "budget_line_items" ("economic_code");
CREATE INDEX "idx_bli_year_type" ON "budget_line_items" ("fiscal_year", "budget_type");
CREATE INDEX "idx_bli_approved_desc" ON "budget_line_items" ("approved_budget" DESC);

-- Full natural key uniqueness
CREATE UNIQUE INDEX "uq_budget_line" ON "budget_line_items" (
  "entity_code", "fiscal_year", "admin_id", "economic_code", "budget_type",
  COALESCE("function_code", ''),
  COALESCE("fund_code", ''),
  COALESCE("location_id", '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE("programme_id", '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Budget implementation actuals (~2-4M rows)
CREATE TABLE "budget_actuals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "fiscal_year" SMALLINT NOT NULL,
  "quarter" SMALLINT NOT NULL,
  "report_section" VARCHAR(30) NOT NULL,
  "admin_id" UUID REFERENCES "budget_admin_codes"("id"),
  "economic_code" VARCHAR(8) REFERENCES "budget_economic_codes"("code"),
  "function_code" VARCHAR(5) REFERENCES "budget_function_codes"("code"),
  "programme_id" UUID REFERENCES "budget_programmes"("id"),
  "description" TEXT,
  "original_budget" DECIMAL(20, 2) NOT NULL,
  "quarterly_actual" DECIMAL(20, 2) NOT NULL,
  "ytd_actual" DECIMAL(20, 2) NOT NULL,
  "performance_pct" DECIMAL(5, 2) NOT NULL,
  "balance" DECIMAL(20, 2) NOT NULL,
  "source_document_id" UUID REFERENCES "documents"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_ba_entity_year_qtr" ON "budget_actuals" ("entity_code", "fiscal_year", "quarter");
CREATE INDEX "idx_ba_performance" ON "budget_actuals" ("performance_pct");
CREATE INDEX "idx_ba_admin" ON "budget_actuals" ("admin_id");

-- Full natural key uniqueness
CREATE UNIQUE INDEX "uq_budget_actual" ON "budget_actuals" (
  "entity_code", "fiscal_year", "quarter", "report_section",
  COALESCE("admin_id", '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE("economic_code", ''),
  COALESCE("function_code", ''),
  COALESCE("programme_id", '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Budget metadata (fiscal snapshot per entity/year)
CREATE TABLE "budget_metadata" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "fiscal_year" SMALLINT NOT NULL,
  "head_of_government" VARCHAR(200),
  "head_party" VARCHAR(50),
  "head_image_url" TEXT,
  "head_profile_url" TEXT,
  "finance_head_name" VARCHAR(200),
  "finance_head_title" VARCHAR(200),
  "legislature_head" VARCHAR(200),
  "appropriation_chair" VARCHAR(200),
  "accountant_general" VARCHAR(200),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_budget_metadata" ON "budget_metadata" ("entity_code", "fiscal_year");

-- ============================================================
-- 7. Cross-entity consistency triggers
-- ============================================================

-- Trigger for budget_line_items (checks admin, programme, location)
CREATE OR REPLACE FUNCTION check_budget_line_item_entity_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM budget_admin_codes WHERE id = NEW.admin_id AND entity_code = NEW.entity_code
  ) THEN
    RAISE EXCEPTION 'admin_id % does not belong to entity %', NEW.admin_id, NEW.entity_code;
  END IF;

  IF NEW.programme_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM budget_programmes WHERE id = NEW.programme_id AND entity_code = NEW.entity_code
  ) THEN
    RAISE EXCEPTION 'programme_id % does not belong to entity %', NEW.programme_id, NEW.entity_code;
  END IF;

  IF NEW.location_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM budget_locations WHERE id = NEW.location_id AND entity_code = NEW.entity_code
  ) THEN
    RAISE EXCEPTION 'location_id % does not belong to entity %', NEW.location_id, NEW.entity_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budget_line_item_entity_check
  BEFORE INSERT OR UPDATE ON budget_line_items
  FOR EACH ROW EXECUTE FUNCTION check_budget_line_item_entity_consistency();

-- Separate trigger for budget_actuals (no location_id column)
CREATE OR REPLACE FUNCTION check_budget_actual_entity_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM budget_admin_codes WHERE id = NEW.admin_id AND entity_code = NEW.entity_code
  ) THEN
    RAISE EXCEPTION 'admin_id % does not belong to entity %', NEW.admin_id, NEW.entity_code;
  END IF;

  IF NEW.programme_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM budget_programmes WHERE id = NEW.programme_id AND entity_code = NEW.entity_code
  ) THEN
    RAISE EXCEPTION 'programme_id % does not belong to entity %', NEW.programme_id, NEW.entity_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budget_actual_entity_check
  BEFORE INSERT OR UPDATE ON budget_actuals
  FOR EACH ROW EXECUTE FUNCTION check_budget_actual_entity_consistency();

-- ============================================================
-- 8. Domain-Specific Tables
-- ============================================================

-- Federal government payments (445K rows)
CREATE TABLE "govspend_payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "date" DATE NOT NULL,
  "payment_no" VARCHAR(50) NOT NULL UNIQUE,
  "payer_code" VARCHAR(20) NOT NULL,
  "organization_name" TEXT NOT NULL,
  "beneficiary_name" TEXT NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL,
  "description" TEXT NOT NULL,
  "source_url" TEXT,
  "scraped_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_gp_date" ON "govspend_payments" ("date");
CREATE INDEX "idx_gp_amount_desc" ON "govspend_payments" ("amount" DESC);
CREATE INDEX "idx_gp_payer" ON "govspend_payments" ("payer_code");
-- GIN trigram indexes for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "idx_gp_org_trgm" ON "govspend_payments" USING GIN ("organization_name" gin_trgm_ops);
CREATE INDEX "idx_gp_beneficiary_trgm" ON "govspend_payments" USING GIN ("beneficiary_name" gin_trgm_ops);

-- Internally generated revenue (~200 rows)
CREATE TABLE "igr_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "fiscal_year" SMALLINT NOT NULL,
  "period" VARCHAR(10) NOT NULL,
  "paye" DECIMAL(20, 2),
  "direct_assessment" DECIMAL(20, 2),
  "road_taxes" DECIMAL(20, 2),
  "stamp_duties" DECIMAL(20, 2),
  "capital_gain_tax" DECIMAL(20, 2),
  "withholding_tax" DECIMAL(20, 2),
  "other_taxes" DECIMAL(20, 2),
  "lga_revenue" DECIMAL(20, 2),
  "total_tax" DECIMAL(20, 2),
  "mdas_revenue" DECIMAL(20, 2),
  "total" DECIMAL(20, 2) NOT NULL,
  "source_notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_igr" ON "igr_records" ("entity_code", "fiscal_year", "period");

-- Public debt records (~5K rows)
CREATE TABLE "debt_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "quarter" DATE NOT NULL,
  "debt_type" "debt_type" NOT NULL,
  "creditor_category" VARCHAR(30),
  "amount" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "instrument" VARCHAR(30),
  "maturity_date" DATE,
  "source_snapshot" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_debt_entity_quarter" ON "debt_records" ("entity_code", "quarter");
CREATE UNIQUE INDEX "uq_debt" ON "debt_records"
  ("entity_code", "quarter", "debt_type", COALESCE("creditor_category", ''));

-- GDP by sector (~3K rows)
CREATE TABLE "gdp_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "year" SMALLINT NOT NULL,
  "sector_code" VARCHAR(10) NOT NULL,
  "sector_name" TEXT NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_gdp" ON "gdp_records" ("entity_code", "year", "sector_code");

-- Population estimates (~500 rows)
CREATE TABLE "population_estimates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "year" SMALLINT NOT NULL,
  "population" BIGINT NOT NULL,
  "source" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_population" ON "population_estimates" ("entity_code", "year");

-- ============================================================
-- 9. FAAC Tables (Source-Anchored 4-Table Model)
-- ============================================================

-- Table I: Monthly FAAC disbursement envelope + national summary
CREATE TABLE "faac_disbursements" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "revenue_year" SMALLINT NOT NULL,
  "revenue_month" SMALLINT NOT NULL,
  "disbursement_year" SMALLINT NOT NULL,
  "disbursement_month" SMALLINT NOT NULL,
  "total_statutory" DECIMAL(20, 2),
  "total_exchange_gain" DECIMAL(20, 2),
  "total_emtl" DECIMAL(20, 2),
  "total_vat" DECIMAL(20, 2),
  "grand_total" DECIMAL(20, 2) NOT NULL,
  "fgn_total" DECIMAL(20, 2),
  "states_total" DECIMAL(20, 2),
  "lgcs_total" DECIMAL(20, 2),
  "derivation_13pct_total" DECIMAL(20, 2),
  "cost_of_collection_ncs" DECIMAL(20, 2),
  "cost_of_collection_firs" DECIMAL(20, 2),
  "cost_of_collection_nuprc" DECIMAL(20, 2),
  "transfer_to_nmdpra" DECIMAL(20, 2),
  "special_items" JSONB,
  "source_description" TEXT,
  "source_document_id" UUID REFERENCES "documents"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_faac_disbursement" ON "faac_disbursements" ("disbursement_year", "disbursement_month");

-- Table II: FGN sub-allocations (~5 rows per disbursement)
CREATE TABLE "faac_fgn_details" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "disbursement_id" UUID NOT NULL REFERENCES "faac_disbursements"("id") ON DELETE CASCADE,
  "beneficiary" VARCHAR(100) NOT NULL,
  "sort_order" SMALLINT NOT NULL,
  "gross_statutory" DECIMAL(20, 2) NOT NULL,
  "total_deduction" DECIMAL(20, 2),
  "net_statutory" DECIMAL(20, 2) NOT NULL,
  "exchange_gain" DECIMAL(20, 2) NOT NULL,
  "emtl" DECIMAL(20, 2),
  "vat" DECIMAL(20, 2),
  "total" DECIMAL(20, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_faac_fgn_detail" ON "faac_fgn_details" ("disbursement_id", "beneficiary");

-- Table III: State allocations (37 rows per disbursement, 20 data columns)
CREATE TABLE "faac_state_allocations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "disbursement_id" UUID NOT NULL REFERENCES "faac_disbursements"("id") ON DELETE CASCADE,
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "num_lgcs" SMALLINT NOT NULL,
  "gross_statutory" DECIMAL(20, 2) NOT NULL,
  "derivation_13pct" DECIMAL(20, 2),
  "gross_total" DECIMAL(20, 2) NOT NULL,
  "deduction_external_debt" DECIMAL(20, 2) NOT NULL,
  "deduction_ispo" DECIMAL(20, 2) NOT NULL,
  "deduction_other" DECIMAL(20, 2) NOT NULL,
  "net_statutory" DECIMAL(20, 2) NOT NULL,
  "exchange_gain" DECIMAL(20, 2) NOT NULL,
  "exchange_gain_derivation_13pct" DECIMAL(20, 2),
  "total_exchange_gain" DECIMAL(20, 2) NOT NULL,
  "emtl" DECIMAL(20, 2) NOT NULL,
  "ecology_gross" DECIMAL(20, 2) NOT NULL,
  "ecology_transfer_nddc_hyppadec" DECIMAL(20, 2) NOT NULL,
  "ecology_net" DECIMAL(20, 2) NOT NULL,
  "vat_gross" DECIMAL(20, 2) NOT NULL,
  "vat_deduction" DECIMAL(20, 2) NOT NULL,
  "vat_net" DECIMAL(20, 2) NOT NULL,
  "total_gross" DECIMAL(20, 2) NOT NULL,
  "total_net" DECIMAL(20, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_faac_state" ON "faac_state_allocations" ("disbursement_id", "entity_code");
CREATE INDEX "idx_faac_state_entity" ON "faac_state_allocations" ("entity_code");

-- Table IV: LGA allocations (774 rows per disbursement, 9 data columns)
CREATE TABLE "faac_lga_allocations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "disbursement_id" UUID NOT NULL REFERENCES "faac_disbursements"("id") ON DELETE CASCADE,
  "entity_code" VARCHAR(60) NOT NULL REFERENCES "fiscal_entities"("code"),
  "net_statutory" DECIMAL(20, 2) NOT NULL,
  "deduction" DECIMAL(20, 2) NOT NULL,
  "exchange_gain" DECIMAL(20, 2) NOT NULL,
  "emtl" DECIMAL(20, 2) NOT NULL,
  "ecology_gross" DECIMAL(20, 2) NOT NULL,
  "ecology_transfer_nddc_hyppadec" DECIMAL(20, 2) NOT NULL,
  "ecology_net" DECIMAL(20, 2) NOT NULL,
  "vat" DECIMAL(20, 2) NOT NULL,
  "total_net" DECIMAL(20, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_faac_lga" ON "faac_lga_allocations" ("disbursement_id", "entity_code");
CREATE INDEX "idx_faac_lga_entity" ON "faac_lga_allocations" ("entity_code");

-- ============================================================
-- 10. FAAC summary view for product UX
-- ============================================================

CREATE VIEW "faac_summary" AS
SELECT
  sa."entity_code",
  d."disbursement_year",
  d."disbursement_month",
  sa."net_statutory" AS statutory,
  sa."total_exchange_gain" AS exchange_gain,
  sa."emtl",
  sa."derivation_13pct",
  sa."ecology_net" AS ecology,
  sa."vat_net" AS vat,
  sa."total_net" AS total
FROM "faac_state_allocations" sa
JOIN "faac_disbursements" d ON d."id" = sa."disbursement_id"
UNION ALL
SELECT
  la."entity_code",
  d."disbursement_year",
  d."disbursement_month",
  la."net_statutory" AS statutory,
  la."exchange_gain",
  la."emtl",
  NULL AS derivation_13pct,
  la."ecology_net" AS ecology,
  la."vat",
  la."total_net" AS total
FROM "faac_lga_allocations" la
JOIN "faac_disbursements" d ON d."id" = la."disbursement_id";

-- ============================================================
-- 11. Social Intelligence
-- ============================================================

CREATE TABLE "social_posts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform" VARCHAR(20) NOT NULL,
  "post_type" VARCHAR(30) NOT NULL,
  "external_id" VARCHAR(100),
  "content" TEXT NOT NULL,
  "trigger_topic" VARCHAR(200),
  "data_domain" VARCHAR(20),
  "data_query" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'drafted',
  "published_at" TIMESTAMPTZ,
  "engagement_data" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "in_reply_to_id" VARCHAR(100),
  "in_reply_to_text" TEXT,
  "in_reply_to_user" VARCHAR(100),
  "confidence" FLOAT,
  "review_status" VARCHAR(20),
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ
);
CREATE INDEX "idx_social_posts_platform_status" ON "social_posts" ("platform", "status");
CREATE INDEX "idx_social_posts_platform_date" ON "social_posts" ("platform", "created_at" DESC);
CREATE INDEX "idx_social_posts_review_status" ON "social_posts" ("review_status");
