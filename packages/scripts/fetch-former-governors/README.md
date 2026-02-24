# fetch-former-governors

Fetches former governor images from the [Nigeria Governors' Forum](https://nggovernorsforum.org) media directory and updates `metadata.json` files with base64-encoded image blobs.

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `ssl`, `json`, `glob`, `base64`).

## Env vars

None required.

## Usage

```bash
python3 packages/scripts/fetch-former-governors/fetch_former_governors.py
```

## Output

Updates `metadata.json` files in `packages/source/budgets/` by adding `image_url` and `image_blob` fields to the `governor` object for former governors.

## Notes

- Contains a hardcoded mapping of (state, governor name) to NGF image filenames
- Only updates metadata entries where the governor has no existing image
- Downloads images once and caches in memory for reuse across metadata files
