# fetch-images

Fetches images for dignitaries (governors, commissioners, speakers, etc.) in budget `metadata.json` files using the Wikipedia API.

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `json`, `glob`, `base64`).

## Env vars

None required.

## Usage

```bash
python3 packages/scripts/fetch-images/fetch_images.py
```

## Output

Updates `metadata.json` files in `packages/source/budgets/` by adding `image_url` and `image_blob` fields for:
- Governors
- Commissioners of Finance
- House of Assembly Speakers
- Appropriation Committee Chairs
- Accountants General

## Notes

- Searches Wikipedia for person images using the MediaWiki API
- Caches results in memory to avoid re-fetching the same person across multiple metadata files
- Rate-limited (0.5s between API calls)
