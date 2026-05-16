-- DropForeignKey
ALTER TABLE "budget_line_items" DROP CONSTRAINT "budget_line_items_economic_code_fkey";

-- AlterTable
ALTER TABLE "budget_actuals" ADD COLUMN     "project_id" UUID,
ADD COLUMN     "section_id" UUID;

-- AlterTable
ALTER TABLE "budget_line_items" ADD COLUMN     "project_id" UUID,
ADD COLUMN     "section_id" UUID;

-- AlterTable
ALTER TABLE "budget_locations" ADD COLUMN     "canonical_lga_code" VARCHAR(60),
ADD COLUMN     "is_state_wide" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "budget_document_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_code" VARCHAR(60) NOT NULL,
    "fiscal_year" SMALLINT NOT NULL,
    "document_kind" VARCHAR(50) NOT NULL,
    "section_key" VARCHAR(100) NOT NULL,
    "title" TEXT NOT NULL,
    "parent_section_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source_document_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_document_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_code" VARCHAR(60) NOT NULL,
    "fiscal_year" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,
    "external_code" VARCHAR(100),
    "primary_admin_id" UUID,
    "primary_programme_id" UUID,
    "climate_related" BOOLEAN NOT NULL DEFAULT false,
    "nutrition_related" BOOLEAN NOT NULL DEFAULT false,
    "is_state_wide" BOOLEAN NOT NULL DEFAULT false,
    "source_document_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_project_locations" (
    "project_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "weight" DECIMAL(5,2),

    CONSTRAINT "budget_project_locations_pkey" PRIMARY KEY ("project_id","location_id")
);

-- CreateIndex
CREATE INDEX "idx_budget_section_entity_year" ON "budget_document_sections"("entity_code", "fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "uq_budget_section" ON "budget_document_sections"("entity_code", "fiscal_year", "document_kind", "section_key");

-- CreateIndex
CREATE INDEX "idx_budget_project_entity_year" ON "budget_projects"("entity_code", "fiscal_year");

-- CreateIndex
CREATE INDEX "idx_budget_project_name" ON "budget_projects"("entity_code", "fiscal_year", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_budget_project_ext_code" ON "budget_projects"("entity_code", "fiscal_year", "external_code");

-- AddForeignKey
ALTER TABLE "budget_locations" ADD CONSTRAINT "budget_locations_canonical_lga_code_fkey" FOREIGN KEY ("canonical_lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_document_sections" ADD CONSTRAINT "budget_document_sections_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_document_sections" ADD CONSTRAINT "budget_document_sections_parent_section_id_fkey" FOREIGN KEY ("parent_section_id") REFERENCES "budget_document_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_document_sections" ADD CONSTRAINT "budget_document_sections_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_projects" ADD CONSTRAINT "budget_projects_entity_code_fkey" FOREIGN KEY ("entity_code") REFERENCES "fiscal_entities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_projects" ADD CONSTRAINT "budget_projects_primary_admin_id_fkey" FOREIGN KEY ("primary_admin_id") REFERENCES "budget_admin_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_projects" ADD CONSTRAINT "budget_projects_primary_programme_id_fkey" FOREIGN KEY ("primary_programme_id") REFERENCES "budget_programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_projects" ADD CONSTRAINT "budget_projects_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_project_locations" ADD CONSTRAINT "budget_project_locations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "budget_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_project_locations" ADD CONSTRAINT "budget_project_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "budget_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_economic_code_fkey" FOREIGN KEY ("economic_code") REFERENCES "budget_economic_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "budget_document_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "budget_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "budget_document_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "budget_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
