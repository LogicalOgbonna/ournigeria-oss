# Budget Seeder

This script seeds fiscal budget tables from a housekeeping `budget_seed.json` extract.

## Prerequisites

Ensure you have the cleaned JSON extracts located at:
`packages/source/housekeeping/cleaned/{StateName}/{year}/budget_seed.json`

## Commands

### Seed a specific state and year

```bash
infisical run --env dev -- npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state abia --year 2026
```
You can use the state code (e.g., `abia`) or the display name (e.g., `Abia`).

### Dry Run

To parse the file and validate it without writing to the database:

```bash
npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state abia --year 2026 --dry-run
```

### Seed without replacing existing data

By default, the script deletes existing line items for the given entity and year before seeding. To skip this deletion (which will fail if duplicates are found):

```bash
infisical run --env dev -- npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state abia --year 2026 --no-replace
```

### Use a custom schema file path

```bash
infisical run --env dev -- npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state abia --year 2026 --schema /path/to/custom_budget_seed.json
```

### Seed ALL states and years

To automatically find all `budget_seed.json` files in the housekeeping directory and seed them sequentially, run this command from the repository root:

```bash
for file in packages/source/housekeeping/cleaned/*/*/budget_seed.json; do
  state=$(basename $(dirname $(dirname "$file")))
  year=$(basename $(dirname "$file"))
  echo "Seeding budget for $state $year..."
  infisical run --env dev -- npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state "$state" --year "$year"
done
```
