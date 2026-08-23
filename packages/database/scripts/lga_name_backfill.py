"""Derive ward -> state-constituency mappings from constituency NAMES alone.

The original ``inec_exact_lga`` pass mapped a state constituency to every ward
of an LGA only when the constituency name was *exactly* the LGA name. That
missed two shapes, leaving ~600 wards with no state constituency at all:

  * an LGA whose seat is named after it but was simply never mapped
    (Kano ``Wudil``, Rivers ``Omuma``, Bauchi ``Shira``);
  * a seat covering several whole LGAs, named ``A/B``
    (Oyo ``Saki East/Atisbo``, Osun ``Irewole/Isokan``).

Both are recoverable with no new source data: the seat names the LGAs it
covers, and an LGA's wards are wholly inside it. What is NOT recoverable this
way is an LGA split into numbered seats (``Ikom I`` / ``Ikom II``) — which of
Ikom's 11 wards sits in which is a fact only INEC's RA composition list holds.
Those LGAs are deliberately refused here and left to the reconcile_wards
worksheet pipeline.

Everything in this module is pure: seed lists in, plan out. No DB, no IO.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# A trailing ordinal OR compass direction means the LGA is split across seats.
# `Balanga North`/`Balanga South` is exactly as unresolvable as `Ikom I`/`Ikom II`
# — 669 wards sat in the "no name match" bucket purely because the first version
# of this only knew about numerals.
_SPLIT_SUFFIXES = (
    # Longest first only matters for readability; every candidate is tried.
    "north east", "north west", "south east", "south west",
    "north", "south", "east", "west", "central",
    "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
)
_TRAILING_DIGITS = re.compile(r"^(?P<stem>.+?)\s+\d+$")


def split_stems(key: str) -> list[str]:
    """Every parent name a seat name could be a split of.

    `Afikpo South West` yields BOTH `Afikpo South` and `Afikpo` — the first is
    the real LGA. Returning only the shortest stem (which a single non-greedy
    regex does) silently misses compass-compound splits, so all candidates are
    offered and the caller decides which resolves.
    """
    stems = [key[: -(len(suf) + 1)] for suf in _SPLIT_SUFFIXES if key.endswith(f" {suf}")]
    m = _TRAILING_DIGITS.match(key)
    if m:
        stems.append(m.group("stem"))
    return stems

# LGA name -> the spelling the seat register uses, keyed by (state, normalised LGA).
# Every entry is a deliberate, sourced decision. There is NO similarity threshold
# here on purpose: Yobe has both a `Yusufari` LGA and a `Yunusari` LGA, and any
# fuzzy matcher rates them a near-pair — mapping one LGA's wards to the other's
# seat and telling those citizens the wrong person represents them, silently.
# A curated table can only be wrong where a human wrote it down.
SEAT_NAME_ALIASES: dict[tuple[str, str], str] = {
    # Seat register drops the first "n": LGA Atakunmosa, seat Atakumosa.
    ("osun", "atakunmosa east"): "atakumosa east",
    ("osun", "atakunmosa west"): "atakumosa west",
    # Seat register spells it Maduri; the LGA table uses Madori.
    ("jigawa", "malam madori"): "malam maduri",
    # "Egbado" is the pre-1995 name; the seat register uses the current "Yewa".
    ("ogun", "yewa egbado south"): "yewa south",
    ("ogun", "yewa egbado north"): "yewa north",
    # MC = Metropolitan Council, the LGA's formal suffix.
    ("borno", "maiduguri"): "maiduguri mc",
    # Seat register writes the LGA's double-barrelled name with a slash.
    ("rivers", "abua odual"): "abua/odual",
    # Seat register drops the "l": LGA Yalmaltu Deba, seat Yamaltu.
    ("gombe", "yalmaltu deba"): "yamaltu",
    # Seat register doubles the "g": LGA Nasarawa Egon, seat Nasarawa Eggon.
    ("nasarawa", "nasarawa egon"): "nasarawa eggon",
}


def aliased(state_code: str, lga_name: str) -> str:
    """The seat-register spelling of an LGA name, or the name unchanged."""
    return SEAT_NAME_ALIASES.get((state_code, norm(lga_name)), norm(lga_name))


def norm(value: str) -> str:
    """Strict name key. Case, hyphen/space and repeated whitespace only.

    Deliberately NOT the fuzzy `ward_utils.normalize_name` — that flattens "/"
    into a space, and "/" is the structural separator this module reads. Any
    looser matching (spelling drift like `Atakunmosa` vs `Atakumosa`) is a
    separate, human-gated pass; a wrong guess here tells a citizen the wrong
    person represents them.
    """
    return " ".join(value.strip().lower().replace("-", " ").replace("’", "'").split())


@dataclass
class Claim:
    """One state constituency asserting it covers a whole LGA."""

    constituency_code: str
    lga_code: str
    rule: str  # exact | merged | merged_prefix
    split: bool = False  # numbered seat => ambiguous, never auto-mappable


@dataclass
class BackfillPlan:
    additions: list[tuple[str, str, str]] = field(default_factory=list)
    mapped_lgas: list[dict] = field(default_factory=list)
    refused: list[dict] = field(default_factory=list)

    @property
    def ward_count(self) -> int:
        return len(self.additions)


def _merged_parts(name: str) -> list[tuple[str, ...]]:
    """Split an ``A/B`` seat name into per-part LGA-name candidates.

    Each part yields its candidates in priority order. The bare part always
    comes first; a shared prefix borrowed from the head is only ever a fallback:

        ``Saki East/Atisbo``      -> [("Saki East",), ("Atisbo", "Saki Atisbo")]
        ``Ibarapa Central/North`` -> [("Ibarapa Central",), ("North", "Ibarapa North")]

    So ``Atisbo`` (a real LGA) resolves on its own, while ``North`` (not an LGA)
    falls through to ``Ibarapa North``. Trying the bare name first is what keeps
    a two-LGA seat from being read as one prefixed LGA.
    """
    raw = [p.strip() for p in name.split("/") if p.strip()]
    if len(raw) < 2:
        return []
    head_tokens = raw[0].split()
    prefix = " ".join(head_tokens[:-1]) if len(head_tokens) > 1 else ""
    out: list[tuple[str, ...]] = [(raw[0],)]
    for part in raw[1:]:
        out.append((part, f"{prefix} {part}") if prefix else (part,))
    return out


def collect_claims(constituencies: list[dict], lgas: list[dict]) -> list[Claim]:
    """Every (state constituency -> whole LGA) claim readable from names."""
    lga_by_state: dict[str, dict[str, str]] = {}
    for lga in lgas:
        key = aliased(lga["state_code"], lga["name"])
        lga_by_state.setdefault(lga["state_code"], {})[key] = lga["code"]

    claims: list[Claim] = []
    for c in constituencies:
        if c.get("type") != "state":
            continue
        in_state = lga_by_state.get(c["state_code"], {})
        key = norm(c["name"])

        if key in in_state:
            claims.append(Claim(c["code"], in_state[key], "exact"))
            continue

        parts = _merged_parts(c["name"])
        if parts:
            resolved: list[str | None] = []
            borrowed = False
            for candidates in parts:
                hit = next((in_state[norm(x)] for x in candidates if norm(x) in in_state), None)
                if hit and norm(candidates[0]) not in in_state:
                    borrowed = True
                resolved.append(hit)
            if all(resolved) and len(set(resolved)) == len(resolved):
                rule = "merged_prefix" if borrowed else "merged"
                for lga_code in resolved:
                    claims.append(Claim(c["code"], lga_code, rule))  # type: ignore[arg-type]
            continue

        # `Ikom I` / `Balanga North` — claims the LGA, but only ambiguously.
        for stem in split_stems(key):
            if stem in in_state:
                claims.append(Claim(c["code"], in_state[stem], "split", split=True))
                break

    return claims


def plan_backfill(
    constituencies: list[dict],
    lgas: list[dict],
    wards: list[dict],
    existing_mappings: list[dict],
) -> BackfillPlan:
    """Decide, per LGA, whether its wards can be assigned by name alone.

    An LGA qualifies only when exactly one non-split state constituency claims
    it, nothing already maps any of its wards to a different state seat, and no
    numbered variant of its name exists. Everything else is refused with a
    reason so the residue is auditable rather than silently dropped.
    """
    state_codes = {c["code"] for c in constituencies if c.get("type") == "state"}
    wards_by_lga: dict[str, list[str]] = {}
    for w in wards:
        wards_by_lga.setdefault(w["lga_code"], []).append(w["code"])

    # Which state seat, if any, already owns each ward.
    owner: dict[str, str] = {}
    for row in existing_mappings:
        if row["constituency_code"] in state_codes:
            owner[row["ward_code"]] = row["constituency_code"]

    by_lga: dict[str, list[Claim]] = {}
    for claim in collect_claims(constituencies, lgas):
        by_lga.setdefault(claim.lga_code, []).append(claim)

    lga_name = {l["code"]: l["name"] for l in lgas}
    plan = BackfillPlan()

    for lga_code, claims in sorted(by_lga.items()):
        def refuse(reason: str, **extra):
            plan.refused.append(
                {"lga_code": lga_code, "lga": lga_name.get(lga_code, lga_code), "reason": reason, **extra}
            )

        if any(c.split for c in claims):
            refuse(
                "lga_split_across_seats",
                seats=sorted({c.constituency_code for c in claims if c.split}),
            )
            continue

        seats = sorted({c.constituency_code for c in claims})
        if len(seats) > 1:
            refuse("multiple_seats_claim_this_lga", seats=seats)
            continue

        seat = seats[0]
        lga_wards = wards_by_lga.get(lga_code, [])
        if not lga_wards:
            refuse("no_wards_in_seed", seats=seats)
            continue

        foreign = sorted({owner[w] for w in lga_wards if owner.get(w) not in (None, seat)})
        if foreign:
            refuse("wards_already_owned_by_another_seat", seats=seats, existing=foreign)
            continue

        new_wards = [w for w in lga_wards if w not in owner]
        if not new_wards:
            refuse("already_fully_mapped", seats=seats)
            continue

        rule = claims[0].rule
        for ward_code in sorted(new_wards):
            plan.additions.append((seat, ward_code, "medium"))
        plan.mapped_lgas.append(
            {
                "lga_code": lga_code,
                "lga": lga_name.get(lga_code, lga_code),
                "constituency_code": seat,
                "rule": rule,
                "wards": len(new_wards),
            }
        )

    return plan
