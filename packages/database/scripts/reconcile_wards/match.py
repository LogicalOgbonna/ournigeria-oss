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
import re
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

# Pure roman numerals 1..10 (lowercased, punctuation already stripped by
# normalize_name). Longest keys first so "iii" wins over "ii"/"i" on exact
# whole-token lookups (we do exact lookups, not substring, so order is moot but
# kept explicit).
_ROMAN_VALUE = {
    "i": 1,
    "ii": 2,
    "iii": 3,
    "iv": 4,
    "v": 5,
    "vi": 6,
    "vii": 7,
    "viii": 8,
    "ix": 9,
    "x": 10,
}


@dataclass
class Match:
    code: str | None
    score: float
    needs_review: bool
    candidate: str | None = None


def _numeral_value(tok: str) -> int | None:
    """Return the integer value of a *numeral variant* token, else None.

    Unifies the three ways a small ordinal shows up in Nigerian ward NAMES:

      * proper roman           -- ``i``, ``ii``, ``iii``, ``iv`` ...  (worksheet)
      * repeated-ones          -- ``1``, ``11``, ``111`` (DB stores II/III this
        way — literal repeated digit-1, NOT eleven/one-hundred-eleven)
      * mangled roman          -- ``1v`` / ``1x`` (a repeated-ones "1" fused onto
        the rest of a roman numeral, e.g. DB ``Bassambiri 1V`` == IV)

    Genuine multi-digit arabic (``10``, ``12``) is deliberately NOT collapsed:
    only tokens made entirely of the digit ``1`` are read as repeated-ones, so
    ``Ward 10`` / ``Mile 12`` keep their real value.
    """
    if not tok:
        return None
    # proper / mangled roman (``iv``, ``1v`` -> iv)
    roman = tok.replace("1", "i") if tok and tok[0] == "1" else tok
    if roman in _ROMAN_VALUE:
        # "1", "11", "111" become "i", "ii", "iii" -> repeated-ones handled here
        # too; but a lone-arabic "1" is also valid roman "i" == 1. Consistent.
        return _ROMAN_VALUE[roman]
    # repeated-ones beyond the roman table ("1111" == 4) -- all-ones only.
    if set(tok) == {"1"}:
        return len(tok)
    # plain single/double arabic that is a real number (leave 10/12 as-is; only
    # 1..10 map here so they can unify with roman I..X).
    if tok.isdigit():
        n = int(tok)
        return n if 1 <= n <= 10 else None
    return None


def _canonicalize_numerals(s: str) -> str:
    """Rewrite every standalone numeral-variant token to canonical bare arabic.

    Applied to BOTH sides before scoring so ``II`` == ``2`` == ``11`` (all -> the
    single-token ``"2"``). Bare arabic (no sentinel prefix) is used deliberately:
    a longer token (e.g. a ``#`` sentinel) inflates the character mass a numeral
    contributes to ``SequenceMatcher`` and drops fuzzy scores for names where a
    roman numeral is incidental (``Ezzagu I (Ogboji)`` vs DB ``Ezzagu Ogboji``).
    Distinct ordinals stay distinct because ``"1"`` != ``"2"``.
    """
    out = []
    for tok in s.split():
        val = _numeral_value(tok)
        out.append(str(val) if val is not None else tok)
    return " ".join(out)


def _norm(s: str) -> str:
    return _canonicalize_numerals(normalize_name(s))


# Worksheet seat name -> register seat name, keyed by (state, _norm(worksheet name)).
# Curated identities, each with its reason — NOT fuzzy repair. Without these the
# matcher reports a phantom conflict on every ward of the seat: the worksheet
# appears to dispute rows that are in fact the same seat under another name.
SEAT_NAME_SYNONYMS: dict[tuple[str, str], str] = {
    # Gbonyin LGA was formerly named Aiyekire; INEC's Ekiti worksheet still uses
    # the old name for the seat. Same seat, 10/10 wards.
    ("ekiti", "aiyekire"): "Gbonyin",
    # Ampersand long form of the register's slash form. Same merged seat.
    ("osun", "atakunmosa east and atakunmosa west"): "Atakumosa East/West",
    # Fully-spelled second half of the register's prefixed form. Same seat.
    ("oyo", "ibarapa central ibarapa north"): "Ibarapa Central/North",
}


def apply_seat_synonym(state: str, name: str) -> str:
    """The register spelling of a worksheet seat name, or the name unchanged."""
    return SEAT_NAME_SYNONYMS.get((state, _norm(name)), name)


_PAREN_RE = re.compile(r"^(?P<outside>[^()]*?)\s*\(\s*(?P<inside>[^()]+?)\s*\)\s*$")


def seat_name_variants(name: str) -> list[str]:
    """Candidate spellings of a worksheet seat name, most specific first.

    Several states annotate seats with a parenthetical alias — Adamawa writes
    ``Verre ( FUFORE II)``, Kwara ``Omupo/Igbaja (Ifelodun I)`` — where either
    half alone matches the register but the combined string matches nothing.
    393 residual wards traced back to exactly this. The full name is tried
    first so states without the quirk behave as before; the outside half next
    (the seat's own name); the inside half last (the register-style alias).
    """
    variants = [name]
    m = _PAREN_RE.match(name.strip())
    if m:
        outside, inside = m.group("outside").strip(), m.group("inside").strip()
        if outside:
            variants.append(outside)
        if inside:
            variants.append(inside)
    return variants


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


def resolve_constituency_lgas(
    parsed_sc,
    districts,
    state_lgas: list[tuple[str, str]],
    state: str,
    wards_by_lga: dict[str, list[tuple[str, str]]],
) -> list[str]:
    """Resolve the FULL set of LGA codes a state-constituency spans.

    Many state constituencies are contained in one LGA, but some span several
    (e.g. Aba Central draws wards from both Aba South and Aba North; the Ezza
    North East/West pair splits one LGA's wards across two constituencies whose
    wards sit in sibling LGAs). The single-LGA :func:`resolve_constituency_lga`
    can only scope ward matching to one LGA, forcing the sibling LGA's wards onto
    a fragile whole-state exact-only fallback (or into the residual worklist).

    This resolver returns the primary LGA PLUS every additional LGA that actually
    contains a *confident* (exact / ambiguity-safe fuzzy) match for one of the
    constituency's parsed ward names. Evidence-based expansion keeps it safe: an
    LGA is only added when its wards genuinely appear in the worksheet's ward
    list, so scoping stays tight (no whole-state blast radius) and the existing
    ACCEPT threshold + ambiguity gap continue to gate every ward match.

    Returns an ordered list (primary first, then discovered siblings). Empty when
    no LGA can be resolved at all.
    """
    primary = resolve_constituency_lga(parsed_sc, districts, state_lgas, state)
    ordered: list[str] = [primary] if primary else []
    seen: set[str] = set(ordered)

    # Evidence pass: for each LGA, does any of its wards confidently match one of
    # this constituency's parsed ward names? If so, the constituency spans it.
    for lga_code, candidates in wards_by_lga.items():
        if lga_code in seen or not candidates:
            continue
        hit = False
        for wname in parsed_sc.wards:
            m = match_one(wname, candidates)
            if m.code is not None and not m.needs_review:
                hit = True
                break
        if hit:
            ordered.append(lga_code)
            seen.add(lga_code)
    return ordered
