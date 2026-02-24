# add-corruption-sources

Discovers EFCC press releases and news articles for each corruption case official, takes full-page Playwright screenshots, and appends a `## Sources` section to each official's `.md` files.

## Language

Node.js (ESM)

## Dependencies

- `playwright` (installed via `packages/scripts/package.json`)

## Env vars

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CSE_API_KEY` | No | Google Custom Search API key (avoids CAPTCHA) |
| `GOOGLE_CSE_CX` | No | Google Custom Search engine ID |

Without both Google CSE vars, falls back to DuckDuckGo HTML scraping via Playwright.

## Usage

```bash
# Full run (via pnpm)
pnpm --filter @naija-budget/scripts add-corruption-sources

# Or directly
node packages/scripts/add-corruption-sources/add-corruption-sources.mjs

# Single official
node packages/scripts/add-corruption-sources/add-corruption-sources.mjs --official Yahaya_Bello

# Discovery only (find URLs, no screenshots)
node packages/scripts/add-corruption-sources/add-corruption-sources.mjs --discovery-only

# Dry run (preview without writing)
node packages/scripts/add-corruption-sources/add-corruption-sources.mjs --dry-run
```

## Output

- Screenshots saved to `packages/source/corruption/{official}/`
- `## Sources` section appended to each official's `.md` files

## Notes

- **Resumable**: progress tracked in `.corruption-sources-progress.json` (in this folder)
- Rate-limited with configurable delays
- Classifies articles by keyword into the appropriate `.md` file (charges, court proceedings, etc.)
