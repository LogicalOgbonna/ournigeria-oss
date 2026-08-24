"""Orchestrate ward reconciliation for one state.

    python3 -m reconcile_wards.cli --state ABIA            # dry-run: writes report only
    python3 -m reconcile_wards.cli --state ABIA --apply --accept-residual

Dry-run (default) fetches the workbook, parses SD/FC/SC, resolves each state
constituency's LGA, matches its wards to DB ward codes, and writes a proposal
report + residual JSON. It never touches the seed. ``--apply`` additionally
merges the confident additions into the seed — but only after printing the
residual/conflict summary and requiring ``--accept-residual`` when either is
non-empty.
"""

from __future__ import annotations

import argparse
import sys

import openpyxl

from . import apply as apply_mod
from . import db
from .fetch import BASE, fetch_state
from .match import apply_seat_synonym, match_one, resolve_constituency_lgas
from .parse import parse_lga_rows, parse_sc_rows
from .report import ConstituencyResult, WardResult, build_report, write_report

# scripts dir already on sys.path via package import, but ensure ward_utils.
sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.dirname(__file__)))
from ward_utils import WORKBOOK_TO_STATE, normalize_name  # noqa: E402


# INEC names the three worksheets inconsistently across states. Observed forms:
#   ABIA      -> "ABIA SC"        (state-prefixed)
#   BAYELSA   -> "SC"             (bare)
#   ONDO      -> "SC ONDO"        (state-SUFFIXED — the reason ONDO failed)
#   BENUE     -> "STATE CONSTITUENCY"   (full words, and pluralised in places:
#   KWARA        BENUE writes "FEDERAL CONSTITUENCIES", KWARA the singular)
_SHEET_WORDS = {
    "SD": ("senatorial",),
    "FC": ("federal constituenc",),
    "SC": ("state constituenc",),
}


def _sheet(wb, workbook: str, kind: str):
    """Resolve a worksheet by kind ('SD'/'FC'/'SC') across INEC's naming variants.

    Tried in order, most specific first: exact prefixed/bare/suffixed names, then
    the abbreviation as a leading or trailing token, then the full-word form.
    Token-boundary checks matter — a bare `endswith("SC")` also matches a sheet
    ending in "...WSC", and matching "SC" anywhere inside a name would let
    "FC" hit "FCT".
    """
    names = list(wb.sheetnames)
    for candidate in (f"{workbook} {kind}", kind, f"{kind} {workbook}"):
        if candidate in names:
            return wb[candidate]

    for name in names:
        tokens = name.strip().upper().split()
        if tokens and (tokens[0] == kind or tokens[-1] == kind):
            return wb[name]

    for name in names:
        lowered = name.strip().lower()
        if any(lowered.startswith(word) for word in _SHEET_WORDS[kind]):
            return wb[name]

    raise KeyError(f"{workbook}: no '{kind}' worksheet (sheets: {names})")


def _confidence(score: float) -> str:
    if score >= 0.999:
        return "high"
    if score >= 0.92:
        return "medium"
    return "low"


def reconcile_state(workbook: str) -> tuple:
    """Run the read-only pipeline for a state workbook (e.g. 'ABIA').

    Returns ``(report, results, additions, senatorial_additions, state_slug)``.
    """
    if workbook not in WORKBOOK_TO_STATE:
        raise SystemExit(f"Unknown workbook '{workbook}'. Valid: {sorted(WORKBOOK_TO_STATE)}")
    state = WORKBOOK_TO_STATE[workbook]
    source_url = f"{BASE}/{workbook}.xlsx"

    path = fetch_state(workbook)
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    # The FCT has no State House of Assembly, so its workbook ships SD and FC
    # only. That is correct data, not a parse failure — say so instead of
    # raising, or it reads as a bug every time the batch runs.
    if workbook == "FCT":
        raise SystemExit(
            "FCT has no State House of Assembly — its workbook carries no state "
            "constituency sheet. Nothing to reconcile."
        )
    sc_rows = [list(r) for r in _sheet(wb, workbook, "SC").iter_rows(values_only=True)]
    sd_rows = [list(r) for r in _sheet(wb, workbook, "SD").iter_rows(values_only=True)]
    parsed_sc = parse_sc_rows(sc_rows)
    districts = parse_lga_rows(sd_rows)

    # DB snapshots.
    wards_index = db.wards_by_lga(state)  # lga_code -> [(ward_code, ward_name)]
    all_consts = db.constituencies(state)
    state_lgas = db.lgas(state)
    existing_maps = db.constituency_wards(state)

    state_consts = [(c, n) for c, n, t in all_consts if t == "state"]

    # state-wide ward candidate pool, used as a fallback for constituencies that
    # legitimately span more than one LGA (e.g. Aba Central draws wards from both
    # Aba South and Aba North LGAs). Only consulted when a ward fails to resolve
    # inside its resolved LGA — the exact/fuzzy gate still applies.
    all_wards = [wc for lst in wards_index.values() for wc in lst]

    results: list[ConstituencyResult] = []
    additions: list[tuple[str, str, str]] = []  # (constituency_code, ward_code, confidence)

    for pc in parsed_sc:
        # match SC name -> DB state-constituency code
        cm = match_one(apply_seat_synonym(state, pc.name), state_consts)
        constituency_code = cm.code
        # Resolve the FULL set of LGAs this constituency spans. `lga_codes[0]` is
        # the primary LGA; any trailing entries are sibling LGAs discovered by
        # evidence (cross-LGA constituencies like Aba Central draw wards from >1
        # LGA). Ward matching is TIERED so an evidence-discovered sibling can
        # never override a within-primary match:
        #   1. match against the primary LGA(s) pool first;
        #   2. only wards that fail to resolve there consult the sibling pool;
        #   3. only wards still unresolved fall back to a whole-state exact hit.
        # This keeps sibling-LGA wards reachable (Ogbor I/II for Aba Central)
        # without letting a coincidental same-name ward in another LGA (e.g. an
        # exact "Uratta" in Aba North) beat a fuzzy in-LGA match ("Urtta" in
        # Osisioma).
        lga_codes = resolve_constituency_lgas(
            pc, districts, state_lgas, state, wards_index
        )
        lga_code = lga_codes[0] if lga_codes else None
        primary_lgas = lga_codes[:1]
        sibling_lgas = lga_codes[1:]

        primary_pool = [
            wc for lc in primary_lgas for wc in wards_index.get(lc, [])
        ]
        sibling_pool = [
            wc for lc in sibling_lgas for wc in wards_index.get(lc, [])
        ]
        ward_results: list[WardResult] = []
        for wname in pc.wards:
            wm = match_one(wname, primary_pool)
            if wm.code is None and sibling_pool:
                # tier 2: sibling LGA(s) of a cross-LGA constituency.
                sib = match_one(wname, sibling_pool)
                if sib.code is not None:
                    wm = sib
            if wm.code is None:
                # tier 3 last-resort: exact match against the whole state's
                # wards. Only a decisive (exact) hit is kept here so a fuzzy
                # near-miss can never silently jump LGA scope.
                fallback = match_one(wname, all_wards)
                if fallback.code is not None and fallback.score >= 0.999:
                    wm = fallback
            ward_results.append(
                WardResult(
                    parsed_name=wname,
                    ward_code=wm.code,
                    score=wm.score,
                    needs_review=wm.needs_review,
                    candidate=wm.candidate,
                )
            )
            if wm.code is not None and not wm.needs_review and constituency_code:
                additions.append((constituency_code, wm.code, _confidence(wm.score)))

        results.append(
            ConstituencyResult(
                constituency_code=constituency_code,
                constituency_name=pc.name,
                constituency_type="state",
                lga_code=lga_code,
                ra_count=pc.ra_count,
                wards=ward_results,
            )
        )

    # senatorial -> LGA additions from SD composition
    sen_consts = [(c, n) for c, n, t in all_consts if t == "senatorial"]
    senatorial_additions: list[tuple[str, str, str]] = []
    for d in districts:
        sm = match_one(d.name, sen_consts)
        if sm.code is None:
            continue
        for lname in d.lgas:
            lm = match_one(lname, state_lgas)
            if lm.code is not None and not lm.needs_review:
                senatorial_additions.append((sm.code, lm.code, _confidence(lm.score)))

    report = build_report(state, results, existing_maps)
    return report, results, additions, senatorial_additions, state, source_url


