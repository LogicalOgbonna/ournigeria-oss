-- DropForeignKey
ALTER TABLE "budget_actuals" DROP CONSTRAINT IF EXISTS "budget_actuals_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_actuals" DROP CONSTRAINT IF EXISTS "budget_actuals_economic_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_actuals" DROP CONSTRAINT IF EXISTS "budget_actuals_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_actuals" DROP CONSTRAINT IF EXISTS "budget_actuals_function_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_actuals" DROP CONSTRAINT IF EXISTS "budget_actuals_programme_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_actuals" DROP CONSTRAINT IF EXISTS "budget_actuals_source_document_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_admin_codes" DROP CONSTRAINT IF EXISTS "budget_admin_codes_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_admin_codes" DROP CONSTRAINT IF EXISTS "fk_admin_parent";

-- DropForeignKey
ALTER TABLE "budget_economic_codes" DROP CONSTRAINT IF EXISTS "fk_economic_parent";

-- DropForeignKey
ALTER TABLE "budget_function_codes" DROP CONSTRAINT IF EXISTS "fk_function_parent";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_economic_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_function_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_fund_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_location_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_programme_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_source_document_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_locations" DROP CONSTRAINT IF EXISTS "budget_locations_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_metadata" DROP CONSTRAINT IF EXISTS "budget_metadata_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "budget_programmes" DROP CONSTRAINT IF EXISTS "budget_programmes_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "constituency_wards" DROP CONSTRAINT IF EXISTS "constituency_wards_constituency_code_fkey";

-- DropForeignKey
ALTER TABLE "constituency_wards" DROP CONSTRAINT IF EXISTS "constituency_wards_ward_code_fkey";

-- DropForeignKey
ALTER TABLE "debt_records" DROP CONSTRAINT IF EXISTS "debt_records_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_state_code_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "fk_documents_entity";

-- DropForeignKey
ALTER TABLE "faac_disbursements" DROP CONSTRAINT IF EXISTS "faac_disbursements_source_document_id_fkey";

-- DropForeignKey
ALTER TABLE "faac_fgn_details" DROP CONSTRAINT IF EXISTS "faac_fgn_details_disbursement_id_fkey";

-- DropForeignKey
ALTER TABLE "faac_lga_allocations" DROP CONSTRAINT IF EXISTS "faac_lga_allocations_disbursement_id_fkey";

-- DropForeignKey
ALTER TABLE "faac_lga_allocations" DROP CONSTRAINT IF EXISTS "faac_lga_allocations_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "faac_state_allocations" DROP CONSTRAINT IF EXISTS "faac_state_allocations_disbursement_id_fkey";

-- DropForeignKey
ALTER TABLE "faac_state_allocations" DROP CONSTRAINT IF EXISTS "faac_state_allocations_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_entities" DROP CONSTRAINT IF EXISTS "fk_fiscal_entity_federal";

-- DropForeignKey
ALTER TABLE "fiscal_entities" DROP CONSTRAINT IF EXISTS "fk_fiscal_entity_lga";

-- DropForeignKey
ALTER TABLE "fiscal_entities" DROP CONSTRAINT IF EXISTS "fk_fiscal_entity_state";

-- DropForeignKey
ALTER TABLE "gdp_records" DROP CONSTRAINT IF EXISTS "gdp_records_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "govspend_payments" DROP CONSTRAINT IF EXISTS "govspend_payments_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "igr_records" DROP CONSTRAINT IF EXISTS "igr_records_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "nigerian_states" DROP CONSTRAINT IF EXISTS "fk_states_zone";

-- DropForeignKey
ALTER TABLE "nigerian_wards" DROP CONSTRAINT IF EXISTS "nigerian_wards_lga_code_fkey";

-- DropForeignKey
ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "fk_positions_constituency";

-- DropForeignKey
ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "fk_positions_lga";

-- DropForeignKey
ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "fk_positions_party";

-- DropForeignKey
ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "fk_positions_state";

-- DropForeignKey
ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "fk_positions_term";

-- DropForeignKey
ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "fk_positions_ward";

-- DropForeignKey
ALTER TABLE "political_terms" DROP CONSTRAINT IF EXISTS "political_terms_state_code_fkey";

-- DropForeignKey
ALTER TABLE "population_estimates" DROP CONSTRAINT IF EXISTS "population_estimates_entity_code_fkey";

-- DropForeignKey
ALTER TABLE "senatorial_district_lgas" DROP CONSTRAINT IF EXISTS "senatorial_district_lgas_lga_code_fkey";

-- DropForeignKey
ALTER TABLE "senatorial_district_lgas" DROP CONSTRAINT IF EXISTS "senatorial_district_lgas_senatorial_district_code_fkey";

-- DropIndex
DROP INDEX IF EXISTS "idx_gp_beneficiary_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_gp_org_trgm";

-- AlterTable
ALTER TABLE "nigerian_officials" ADD COLUMN IF NOT EXISTS "completeness_score" DECIMAL(3,2);

-- DropTable
DROP TABLE IF EXISTS "unmapped_position_parties";

