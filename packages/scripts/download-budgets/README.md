# download-budgets

Downloads Nigerian state budget documents from the NGF Digital Repository (ngfrepository.org.ng) and OpenStates.ng.

## Language

Python 3 (stdlib only)

## Dependencies

None (uses `urllib`, `ssl`, `json`, `pathlib`).

## Env vars

None required.

## Usage

```bash
python3 packages/scripts/download-budgets/download_budgets.py
```

## Output

```
packages/source/budgets/{state}/{year}/{filename}
```

Prefers Excel over PDF. Skips files that already exist.

## Notes

- Uses a permissive SSL context (some government repos use self-signed certs)
- Retry logic with exponential back-off
- Covers all 37 Nigerian states
