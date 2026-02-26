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

# Custom delay between batches (default 300ms)
node packages/scripts/scrape-govspend/scrape-govspend.mjs --delay 500

# Fetch 10 pages concurrently per batch (default 5)
node packages/scripts/scrape-govspend/scrape-govspend.mjs --concurrency 10
```

## Output

```
packages/source/govspend/{year}/{month}/{day}/{beneficiary_slug}/{payment_no}.md
packages/source/govspend/{year}/{month}/{day}/{beneficiary_slug}/{payment_no}.json
```

## Notes

- **Resumable**: tracks progress in `packages/source/govspend/.scrape-progress.json`
- **Concurrent**: fetches multiple pages in parallel per batch (`--concurrency`, default 5)
- Rate-limited with configurable delay between batches (`--delay`, default 300ms)
- Retries with exponential back-off
- Deduplicates: skips payments already on disk
