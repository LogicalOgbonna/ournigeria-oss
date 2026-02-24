# download-federal-budgets

Downloads all federal budget documents from the [Budget Office of the Federation](https://budgetoffice.gov.ng/index.php/resources/internal-resources/budget-documents).

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `ssl`, `json`, `pathlib`, `re`).

## Env vars

None required.

## Usage

```bash
python3 packages/scripts/download-federal-budgets/download_federal_budgets.py
```

## Output

```
packages/source/federal_budget/{year}/{filename}
```

Saves a `download_manifest.json` with per-year download stats.

## Notes

- Handles nested subcategories and pagination on the Budget Office site
- Covers budget years 2009-2026 plus amendment acts
- Retry logic and rate limiting built in
