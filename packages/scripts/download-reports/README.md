# download-reports

Downloads Nigerian state budget implementation (performance) reports from direct PDF links across state government websites.

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `ssl`, `json`, `pathlib`).

## Env vars

None required.

## Usage

```bash
# Run from the project root
python3 packages/scripts/download-reports/download_reports.py
```

## Output

```
packages/source/budgets/{state}/{year}/implementation_report_q{N}.pdf
```

Also creates:
- `packages/source/budgets/download_results.json` — download summary
- `packages/source/budgets/failed_downloads.json` — failed URLs for retry

## Notes

- Uses CWD-relative paths; **must be run from the project root**
- Contains hardcoded direct PDF URLs for 25+ states
- Creates placeholder directories for states that only have portal pages (no direct links)
- Skips files that already exist and are >1KB
