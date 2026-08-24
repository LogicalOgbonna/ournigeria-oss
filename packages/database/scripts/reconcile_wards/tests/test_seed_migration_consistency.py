"""The seed and the corrections migrations must not contradict each other.

A correction is applied in two halves: a migration DELETEs the stale
``(constituency_code, ward_code)`` row from ``constituency_wards``, and the seed
carries the corrected row so ``sync-admin-hierarchy.mjs`` upserts it. The seed
is upsert-only and re-runnable, so if a deleted pair is *left* in the seed the
next sync silently re-adds it and undoes the migration — leaving the ward mapped
to two constituencies of the same tier.

That regression shipped once (the ABIA/KANO/BORNO pilot left all 31 deleted
pairs in the seed), so it is pinned here. Pure file reads — no DB needed.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).resolve().parents[3] / "prisma" / "migrations"
SEED = (
    Path(__file__).resolve().parents[3]
    / "seed"
    / "structure"
    / "constituency-wards.json"
)

_DELETE_RE = re.compile(
    r"DELETE FROM constituency_wards WHERE ward_code = '([^']+)' "
    r"AND constituency_code = '([^']+)'",
    re.IGNORECASE,
)


def _deleted_pairs() -> set[tuple[str, str]]:
    """Every (constituency_code, ward_code) any migration deletes."""
    pairs: set[tuple[str, str]] = set()
    for sql in MIGRATIONS_DIR.glob("*/migration.sql"):
        for ward_code, constituency_code in _DELETE_RE.findall(sql.read_text()):
            pairs.add((constituency_code, ward_code))
    return pairs


def _seed_pairs() -> set[tuple[str, str]]:
    return {
        (row["constituency_code"], row["ward_code"])
        for row in json.loads(SEED.read_text())
    }


def test_seed_does_not_readd_migration_deleted_mappings():
    resurrected = sorted(_deleted_pairs() & _seed_pairs())
    assert resurrected == [], (
        "these constituency-ward pairs are deleted by a migration but still "
        f"present in the seed, so the next sync would undo the correction: {resurrected}"
    )


def test_corrections_migration_is_actually_parsed():
    """Guard the regex: if the DELETE shape changes, the test above must not
    silently pass by finding nothing."""
    assert len(_deleted_pairs()) >= 31


def test_seed_has_no_duplicate_pairs():
    rows = json.loads(SEED.read_text())
    pairs = [(r["constituency_code"], r["ward_code"]) for r in rows]
    assert len(pairs) == len(set(pairs))
