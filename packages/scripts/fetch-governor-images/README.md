# fetch-governor-images

Fetches current governor images and bios from the [Nigeria Governors' Forum](https://nggovernorsforum.org) and updates `metadata.json` files with base64-encoded image blobs.

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `ssl`, `json`, `glob`, `base64`).

## Env vars

None required.

## Usage

```bash
python3 packages/scripts/fetch-governor-images/fetch_governor_images.py
```

## Output

Updates `metadata.json` files in `packages/source/budgets/` by adding `image_url`, `image_blob`, and `profile_url` fields to the `governor` object.

## Notes

- Contains a complete mapping of all 37 states to their current NGF governor data
- Uses fuzzy name matching to link NGF names to metadata names
- Downloads each governor's image once and caches in memory
