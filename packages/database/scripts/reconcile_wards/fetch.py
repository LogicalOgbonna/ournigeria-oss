import urllib.request
from pathlib import Path

from .paths import SCRATCH_DIR

BASE = "https://wp1.inecnigeria.org/wp-content/uploads"


def is_valid_xlsx(path: Path) -> bool:
    with open(path, "rb") as fh:
        return fh.read(4) == b"PK\x03\x04"  # xlsx == zip; HTML/error pages fail this


def _name_variants(state_workbook: str) -> list[str]:
    """Filename spellings to try, in order.

    INEC is not consistent about case: every state is uploaded SHOUTED except
    Imo, which is `Imo.xlsx`. `IMO.xlsx` 404s, which is why Imo was written off
    as a missing workbook rather than a naming quirk.
    """
    seen, out = set(), []
    for name in (state_workbook, state_workbook.title(), state_workbook.capitalize(),
                 state_workbook.lower()):
        if name not in seen:
            seen.add(name)
            out.append(name)
    return out


def fetch_state(state_workbook: str) -> Path:
    """state_workbook e.g. 'ABIA'. Returns cached xlsx path; raises on invalid."""
    dest = SCRATCH_DIR / f"{state_workbook}.xlsx"
    if not dest.exists():
        errors = []
        for variant in _name_variants(state_workbook):
            req = urllib.request.Request(
                f"{BASE}/{variant}.xlsx",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            try:
                with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as fh:  # noqa: S310
                    fh.write(r.read())
                break
            except urllib.error.HTTPError as exc:
                errors.append(f"{variant}: HTTP {exc.code}")
        else:
            raise FileNotFoundError(
                f"{state_workbook}: no workbook found. Tried {'; '.join(errors)}"
            )
    if not is_valid_xlsx(dest):
        dest.unlink(missing_ok=True)
        raise ValueError(
            f"{state_workbook}: downloaded file is not a valid .xlsx (soft-404?)"
        )
    return dest
