-- Many approved lines share (admin, programme, type, …) with NULL economic_code;
-- COALESCE(economic_code, '') in uq_budget_line forced them into one bucket and broke seeding.
-- Enforce natural-key uniqueness only when economic_code is present.

DROP INDEX IF EXISTS "uq_budget_line";

CREATE UNIQUE INDEX "uq_budget_line" ON "budget_line_items" (
  "entity_code",
  "fiscal_year",
  "admin_id",
  "economic_code",
  "budget_type",
  COALESCE("function_code", ''),
  COALESCE("fund_code", ''),
  COALESCE("location_id", '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE("programme_id", '00000000-0000-0000-0000-000000000000'::uuid)
)
WHERE "economic_code" IS NOT NULL;