def _print_summary(report) -> None:
    r = report
    pct = (100.0 * r.matched_count / r.total_wards) if r.total_wards else 0.0
    print(f"State: {r.state}")
    print(f"  Constituencies: {r.total_constituencies}")
    print(f"  Wards matched:  {r.matched_count}/{r.total_wards} ({pct:.1f}%)")
    print(f"  Unmatched wards: {len(r.unmatched_wards)}")
    print(f"  Unmatched constituencies: {len(r.unmatched_constituencies)}")
    print(f"  Conflicts: {len(r.conflicts)}")
    print(f"  Count-check mismatches: {len(r.count_mismatches)}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="reconcile_wards.cli")
    ap.add_argument("--state", required=True, help="INEC workbook name, e.g. ABIA")
    ap.add_argument(
        "--apply",
        action="store_true",
        help="write additions to the seed (default: dry-run, report only)",
    )
    ap.add_argument(
        "--accept-residual",
        action="store_true",
        help="required with --apply when the residual/conflict list is non-empty",
    )
    args = ap.parse_args(argv)

    (
        report,
        results,
        additions,
        senatorial_additions,
        state,
        source_url,
    ) = reconcile_state(args.state)

    md_path, json_path = write_report(report, results)
    _print_summary(report)
    print(f"  Report:   {md_path}")
    print(f"  Residual: {json_path}")

    if not args.apply:
        print("\nDry-run: no seed files written. Re-run with --apply to write.")
        return 0

    residual_blocking = bool(report.residual or report.conflicts)
    if residual_blocking and not args.accept_residual:
        print(
            "\nRefusing to --apply: residual/conflicts are non-empty. "
            "Resolve them or pass --accept-residual to proceed.",
            file=sys.stderr,
        )
        return 2

    # constituency-wards additions
    cw_source = f"inec_{state}_sc_worksheet"
    cw_rows = apply_mod.load_seed(apply_mod.CONSTITUENCY_WARDS_SEED)
    merged_cw = apply_mod.apply_additions(
        cw_rows, additions, source=cw_source, source_url=source_url
    )
    apply_mod.write_seed(apply_mod.CONSTITUENCY_WARDS_SEED, merged_cw)

    # senatorial-district-lgas additions
    sd_source = f"inec_{state}_sd_worksheet"
    sd_rows = apply_mod.load_seed(apply_mod.SENATORIAL_LGAS_SEED)
    merged_sd = apply_mod.apply_senatorial_additions(
        sd_rows, senatorial_additions, source=sd_source, source_url=source_url
    )
    apply_mod.write_seed(apply_mod.SENATORIAL_LGAS_SEED, merged_sd)

    added_cw = len(merged_cw) - len(cw_rows)
    added_sd = len(merged_sd) - len(sd_rows)
    print(f"\nApplied: +{added_cw} constituency-ward rows, +{added_sd} senatorial-lga rows.")

    migration = apply_mod.emit_corrections_migration(report.conflicts)
    if migration:
        print(
            "\nConflicts detected — corrections migration SQL "
            "(review + place under prisma/migrations manually):\n"
        )
        print(migration)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
