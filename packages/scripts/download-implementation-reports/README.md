# download-implementation-reports

Downloads quarterly budget implementation report PDFs by scraping state government websites (currently Ebonyi State).

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `ssl`, `json`, `pathlib`, `re`, `argparse`).

## Env vars

None required.

## Usage

```bash
# Download for all configured states
python3 packages/scripts/download-implementation-reports/download_implementation_reports.py

# Target a specific state
python3 packages/scripts/download-implementation-reports/download_implementation_reports.py --state Ebonyi
```

## Output

```
packages/source/budgets/{state}/{year}/implementation_report_Q{N}.pdf
```

Saves an `implementation_reports_manifest.json` in the budgets directory.

## Notes

- Extensible: add new states by defining a config in `STATE_CONFIGS` and a scraper function
- Parses HTML tables to identify implementation/performance report rows
- Deduplicates by (year, quarter), keeping the most recent upload
