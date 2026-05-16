# Debt Seeder

This script seeds `debt_records` from a housekeeping `debt.json` extract.

## Prerequisites

Ensure you have the cleaned JSON extracts located at:
`packages/source/housekeeping/cleaned/{StateName}/{year}/debt.json`

## Commands

### Seed a specific state and year

```bash
infisical run --env dev -- npx tsx packages/database/scripts/debt/seed-debt.ts --state abia --year 2026
```
You can use the state code (e.g., `abia`) or the display name (e.g., `Abia`).

### Dry Run

To parse the file and validate it without writing to the database:

```bash
npx tsx packages/database/scripts/debt/seed-debt.ts --state abia --year 2026 --dry-run
```

### Seed without replacing existing data

By default, the script deletes existing rows for the quarters in the file before seeding. To skip this deletion and instead upsert each record by its natural key:

```bash
infisical run --env dev -- npx tsx packages/database/scripts/debt/seed-debt.ts --state abia --year 2026 --no-replace
```

### Use a custom debt file path

```bash
infisical run --env dev -- npx tsx packages/database/scripts/debt/seed-debt.ts --state abia --year 2026 --debt /path/to/custom_debt.json
```

### Seed ALL states and years

To automatically find all `debt.json` files in the housekeeping directory and seed them sequentially, run this command from the repository root:

```bash
for file in packages/source/housekeeping/cleaned/*/*/debt.json; do
  state=$(basename $(dirname $(dirname "$file")))
  year=$(basename $(dirname "$file"))
  echo "Seeding debt for $state $year..."
  infisical run --env dev -- npx tsx packages/database/scripts/debt/seed-debt.ts --state "$state" --year "$year"
done
```
