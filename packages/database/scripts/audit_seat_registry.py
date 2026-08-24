"""Compare the seed's constituency registry against a live database export.

    # 1. export the live registry (any environment)
    psql "$DATABASE_URL" -At -F '|' \
      -c "select c.code, c.name, c.type, c.state_code,
                 (select count(*) from official_positions p
                    where p.constituency_code = c.code and p.status = 'active'),
                 (select count(*) from constituency_wards w
                    where w.constituency_code = c.code)
          from nigerian_constituencies c order by c.code" > /tmp/registry.txt

    # 2. classify the divergence
    python3 audit_seat_registry.py --export /tmp/registry.txt

Why this is read-only and never auto-adopts: the two registries disagree in
BOTH directions and neither is authoritative. Kano is the clearest case — the
seed carries standalone `Bagwai`, `Garun Mallam`, `Kunchi` and `Shanono` seats
while the live table instead carries `Shanono/Bagwai`, `Ungogo`, `Warawa` and
`Wudil`, the last three with no sitting member. Adopting either side wholesale
would invent seats. Only the INEC state-constituency worksheet settles it, so
this script produces the worklist that the worksheet pass consumes.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from difflib import get_close_matches
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parent.parent / "seed" / "structure"


def load_export(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text().splitlines():
        if line.count("|") < 5:
            continue
        code, name, typ, state, reps, wards = line.split("|")[:6]
        rows.append(
            {
                "code": code,
                "name": name,
                "type": typ,
                "state_code": state,
                "reps": int(reps or 0),
                "wards": int(wards or 0),
            }
        )
    return rows


def classify(seed: list[dict], live: list[dict]) -> dict:
    seed_by_code = {c["code"]: c for c in seed}
    live_by_code = {c["code"]: c for c in live}
    seed_names: dict[str, list[str]] = {}
    for c in seed:
        seed_names.setdefault(c["state_code"], []).append(c["name"])

    live_only = []
    for c in live:
        if c["code"] in seed_by_code:
            continue
        near = get_close_matches(c["name"], seed_names.get(c["state_code"], []), n=2, cutoff=0.8)
        if near:
            verdict = "probable_duplicate_of_seed_seat"
        elif c["reps"] == 0 and c["wards"] == 0:
            verdict = "unverified_no_member_no_wards"
        else:
            verdict = "live_seat_absent_from_seed"
        live_only.append({**c, "verdict": verdict, "nearest_seed_seat": near})

    seed_only = [
        {**c, "verdict": "seed_seat_absent_from_live"}
        for c in seed
        if c["code"] not in live_by_code
    ]

    # Same code, different name: invisible to a code-only diff, and the most
    # dangerous kind — a name-driven pass reads one spelling, the site shows the
    # other (seed `Kanam I` vs live `Kantana`).
    renamed = [
        {
            "code": c["code"],
            "state_code": c["state_code"],
            "seed_name": seed_by_code[c["code"]]["name"],
            "live_name": c["name"],
        }
        for c in live
        if c["code"] in seed_by_code
        and c["name"].strip().lower() != seed_by_code[c["code"]]["name"].strip().lower()
    ]

    return {"live_only": live_only, "seed_only": seed_only, "renamed": renamed}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--export", type=Path, required=True, help="pipe-delimited live registry export")
    ap.add_argument("--report", type=Path, help="write the full classification as JSON")
    args = ap.parse_args()

    seed = json.loads((SEED_DIR / "constituencies.json").read_text())
    live = load_export(args.export)
    result = classify(seed, live)

    print(f"seed: {len(seed)} seats   live: {len(live)} seats\n")
    print(f"live-only: {len(result['live_only'])}")
    for verdict, n in Counter(r["verdict"] for r in result["live_only"]).most_common():
        print(f"  {verdict:<36} {n:>4}")
    print(f"\nseed-only: {len(result['seed_only'])}")
    print(f"same code, different name: {len(result['renamed'])}")
    for r in result["renamed"]:
        print(f"  {r['code']:<34} seed={r['seed_name']!r:<18} live={r['live_name']!r}")

    if args.report:
        args.report.write_text(json.dumps(result, indent=2) + "\n")
        print(f"\nReport written to {args.report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
