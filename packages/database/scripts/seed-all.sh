#!/bin/bash
set -e

# Navigate to the root of the repository
cd "$(dirname "$0")/../../.."

echo "========================================"
echo "🌱 Seeding All OurNigeria Data"
echo "========================================"

echo ""
echo "📊 1. Seeding Budget Data..."
# Check if files exist to avoid glob expansion errors
if ls packages/source/housekeeping/cleaned/*/*/budget_seed.json 1> /dev/null 2>&1; then
  for file in packages/source/housekeeping/cleaned/*/*/budget_seed.json; do
    state=$(basename $(dirname $(dirname "$file")))
    year=$(basename $(dirname "$file"))
    echo "  -> Seeding budget for $state $year..."
    infisical run --env dev -- npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state "$state" --year "$year"
  done
else
  echo "  -> No budget_seed.json files found. Skipping."
fi

echo ""
echo "💳 2. Seeding Debt Data..."
if ls packages/source/housekeeping/cleaned/*/*/debt.json 1> /dev/null 2>&1; then
  for file in packages/source/housekeeping/cleaned/*/*/debt.json; do
    state=$(basename $(dirname $(dirname "$file")))
    year=$(basename $(dirname "$file"))
    echo "  -> Seeding debt for $state $year..."
    infisical run --env dev -- npx tsx packages/database/scripts/debt/seed-debt.ts --state "$state" --year "$year"
  done
else
  echo "  -> No debt.json files found. Skipping."
fi

echo ""
echo "📈 3. Seeding IGR Data..."
if ls packages/source/housekeeping/cleaned/*/igr/igr.json 1> /dev/null 2>&1; then
  for file in packages/source/housekeeping/cleaned/*/igr/igr.json; do
    state=$(basename $(dirname $(dirname "$file")))
    echo "  -> Seeding IGR for $state..."
    infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state "$state"
  done
else
  echo "  -> No igr.json files found. Skipping."
fi

echo ""
echo "✅ All data seeded successfully!"
