"""Read-only DB snapshots for matching.

Shells to the local docker Postgres (``ournigeria_db``) via ``psql`` and
returns plain Python structures. No ORM / driver dependency — the pipeline
only ever reads, and the deploy-run ``sync-admin-hierarchy.mjs`` is the sole
writer of the seed tables.
"""

from __future__ import annotations

import subprocess

_CONTAINER = "ournigeria_db"
_USER = "spending"
_DB = "spending"


def _psql(sql: str) -> list[list[str]]:
    """Run a read-only query, return tab-split rows (no header, no padding)."""
    out = subprocess.run(
        [
            "docker",
            "exec",
            _CONTAINER,
            "psql",
            "-U",
            _USER,
            "-d",
            _DB,
            "-At",
            "-F",
            "\t",
            "-c",
            sql,
        ],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [line.split("\t") for line in out.splitlines() if line]


def wards_by_lga(state: str) -> dict[str, list[tuple[str, str]]]:
    """{ lga_code: [(ward_code, ward_name), ...] } for a state."""
    rows = _psql(
        "SELECT l.code, w.code, w.name FROM nigerian_wards w "
        "JOIN nigerian_lgas l ON l.code=w.lga_code "
        f"WHERE l.state_code='{state}'"
    )
    d: dict[str, list[tuple[str, str]]] = {}
    for lga_code, w_code, w_name in rows:
        d.setdefault(lga_code, []).append((w_code, w_name))
    return d


def constituencies(state: str) -> list[tuple[str, str, str]]:
    """[(code, name, type), ...] for a state."""
    return [
        (r[0], r[1], r[2])
        for r in _psql(
            "SELECT code, name, type FROM nigerian_constituencies "
            f"WHERE state_code='{state}'"
        )
    ]


def lgas(state: str) -> list[tuple[str, str]]:
    """[(code, name), ...] for a state."""
    return [
        (r[0], r[1])
        for r in _psql(
            f"SELECT code, name FROM nigerian_lgas WHERE state_code='{state}'"
        )
    ]


def constituency_wards(state: str) -> list[tuple[str, str, str]]:
    """Existing (constituency_code, ward_code, constituency_type) rows for a state.

    Used by the report's conflict check: a proposed (tier, ward) already mapped
    to a *different* constituency is a conflict.
    """
    return [
        (r[0], r[1], r[2])
        for r in _psql(
            "SELECT cw.constituency_code, cw.ward_code, c.type "
            "FROM constituency_wards cw "
            "JOIN nigerian_constituencies c ON c.code=cw.constituency_code "
            f"WHERE c.state_code='{state}'"
        )
    ]