-- CreateTable
CREATE TABLE IF NOT EXISTS "data_proposals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "position_id" UUID,
    "proposer_phone" VARCHAR(20) NOT NULL,
    "target_field" VARCHAR(50) NOT NULL,
    "proposed_value" JSONB NOT NULL,
    "source_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'submitted',
    "vote_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ,
    "reviewed_by" UUID,

    CONSTRAINT "data_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "proposal_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proposal_id" UUID NOT NULL,
    "voter_phone" VARCHAR(20) NOT NULL,
    "direction" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "activity_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_type" VARCHAR(30) NOT NULL,
    "target_type" VARCHAR(30) NOT NULL,
    "target_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_proposals_official_status" ON "data_proposals"("official_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_proposals_status_date" ON "data_proposals"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_proposals_phone_date" ON "data_proposals"("proposer_phone", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_votes_phone_date" ON "proposal_votes"("voter_phone", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_vote_proposal_voter" ON "proposal_votes"("proposal_id", "voter_phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_activity_date" ON "activity_log"("created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_activity_target" ON "activity_log"("target_type", "target_id");

-- AddForeignKey (skipped — geopolitical_zones table created in later migration 20260404100000)
-- ALTER TABLE "nigerian_states" ADD CONSTRAINT "nigerian_states_zone_code_fkey" FOREIGN KEY ("zone_code") REFERENCES "geopolitical_zones"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_positions" ADD CONSTRAINT "official_positions_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "political_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_positions" ADD CONSTRAINT "official_positions_party_acronym_fkey" FOREIGN KEY ("party_acronym") REFERENCES "political_parties"("acronym") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_positions" ADD CONSTRAINT "official_positions_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_positions" ADD CONSTRAINT "official_positions_constituency_code_fkey" FOREIGN KEY ("constituency_code") REFERENCES "nigerian_constituencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_positions" ADD CONSTRAINT "official_positions_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_positions" ADD CONSTRAINT "official_positions_ward_code_fkey" FOREIGN KEY ("ward_code") REFERENCES "nigerian_wards"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "political_terms" ADD CONSTRAINT "political_terms_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nigerian_wards" ADD CONSTRAINT "nigerian_wards_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "senatorial_district_lgas" ADD CONSTRAINT "senatorial_district_lgas_senatorial_district_code_fkey" FOREIGN KEY ("senatorial_district_code") REFERENCES "nigerian_constituencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "senatorial_district_lgas" ADD CONSTRAINT "senatorial_district_lgas_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constituency_wards" ADD CONSTRAINT "constituency_wards_constituency_code_fkey" FOREIGN KEY ("constituency_code") REFERENCES "nigerian_constituencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constituency_wards" ADD CONSTRAINT "constituency_wards_ward_code_fkey" FOREIGN KEY ("ward_code") REFERENCES "nigerian_wards"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK constraints for data_proposals
ALTER TABLE "data_proposals" ADD CONSTRAINT "chk_proposal_status"
  CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'needs_evidence'));

ALTER TABLE "data_proposals" ADD CONSTRAINT "chk_proposal_direction"
  CHECK (true); -- direction validated on proposal_votes

ALTER TABLE "proposal_votes" ADD CONSTRAINT "chk_vote_direction"
  CHECK (direction IN (1, -1));

-- AddForeignKey
ALTER TABLE "data_proposals" ADD CONSTRAINT "data_proposals_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_proposals" ADD CONSTRAINT "data_proposals_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "official_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_votes" ADD CONSTRAINT "proposal_votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "data_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_entities" ADD CONSTRAINT "fiscal_entities_federal_code_fkey" FOREIGN KEY ("federal_code") REFERENCES "federal_government"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_entities" ADD CONSTRAINT "fiscal_entities_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_entities" ADD CONSTRAINT "fiscal_entities_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_admin_codes" ADD CONSTRAINT "budget_admin_codes_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_admin_codes" ADD CONSTRAINT "budget_admin_codes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "budget_admin_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_economic_codes" ADD CONSTRAINT "budget_economic_codes_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "budget_economic_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_function_codes" ADD CONSTRAINT "budget_function_codes_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "budget_function_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_programmes" ADD CONSTRAINT "budget_programmes_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_locations" ADD CONSTRAINT "budget_locations_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "budget_admin_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_economic_code_fkey" FOREIGN KEY ("economic_code") REFERENCES "budget_economic_codes"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_function_code_fkey" FOREIGN KEY ("function_code") REFERENCES "budget_function_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_fund_code_fkey" FOREIGN KEY ("fund_code") REFERENCES "budget_fund_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "budget_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "budget_programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "budget_admin_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_economic_code_fkey" FOREIGN KEY ("economic_code") REFERENCES "budget_economic_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_function_code_fkey" FOREIGN KEY ("function_code") REFERENCES "budget_function_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "budget_programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_metadata" ADD CONSTRAINT "budget_metadata_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "govspend_payments" ADD CONSTRAINT "govspend_payments_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "igr_records" ADD CONSTRAINT "igr_records_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_records" ADD CONSTRAINT "debt_records_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gdp_records" ADD CONSTRAINT "gdp_records_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "population_estimates" ADD CONSTRAINT "population_estimates_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faac_disbursements" ADD CONSTRAINT "faac_disbursements_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faac_fgn_details" ADD CONSTRAINT "faac_fgn_details_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "faac_disbursements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faac_state_allocations" ADD CONSTRAINT "faac_state_allocations_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "faac_disbursements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faac_state_allocations" ADD CONSTRAINT "faac_state_allocations_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faac_lga_allocations" ADD CONSTRAINT "faac_lga_allocations_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "faac_disbursements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faac_lga_allocations" ADD CONSTRAINT "faac_lga_allocations_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
