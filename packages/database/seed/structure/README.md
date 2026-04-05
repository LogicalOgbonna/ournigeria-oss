# Admin Seed Contract

These seed files are intended to approximate the stricter admin-hierarchy model in the current plan/design.

## Normalized fields

- Official `position.role` uses the planned enum: `governor`, `deputy_governor`, `senator`, `rep`, `mha`, `chairman`, `vice_chairman`, `councilor`.
- Official positions carry seed-level provenance fields:
  - `source_type`
  - `source_url`
  - `source_date`
  - `confidence`
  - `last_verified_at`
  - `reviewed_by`
  - `review_status`
- `political-terms.json` includes `kind` to distinguish:
  - `national_assembly`
  - `governorship`
  - `state_assembly`
  - `lga_election_cycle`
  - `administration`
- Mapping files and `wards.json` include provenance-oriented fields where available:
  - `source`
  - `source_url`
  - `source_date`
  - `confidence`

## Known gaps that are not safely fixable by transformation

- `constituency-wards.json` now contains a conservative exact-LGA subset only. It maps wards where the official constituency name cleanly resolves to whole LGAs, but split-LGA federal/state constituencies still require real ward-level sourcing.
- `officials-lga-chairmen.json` still lacks reliable `start_date` and `term_code` data. These rows are useful source material but weak inputs for strict seeding.
- Most official records still use placeholder provenance values (`source_type=manual`, `confidence=medium|low`, `review_status=unreviewed`) because the raw seed does not include authoritative citations yet.

## State constituency reconciliation

The canonical seed now uses the authoritative `990` state-seat total.

- Canonical files:
  - `constituencies.json` contains `990` state constituencies.
  - `officials-state-assembly.json` contains `990` matching MHA rows.
- Review files:
  - `state-constituencies-overflow.json`
  - `officials-state-assembly-overflow.json`
  - `state-constituency-reconciliation-report.json`

Those overflow files preserve the `74` rows removed during reconciliation so nothing is silently lost.
The reconciliation strategy is intentionally conservative:

- exact duplicate-MHA rows in overcount states are treated as likely alias rows and moved to overflow first;
- any remaining overage is trimmed from the tail of the state-specific seed order and moved to overflow;
- this yields a canonical `990`-seat seed, but the overflow set still needs human review before being discarded as definitively wrong.

## Normalization script

Run:

```bash
node packages/database/scripts/build-constituency-ward-exact-lga.mjs
node packages/database/scripts/normalize-admin-seed.mjs
node packages/database/scripts/reconcile-state-constituencies.mjs
```

This updates the seed JSON files in place to the normalized contract above without inventing missing political facts.

Then validate:

```bash
node packages/database/scripts/validate-admin-seed.mjs
```

The validator now passes on structural checks, but coverage and provenance gaps remain for split-LGA constituency mappings and many official records.

## Constituency-to-ward subset

`packages/database/scripts/build-constituency-ward-exact-lga.mjs` writes a conservative subset to:

- `constituency-wards.json`
- `constituency-ward-exact-lga-report.json`

Current exact-LGA coverage:

- federal: `319` constituencies / `7844` wards (`89.07%`)
- state: `495` constituencies / `5446` wards (`61.84%`)
- wards covered by both a federal and state mapping in this subset: `5019` (`56.99%`)

These rows use `source=inec_exact_lga` and `confidence=medium` because the ward membership is derived from an exact match between the official INEC constituency name workbook and canonical ward-to-LGA membership. This is safe for whole-LGA constituencies, but it is not a substitute for direct ward-level sourcing in split-LGA states.
The generator excludes ambiguous overlaps instead of picking winners heuristically, but the current report has no remaining exclusions after the Kogi federal constituency name correction.

## Audit

The latest explicit accuracy audit is tracked in:

- `SEED_ACCURACY_AUDIT_2026-04-02.md`
- `INEC_WARD_RA_CROSSCHECK_2026-04-02.md`

Repeatable INEC workbook cross-check:

```bash
python3 packages/database/scripts/audit-wards-against-inec.py
```

This writes:

- `inec-ward-ra-mismatch-report.json`
