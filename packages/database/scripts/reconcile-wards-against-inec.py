#!/usr/bin/env python3

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from ward_utils import normalize_official_lga, normalize_seed_lga


ROOT = Path("/Users/arinzeogbonna/Work/personal/spending")
SEED_DIR = ROOT / "packages/database/seed"
WARDS_FILE = SEED_DIR / "wards.json"
OFFICIAL_COUNTS_FILE = SEED_DIR / "inec-ward-ra-official-counts.json"
OVERVIEW_FILE = SEED_DIR / "inec-ward-ra-reconciliation-report.json"
OVERFLOW_FILE = SEED_DIR / "wards-overflow.json"


def load_official_counts() -> dict[str, dict[str, int]]:
    data = json.loads(OFFICIAL_COUNTS_FILE.read_text())
    normalized: dict[str, dict[str, int]] = {}
    for state, lgas in data["counts"].items():
        normalized[state] = {
            normalize_official_lga(state, lga_name): count
            for lga_name, count in lgas.items()
        }
    return normalized


def state_from_lga_code(lga_code: str) -> str:
    if lga_code.startswith("akwa_ibom_"):
        return "akwa_ibom"
    if lga_code.startswith("cross_river_"):
        return "cross_river"
    return lga_code.split("_")[0]


def main() -> int:
    wards = json.loads(WARDS_FILE.read_text())
    official_counts = load_official_counts()

    remaining: dict[tuple[str, str], int] = {}
    for state, counts in official_counts.items():
        for lga, count in counts.items():
            remaining[(state, lga)] = count

    kept = []
    overflow = []
    kept_counter = Counter()
    overflow_counter = Counter()

    for ward in wards:
        state = state_from_lga_code(ward["lga_code"])
        lga_norm = normalize_seed_lga(state, ward["lga_code"])
        key = (state, lga_norm)
        capacity = remaining.get(key)

        if capacity is None:
            kept.append(ward)
            kept_counter[key] += 1
            continue

        if capacity > 0:
            kept.append(ward)
            remaining[key] = capacity - 1
            kept_counter[key] += 1
        else:
            overflow_item = dict(ward)
            overflow_item["overflow_reason"] = "exceeds INEC RA count"
            overflow.append(overflow_item)
            overflow_counter[key] += 1

    WARDS_FILE.write_text(json.dumps(kept, indent=2) + "\n")
    OVERFLOW_FILE.write_text(json.dumps(overflow, indent=2) + "\n")

    report = {
        "source": "https://www.inecnigeria.org/electoral-constituencies-of-the-federation/",
        "seed_total": len(wards),
        "reconciled_total": len(kept),
        "removed": len(overflow),
        "states": [],
    }

    for state in sorted(official_counts):
        official_total = sum(official_counts[state].values())
        kept_total = sum(
            count
            for (s, _), count in kept_counter.items()
            if s == state
        )
        removed_total = sum(
            count
            for (s, _), count in overflow_counter.items()
            if s == state
        )
        mismatched_lgas = []
        for lga, official in sorted(official_counts[state].items()):
            kept_count = kept_counter.get((state, lga), 0)
            removed_count = overflow_counter.get((state, lga), 0)
            if kept_count != official:
                mismatched_lgas.append(
                    {
                        "lga": lga,
                        "official": official,
                        "kept": kept_count,
                        "removed": removed_count,
                        "delta": kept_count - official,
                    }
                )

        report["states"].append(
            {
                "state": state,
                "official_total": official_total,
                "kept_total": kept_total,
                "removed_total": removed_total,
                "delta": kept_total - official_total,
                "mismatched_lgas": mismatched_lgas,
            }
        )

    OVERVIEW_FILE.write_text(json.dumps(report, indent=2) + "\n")

    print(f"Wrote {WARDS_FILE} (kept {len(kept)} entries, removed {len(overflow)})")
    print(f"Wrote overflow file {OVERFLOW_FILE}")
    print(f"Wrote reconciliation report {OVERVIEW_FILE}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
