"""Read-only snapshots of the administrative hierarchy, for matching.

Sourced from the structure seed, NOT a live database. Three reasons:

1. **The seed is what this pipeline writes.** Proposals are merged into
   `constituency-wards.json`; matching against anything else means proposing
   against one world and applying to another.
2. **The live registry is not authoritative.** `audit_seat_registry.py` finds
   156 seats present live but not in the seed, 33 the other way, and 5 sharing
   a code under two different names (`state_plateau_kanam` is `Kanam I` in the
   seed and `Kantana` live). Matching against that is matching against noise.
3. **It runs anywhere.** The previous version shelled to `docker exec
   ournigeria_db psql`, so the pipeline needed a specific local container to be
   up. That single line is why this work kept stalling, and why none of it could
   run in CI.

Set `RECONCILE_SEED_DIR` to point at a different seed tree (used by tests).
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

from .paths import SEED_DIR


def _seed_dir() -> Path:
    override = os.environ.get("RECONCILE_SEED_DIR")
    return Path(override) if override else SEED_DIR


@lru_cache(maxsize=None)
def _load(name: str, seed_dir: str) -> tuple:
    return tuple(json.loads((Path(seed_dir) / name).read_text()))


def _rows(name: str) -> tuple:
    return _load(name, str(_seed_dir()))


def _lga_codes(state: str) -> set[str]:
    return {l["code"] for l in _rows("lgas.json") if l["state_code"] == state}


def wards_by_lga(state: str) -> dict[str, list[tuple[str, str]]]:
    """{ lga_code: [(ward_code, ward_name), ...] } for a state."""
    in_state = _lga_codes(state)
    out: dict[str, list[tuple[str, str]]] = {}
    for w in _rows("wards.json"):
        if w["lga_code"] in in_state:
            out.setdefault(w["lga_code"], []).append((w["code"], w["name"]))
    return out


def constituencies(state: str) -> list[tuple[str, str, str]]:
    """[(code, name, type), ...] for a state."""
    return [
        (c["code"], c["name"], c["type"])
        for c in _rows("constituencies.json")
        if c["state_code"] == state
    ]


def lgas(state: str) -> list[tuple[str, str]]:
    """[(code, name), ...] for a state."""
    return [
        (l["code"], l["name"]) for l in _rows("lgas.json") if l["state_code"] == state
    ]


def constituency_wards(state: str) -> list[tuple[str, str, str]]:
    """Existing (constituency_code, ward_code, constituency_type) rows for a state.

    Feeds the report's conflict check: a proposed (tier, ward) already mapped to
    a *different* constituency of the same tier is a conflict, not an addition.
    """
    types = {
        c["code"]: c["type"]
        for c in _rows("constituencies.json")
        if c["state_code"] == state
    }
    return [
        (m["constituency_code"], m["ward_code"], types[m["constituency_code"]])
        for m in _rows("constituency-wards.json")
        if m["constituency_code"] in types
    ]
