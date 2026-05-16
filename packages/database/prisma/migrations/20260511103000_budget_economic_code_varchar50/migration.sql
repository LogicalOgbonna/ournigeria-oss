-- Widen economic code columns (state budgets use longer NCoA / local segments than VARCHAR(8)).

ALTER TABLE "budget_line_items" DROP CONSTRAINT IF EXISTS "budget_line_items_economic_code_fkey";
ALTER TABLE "budget_actuals" DROP CONSTRAINT IF EXISTS "budget_actuals_economic_code_fkey";
ALTER TABLE "budget_economic_codes" DROP CONSTRAINT IF EXISTS "budget_economic_codes_parent_code_fkey";

ALTER TABLE "budget_economic_codes" ALTER COLUMN "code" TYPE VARCHAR(50);
ALTER TABLE "budget_economic_codes" ALTER COLUMN "parent_code" TYPE VARCHAR(50);
ALTER TABLE "budget_line_items" ALTER COLUMN "economic_code" TYPE VARCHAR(50);
ALTER TABLE "budget_actuals" ALTER COLUMN "economic_code" TYPE VARCHAR(50);

ALTER TABLE "budget_economic_codes" ADD CONSTRAINT "budget_economic_codes_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "budget_economic_codes" ("code") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_economic_code_fkey" FOREIGN KEY ("economic_code") REFERENCES "budget_economic_codes" ("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_economic_code_fkey" FOREIGN KEY ("economic_code") REFERENCES "budget_economic_codes" ("code") ON DELETE SET NULL ON UPDATE CASCADE;
