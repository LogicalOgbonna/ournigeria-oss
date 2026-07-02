"""LGA-scoped, fuzzy, ambiguity-safe name resolvers.

Uses stdlib :mod:`difflib` (``SequenceMatcher``) for fuzzy scoring and reuses
``ward_utils.normalize_name`` for the canonical normalization already applied to
the seed. The matcher NEVER auto-picks when the top-2 candidates fall within the
ambiguity gap — those go to the human residual worklist.
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass
from difflib import SequenceMatcher

# Reuse the existing normalizer (scripts dir is put on sys.path by conftest, but
# add it defensively so match.py works when imported outside pytest).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ward_utils import normalize_name  # noqa: E402

AMBIGUITY_GAP = 0.08  # if top-2 scores within this, treat as ambiguous
ACCEPT = 0.86  # min score to accept a fuzzy match

# Directional / positional suffixes that turn an LGA name into a constituency
# name (e.g. "Ohafia North" -> "Ohafia").
_DIRECTIONS = {"north", "south", "east", "west", "central"}

# roman numeral -> arabic, applied as whole-token replacements after normalize.
_ROMAN = [("iii", "3"), ("ii", "2"), ("iv", "4"), ("i", "1"), ("v", "5")]


@dataclass
class Match:
    code: str | None
    score: float
    needs_review: bool
    candidate: str | None = None


def _roman_to_arabic(s: str) -> str:
    for roman, arabic in _ROMAN:
        s = re.sub(rf"\b{roman}\b", arabic, s)
    return s


def _norm(s: str) -> str:
    return _roman_to_arabic(normalize_name(s))


def match_one(name: str, candidates: list[tuple[str, str]]) -> Match:
    """Resolve ``name`` against ``[(code, candidate_name), ...]``.

    Returns a :class:`Match`. ``needs_review`` is True (and ``code`` None) when
    nothing clears ``ACCEPT`` or when the top two candidates are within
    ``AMBIGUITY_GAP`` of each other.
    """
    target = _norm(name)
    scored = sorted(
        (
            (SequenceMatcher(None, target, _norm(cn)).ratio(), code, cn)
            for code, cn in candidates
        ),
        key=lambda t: t[0],
        reverse=True,
    )
    if not scored:
        return Match(None, 0.0, True)
    top = scored[0]
    second = scored[1] if len(scored) > 1 else (0.0, None, None)
    if top[0] == 1.0:
        return Match(top[1], 1.0, False, top[2])
    if top[0] >= ACCEPT and (top[0] - second[0]) > AMBIGUITY_GAP:
        return Match(top[1], top[0], False, top[2])
    return Match(None, top[0], True, top[2])  # unmatched or ambiguous → review


# ---------------------------------------------------------------------------
# Constituency -> LGA resolution
# ---------------------------------------------------------------------------

_LGA_HQ_RE = re.compile(r"(.+?)\s+lga\s*hq", re.IGNORECASE)


def _strip_direction(name: str) -> str:
    """Drop a trailing directional token: 'Ohafia North' -> 'Ohafia'."""
    toks = normalize_name(name).split()
    while toks and toks[-1] in _DIRECTIONS:
        toks.pop()
    return " ".join(toks)


def _collation_lga_hints(collation: str | None) -> list[str]:
    """Extract candidate LGA-name tails from a collation-centre string.

    Collation strings commonly look like ``"Aba Town Hall Aba South LGA HQ"`` or
    ``"Council Hall, Ohafia LGA HQ"`` — the token(s) immediately before "LGA HQ"
    name the LGA, but a variable number of venue words precede it. Returns the
    trailing 1..3-word windows (longest first) so the caller can fuzzy-match each
    and keep the best LGA hit. Empty list when no "LGA HQ" marker is present.
    """
    if not collation:
        return []
    m = _LGA_HQ_RE.search(collation)
    if not m:
        return []
    chunk = m.group(1).strip().rstrip(".,")
    if "," in chunk:
        chunk = chunk.split(",")[-1].strip()
    toks = chunk.split()
    if not toks:
        return []
    return [" ".join(toks[-n:]) for n in (3, 2, 1) if n <= len(toks)]


def resolve_constituency_lga(
    parsed_sc,
    districts,
    state_lgas: list[tuple[str, str]],
    state: str,
) -> str | None:
    """Derive the LGA code an SC state-constituency sits in.

    Strategy (in order):
      1. Match the constituency name (minus a directional suffix) against the
         state's LGAs, scoped to LGAs that appear in the SD/FC composition.
      2. Fall back to the LGA hinted by the collation-centre string.
      3. Fall back to an unscoped name match.

    Returns the LGA ``code`` or None if unresolved.
    """
    # LGAs that are part of this state's senatorial districts (the valid scope).
    composed = {normalize_name(l) for d in districts for l in d.lgas}
    scoped = [
        (code, lname)
        for code, lname in state_lgas
        if normalize_name(lname) in composed
    ] or list(state_lgas)

    # 1a. full constituency name against scoped LGAs (some SC names ARE the LGA
    # name in full, e.g. "Isiala Ngwa North", "Ukwa East").
    m = match_one(parsed_sc.name, scoped)
    if m.code is not None:
        return m.code

    # 1b. name minus a directional suffix ("Ohafia North" -> "Ohafia").
    base = _strip_direction(parsed_sc.name)
    if base and base != normalize_name(parsed_sc.name):
        m = match_one(base, scoped)
        if m.code is not None:
            return m.code

    # 2. collation LGA-HQ hint: try each trailing window, best confident hit wins
    best: tuple[float, str] | None = None
    for hint in _collation_lga_hints(parsed_sc.collation):
        for pool in (scoped, state_lgas):
            m = match_one(hint, pool)
            if m.code is not None and (best is None or m.score > best[0]):
                best = (m.score, m.code)
    if best is not None:
        return best[1]

    # 3. unscoped name match as last resort
    if base:
        m = match_one(base, state_lgas)
        if m.code is not None:
            return m.code
    return None
