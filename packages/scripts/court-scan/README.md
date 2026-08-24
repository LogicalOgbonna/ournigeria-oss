# Court/sanctions candidate scanners (plan 59 research tooling)

One-off research scanners used for the 2026-08 source evaluations (plans 58/59):

- `cl_scan.py` — CourtListener/RECAP name sweep over the 2027 primary-candidates JSON.
  Checkpointed (resumes); reads the API token from `.context/.courtlistener_token`
  (or run keyless — NOTE: the search API is throttled to 50 req/hour even authed).
- `os_scan.py` — OpenSanctions `/match` sweep (batch). Reads `.context/.osanctions_key`.
  NOTE: the trial quota is 2,000 req/MONTH billed per name matched — one full pass
  ≈ the whole quota. Re-filter cached scan JSON offline instead of re-scanning.

Both expect `.context/party-candidates-2027-primaries.json` (gitignored data asset;
backup on homeland `~/ournigeria_backups/`). Outputs land in `.context/` as
`cl_scan_<office>.json` / `os_scan_<office>[_gate].json`.

Secrets: keys live in Infisical prod `/enrichment` (`COURTLISTENER_TOKEN`,
`OPENSANCTIONS_API_KEY`) — never commit them.
