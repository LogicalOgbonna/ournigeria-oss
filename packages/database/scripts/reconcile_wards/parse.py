import re
from dataclasses import dataclass, field


@dataclass
class ParsedConstituency:
    name: str
    code_label: str
    wards: list[str]
    ra_count: int | None
    collation: str | None = None


@dataclass
class ParsedDistrict:
    name: str
    code_label: str
    lgas: list[str] = field(default_factory=list)
    collation: str | None = None


_CODE_RE = re.compile(r"((?:SD|FC|SC)/\d+/[A-Z]{2})")


def _clean_name(raw: str) -> tuple[str, str]:
    """Split a raw NAME&CODE cell into (name, code_label).

    Handles the two junk shapes seen in INEC workbooks:
    embedded newlines (`Aba Central \\n\\n\\n\\nSC/03/AB`) and repeated
    slashes (`... ////SC/0x/AB`).
    """
    raw = (raw or "").replace("\n", " ")
    m = _CODE_RE.search(raw)
    code = m.group(1) if m else ""
    name = _CODE_RE.sub("", raw)
    name = re.sub(r"[/]{2,}", " ", name)  # strip '////' junk
    return re.sub(r"\s+", " ", name).strip(), code


def _as_int(value) -> int | None:
    return int(value) if str(value).strip().isdigit() else None


def parse_sc_rows(rows: list[list]) -> list[ParsedConstituency]:
    """Parse an SC sheet: one row per state constituency.

    Columns: [S/N, NAME&CODE, RA COMPOSITION (comma-joined wards),
    NO OF RAs, NO OF PUs, COLLATION CENTRE]. Header / spacer / total
    rows (non-numeric S/N) are skipped.
    """
    out: list[ParsedConstituency] = []
    for r in rows:
        if not r or r[0] is None or not str(r[0]).strip().isdigit():
            continue  # header/spacer/total rows
        name, code = _clean_name(str(r[1]) if len(r) > 1 else "")
        comp = str(r[2]) if len(r) > 2 and r[2] else ""
        wards = [w.strip() for w in comp.split(",") if w.strip()]
        ra = _as_int(r[3]) if len(r) > 3 and r[3] is not None else None
        collation = str(r[5]).strip() if len(r) > 5 and r[5] else None
        out.append(ParsedConstituency(name, code, wards, ra, collation))
    return out


def parse_lga_rows(rows: list[list]) -> list[ParsedDistrict]:
    """Parse an SD/FC sheet: one row per LGA, merged S/N + district-name cells.

    Columns: [S/N, NAME&CODE, LGA COMPOSITION, NO OF RAs, NO OF PUs,
    COLLATION CENTRE]. The district name/code appear only on the first LGA
    row of each district; subsequent LGA rows carry None there, so the
    current district is carried forward. `TOTAL` rows are skipped; header
    rows (non-numeric S/N and no active district) are skipped.
    """
    out: list[ParsedDistrict] = []
    current: ParsedDistrict | None = None
    for r in rows:
        if not r:
            continue
        sn = r[0] if len(r) > 0 else None
        name_cell = str(r[1]) if len(r) > 1 and r[1] else ""

        # Start of a new district: numeric S/N + a name cell carrying a code.
        if sn is not None and str(sn).strip().isdigit() and name_cell:
            name, code = _clean_name(name_cell)
            collation = str(r[5]).strip() if len(r) > 5 and r[5] else None
            current = ParsedDistrict(name, code, [], collation)
            out.append(current)

        # LGA row (may be the first row of the district or a carried-forward one).
        lga = str(r[2]).strip() if len(r) > 2 and r[2] else ""
        if not lga or lga.upper() == "TOTAL":
            continue
        # Skip the header row's literal "LGA COMPOSITION" label.
        if lga.upper() == "LGA COMPOSITION":
            continue
        if current is not None:
            current.lgas.append(lga)
    return out
