# Populate Corruption Cases

Script to build a structured corruption cases database for Nigerian public officials using WordPress REST API data from Nigerian news sources.

## Data Sources

Articles are fetched via WordPress REST API (`/wp-json/wp/v2/posts?search=...`) from:

- **premiumtimesng.com** (200 OK)
- **dailypost.ng** (200 OK)
- **channelstv.com** (200 OK)

## Output Structure

For each official, the script creates a directory under `packages/source/corruption/{Official_Name}/` containing:

| File | Content |
|------|---------|
| `overview.md` | Who they are, case summary, significance |
| `charges.md` | Formal charges filed (counts, amounts, dates) |
| `financial_details.md` | Money amounts, assets, properties, recoveries |
| `court_proceedings.md` | Courts, judges, bail, adjournments, rulings |
| `arrest_and_investigation.md` | How investigation/arrest happened |
| `case_outcome.md` | Conviction, acquittal, pardon, ongoing, fled |
| `timeline.md` | Chronological events |
| `key_players.md` | Prosecutors, judges, defense lawyers, witnesses |
| `artifacts/` | Downloaded PDFs, images, and HTML snapshots |

## Usage

```bash
# Run for all officials (takes 6-8 hours)
node packages/scripts/populate-corruption-cases/populate-corruption-cases.mjs

# Process a single official
node packages/scripts/populate-corruption-cases/populate-corruption-cases.mjs --official Yahaya_Bello

# Dry run (preview without writing files)
node packages/scripts/populate-corruption-cases/populate-corruption-cases.mjs --dry-run

# Verbose logging
node packages/scripts/populate-corruption-cases/populate-corruption-cases.mjs --verbose

# Combine flags
node packages/scripts/populate-corruption-cases/populate-corruption-cases.mjs --official Sani_Abacha --verbose
```

## Progress Tracking

Progress is saved to `.corruption-cases-progress.json` in the script directory. The script is resumable — restarting skips already-completed officials.

## Verification

```bash
# Count completed officials
ls packages/source/corruption/*/overview.md | wc -l

# Check sources present
grep -rl "## Sources" packages/source/corruption/*/overview.md | wc -l

# Spot-check content
cat packages/source/corruption/Yahaya_Bello/charges.md
cat packages/source/corruption/Bola_Tinubu/overview.md

# Check progress
cat packages/scripts/populate-corruption-cases/.corruption-cases-progress.json | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
  const c=Object.values(d).filter(v=>v.status==='completed').length; \
  console.log(c+' completed')"
```
