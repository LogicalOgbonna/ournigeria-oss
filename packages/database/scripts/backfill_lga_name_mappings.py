"""Backfill ward -> state-constituency mappings derivable from seat names.

    python3 backfill_lga_name_mappings.py            # dry run: prints the plan
    python3 backfill_lga_name_mappings.py --apply    # merges into the seed

Reads only the structure seed, writes only `constituency-wards.json`. The rules
and every refusal live in `lga_name_backfill.py`; this file is IO and reporting.
Rows are tagged `source=inec_lga_name_backfill` so the whole pass is reversible
by provenance.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from lga_name_backfill import plan_backfill
from reconcile_wards.apply import apply_additions, load_seed, write_seed

SEED_DIR = Path(__file__).resolve().parent.parent / "seed" / "structure"
CONSTITUENCY_WARDS = SEED_DIR / "constituency-wards.json"
SOURCE = "inec_lga_name_backfill"
# The seat names this pass reads come from INEC's nationwide constituency list;
# the LGA/ward sides come from our own INEC-delineated tables.
SOURCE_URL = (
    "https://www.inecnigeria.org/wp-content/uploads/2019/02/"
    "Name-of-Senatorial-DistrictsFederal-and-State-Constituencies-Nationwide-1.xls"
)


def _read(name: str) -> list[dict]:
    return json.loads((SEED_DIR / name).read_text())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true", help="write the additions into the seed")
    ap.add_argument("--report", type=Path, help="write the full plan as JSON")
    args = ap.parse_args()

    constituencies = _read("constituencies.json")
    lgas = _read("lgas.json")
    wards = _read("wards.json")
    existing = load_seed(CONSTITUENCY_WARDS)

    plan = plan_backfill(constituencies, lgas, wards, existing)

    by_rule = Counter(m["rule"] for m in plan.mapped_lgas)
    by_reason = Counter(r["reason"] for r in plan.refused)

    print(f"\nMapped {plan.ward_count} wards across {len(plan.mapped_lgas)} LGAs")
    for rule, n in sorted(by_rule.items()):
        wards_for_rule = sum(m["wards"] for m in plan.mapped_lgas if m["rule"] == rule)
        print(f"  {rule:<16} {n:>4} LGAs  {wards_for_rule:>5} wards")

    print(f"\nRefused {len(plan.refused)} LGAs")
    for reason, n in sorted(by_reason.items(), key=lambda kv: -kv[1]):
        print(f"  {reason:<38} {n:>4}")

    for row in plan.refused:
        if row["reason"] == "multiple_seats_claim_this_lga":
            print(f"\n  AMBIGUOUS: {row['lga']} ({row['lga_code']}) claimed by {row['seats']}")

    if args.report:
        args.report.write_text(
            json.dumps(
                {
                    "source": SOURCE,
                    "wards_mapped": plan.ward_count,
                    "mapped_lgas": plan.mapped_lgas,
                    "refused": plan.refused,
                },
                indent=2,
            )
            + "\n"
        )
        print(f"\nReport written to {args.report}")

    if not args.apply:
        print("\nDry run. Re-run with --apply to write the seed.")
        return 0

    merged = apply_additions(existing, plan.additions, SOURCE, SOURCE_URL)
    added = len(merged) - len(existing)
    write_seed(CONSTITUENCY_WARDS, merged)
    print(f"\nSeed updated: {len(existing)} -> {len(merged)} rows (+{added}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
