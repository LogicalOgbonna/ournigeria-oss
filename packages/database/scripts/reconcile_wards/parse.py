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

# Header-label matchers (normalized: lowercased, whitespace-collapsed). INEC
# workbooks vary the exact spelling/spacing per state, so match fuzzily.
_NAME_RE = re.compile(r"name of (state )?constituenc", re.I)
_SEN_NAME_RE = re.compile(r"name of (senatorial|federal)", re.I)
_CODE_COL_RE = re.compile(r"^code$", re.I)
_RA_COMP_RE = re.compile(r"ra composition", re.I)
_RA_COUNT_RE = re.compile(r"no\.?\s*of\s*ras", re.I)
_LGA_COMP_RE = re.compile(r"lga composition", re.I)
_COLLATION_RE = re.compile(r"collation", re.I)


def _norm_header(cell) -> str:
    """Normalize a header cell for label matching (lowercase, collapse space)."""
    return re.sub(r"\s+", " ", str(cell or "").replace("\n", " ")).strip()


def _find_header(rows: list[list], *, comp_re: re.Pattern) -> int | None:
    """Locate the header row index.

    The header is the row whose cells carry both a NAME-of-constituency-ish
    label and a composition label (RA/LGA COMPOSITION). Returns the row index,
    or None if no such row is found (parser then falls back to fixed indices).
    """
    for i, r in enumerate(rows):
        if not r:
            continue
        cells = [_norm_header(c) for c in r]
        has_name = any(_NAME_RE.search(c) or _SEN_NAME_RE.search(c) for c in cells)
        has_comp = any(comp_re.search(c) for c in cells)
        if has_name and has_comp:
            return i
    return None


def _resolve_columns(header: list, *, comp_re: re.Pattern) -> dict[str, int | None]:
    """Map logical column roles to header indices via fuzzy label matching.

    ``code`` is optional (absent in ABIA-style sheets where the code is embedded
    in the name cell). Returns a dict with keys: name, code, comp, ra_count,
    collation. Unresolved roles are None.
    """
    cells = [_norm_header(c) for c in header]
    cols: dict[str, int | None] = {
        "name": None,
        "code": None,
        "comp": None,
        "ra_count": None,
        "collation": None,
    }
    for idx, c in enumerate(cells):
        if cols["name"] is None and (_NAME_RE.search(c) or _SEN_NAME_RE.search(c)):
            cols["name"] = idx
        # A standalone "CODE" column (not the "NAME ... & CODE" combined header).
        if cols["code"] is None and _CODE_COL_RE.search(c):
            cols["code"] = idx
        if cols["comp"] is None and comp_re.search(c):
            cols["comp"] = idx
        if cols["ra_count"] is None and _RA_COUNT_RE.search(c):
            cols["ra_count"] = idx
        if cols["collation"] is None and _COLLATION_RE.search(c):
            cols["collation"] = idx
    return cols


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


def _cell(r: list, idx: int | None):
    """Safe cell access: None when idx is None or out of range."""
    if idx is None or idx >= len(r):
        return None
    return r[idx]


