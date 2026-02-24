# download-openstates

Supplementary downloader for budget documents hosted on [OpenStates.ng](https://openstates.ng) (AWS S3). Fills gaps left by the NGF repository download.

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `ssl`, `json`, `pathlib`).

## Env vars

None required.

## Usage

```bash
python3 packages/scripts/download-openstates/download_openstates.py
```

## Output

```
packages/source/budgets/{state}/{year}/{filename}
```

## Notes

- Only downloads if the state/year combination doesn't already have files from the NGF download
- Covers 2025 budgets for 30+ states, plus historical gap-fillers and FCT budgets
- Hardcoded S3 URLs for confirmed documents
