-- Budget metadata: PDF summary totals / balances
ALTER TABLE "budget_metadata"
  ADD COLUMN "opening_balance" DECIMAL(20, 2),
  ADD COLUMN "closing_balance" DECIMAL(20, 2),
  ADD COLUMN "total_revenue" DECIMAL(20, 2),
  ADD COLUMN "total_expenditure" DECIMAL(20, 2);

-- Line items: optional economic code, PDF audit fields
ALTER TABLE "budget_line_items"
  ADD COLUMN "source_page" INTEGER,
  ADD COLUMN "source_anchor" TEXT;

-- Natural-key uniqueness must treat NULL economic_code as one bucket (PostgreSQL
-- UNIQUE allows multiple NULLs on the same column otherwise).
DROP INDEX IF EXISTS "uq_budget_line";

ALTER TABLE "budget_line_items" ALTER COLUMN "economic_code" DROP NOT NULL;

CREATE UNIQUE INDEX "uq_budget_line" ON "budget_line_items" (
  "entity_code",
  "fiscal_year",
  "admin_id",
  COALESCE("economic_code", ''),
  "budget_type",
  COALESCE("function_code", ''),
  COALESCE("fund_code", ''),
  COALESCE("location_id", '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE("programme_id", '00000000-0000-0000-0000-000000000000'::uuid)
);

CREATE INDEX "idx_bli_entity_year_source_page" ON "budget_line_items" ("entity_code", "fiscal_year", "source_page");
