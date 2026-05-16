# IGR Seeder

This script seeds `igr_records` from a housekeeping `igr.json` extract.

Unlike budget and debt, IGR files are **multi-year** (one file per state covering many fiscal years and periods).

## Prerequisites

Ensure you have the cleaned JSON extracts located at:
`packages/source/housekeeping/cleaned/{StateName}/igr/igr.json`

## Commands

### Seed a specific state (all years in the file)

```bash
infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state abia
```
You can use the state code (e.g., `abia`) or the display name (e.g., `Abia`).

### Seed a specific state and filter by year

The `--year` flag acts as a record filter, not a folder selector.

```bash
infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state abia --year 2022
```

### Dry Run

To parse the file and validate it without writing to the database:

```bash
npx tsx packages/database/scripts/igr/seed-igr.ts --state abia --dry-run
```

### Seed without replacing existing data

By default, the script deletes existing rows for the (year, period) slices in the file before seeding. To skip this deletion and instead upsert each record on the `(entity_code, fiscal_year, period)` unique key:

```bash
infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state abia --no-replace
```

### Use a custom IGR file path

```bash
infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state abia --igr /path/to/custom_igr.json
```

### Seed ALL states

To automatically find all `igr.json` files in the housekeeping directory and seed them sequentially, run this command from the repository root:

```bash
for file in packages/source/housekeeping/cleaned/*/igr/igr.json; do
  state=$(basename $(dirname $(dirname "$file")))
  echo "Seeding IGR for $state..."
  infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state "$state"
done
```