def parse_sc_rows(rows: list[list]) -> list[ParsedConstituency]:
    """Parse an SC sheet: one row per state constituency.

    HEADER-DRIVEN: column positions are resolved from the header row's labels,
    not assumed fixed. This tolerates per-state layout variance — notably the
    presence (BORNO) or absence (ABIA) of a standalone ``CODE`` column, which
    shifts RA COMPOSITION and the counts right by one.

    - name column: /name of (state )?constituenc/i (or senatorial/federal)
    - code column: /^code$/i — OPTIONAL; when absent the ``SC/xx/YY`` code is
      extracted from the embedded name cell (ABIA-style).
    - ra-composition column: /ra composition/i (comma-joined wards)
    - ra-count column: /no.?\\s*of\\s*ras/i (count-check)
    - collation column: /collation/i

    Header / spacer / total rows (non-numeric S/N) are skipped. Falls back to
    the historical fixed indices if no header row is detected.
    """
    header_idx = _find_header(rows, comp_re=_RA_COMP_RE)
    if header_idx is not None:
        cols = _resolve_columns(rows[header_idx], comp_re=_RA_COMP_RE)
        # Fixed-layout defaults for any role the header didn't surface.
        name_i = cols["name"] if cols["name"] is not None else 1
        code_i = cols["code"]  # may be None (embedded-code layout)
        comp_i = cols["comp"] if cols["comp"] is not None else 2
        ra_i = cols["ra_count"] if cols["ra_count"] is not None else 3
        coll_i = cols["collation"] if cols["collation"] is not None else 5
    else:
        # No detectable header: fall back to the original fixed columns.
        name_i, code_i, comp_i, ra_i, coll_i = 1, None, 2, 3, 5

    out: list[ParsedConstituency] = []
    for r in rows:
        if not r or r[0] is None or not str(r[0]).strip().isdigit():
            continue  # header/spacer/total rows
        name_cell = str(_cell(r, name_i) or "")
        code_cell = _cell(r, code_i)
        if code_i is not None and code_cell:
            # Dedicated CODE column: take code from it, keep the name intact.
            name = re.sub(r"\s+", " ", name_cell.replace("\n", " ")).strip()
            code = str(code_cell).strip()
        else:
            # Embedded-code layout (ABIA): extract SC/xx/YY from the name cell.
            name, code = _clean_name(name_cell)
        comp = str(_cell(r, comp_i) or "")
        wards = [w.strip() for w in comp.split(",") if w.strip()]
        ra_val = _cell(r, ra_i)
        ra = _as_int(ra_val) if ra_val is not None else None
        coll_val = _cell(r, coll_i)
        collation = str(coll_val).strip() if coll_val else None
        out.append(ParsedConstituency(name, code, wards, ra, collation))
    return out


def parse_lga_rows(rows: list[list]) -> list[ParsedDistrict]:
    """Parse an SD/FC sheet: one row per LGA, merged S/N + district-name cells.

    HEADER-DRIVEN, mirroring ``parse_sc_rows``: the name / optional-code / LGA
    COMPOSITION / collation columns are resolved from the header labels so that
    a state with a standalone ``CODE`` column (shifting COMPOSITION right by
    one) still parses. When no dedicated CODE column exists the ``SD/FC`` code
    is extracted from the embedded name cell (ABIA/BORNO style).

    The district name/code appear only on the first LGA row of each district;
    subsequent LGA rows carry None there, so the current district is carried
    forward. `TOTAL` rows are skipped; header rows (non-numeric S/N and no
    active district) are skipped.
    """
    header_idx = _find_header(rows, comp_re=_LGA_COMP_RE)
    if header_idx is not None:
        cols = _resolve_columns(rows[header_idx], comp_re=_LGA_COMP_RE)
        name_i = cols["name"] if cols["name"] is not None else 1
        code_i = cols["code"]  # may be None (embedded-code layout)
        comp_i = cols["comp"] if cols["comp"] is not None else 2
        coll_i = cols["collation"] if cols["collation"] is not None else 5
    else:
        name_i, code_i, comp_i, coll_i = 1, None, 2, 5

    out: list[ParsedDistrict] = []
    current: ParsedDistrict | None = None
    for r in rows:
        if not r:
            continue
        sn = r[0] if len(r) > 0 else None
        name_raw = _cell(r, name_i)
        name_cell = str(name_raw) if name_raw else ""

        # Start of a new district: numeric S/N + a name cell.
        if sn is not None and str(sn).strip().isdigit() and name_cell:
            code_cell = _cell(r, code_i)
            if code_i is not None and code_cell:
                name = re.sub(r"\s+", " ", name_cell.replace("\n", " ")).strip()
                code = str(code_cell).strip()
            else:
                name, code = _clean_name(name_cell)
            coll_val = _cell(r, coll_i)
            collation = str(coll_val).strip() if coll_val else None
            current = ParsedDistrict(name, code, [], collation)
            out.append(current)

        # LGA row (may be the first row of the district or a carried-forward one).
        comp_val = _cell(r, comp_i)
        lga = str(comp_val).strip() if comp_val else ""
        if not lga or lga.upper() == "TOTAL":
            continue
        # Skip the header row's literal "LGA COMPOSITION(S)" label.
        if lga.upper().startswith("LGA COMPOSITION"):
            continue
        if current is not None:
            current.lgas.append(lga)
    return out
