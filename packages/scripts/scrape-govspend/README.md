# scrape-govspend

Scrapes all payment records from [GovSpend.ng](https://app.govspend.ng/api/payments/) and saves them as Markdown + JSON files.

## Language

Node.js (ESM)

## Dependencies

None (uses built-in `fetch`).

## Env vars

None required.

## Usage

```bash
# Full run (resumes automatically from last progress)
node packages/scripts/scrape-govspend/scrape-govspend.mjs

# Start from a specific page
node packages/scripts/scrape-govspend/scrape-govspend.mjs --from 100

# Custom delay between requests (default 300ms)
node packages/scripts/scrape-govspend/scrape-govspend.mjs --delay 500
```

## Output

```
packages/source/govspend/{year}/{month}/{day}/{beneficiary_slug}/{payment_no}.md
packages/source/govspend/{year}/{month}/{day}/{beneficiary_slug}/{payment_no}.json
```

## Notes

- **Resumable**: tracks progress in `packages/source/govspend/.scrape-progress.json`
- Rate-limited with configurable delay
- Retries with exponential back-off
- Deduplicates: skips payments already on disk
