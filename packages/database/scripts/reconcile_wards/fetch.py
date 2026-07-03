import urllib.request
from pathlib import Path

from .paths import SCRATCH_DIR

BASE = "https://wp1.inecnigeria.org/wp-content/uploads"


def is_valid_xlsx(path: Path) -> bool:
    with open(path, "rb") as fh:
        return fh.read(4) == b"PK\x03\x04"  # xlsx == zip; HTML/error pages fail this


def fetch_state(state_workbook: str) -> Path:
    """state_workbook e.g. 'ABIA'. Returns cached xlsx path; raises on invalid."""
    dest = SCRATCH_DIR / f"{state_workbook}.xlsx"
    if not dest.exists():
        req = urllib.request.Request(
            f"{BASE}/{state_workbook}.xlsx",
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as fh:  # noqa: S310
            fh.write(r.read())
    if not is_valid_xlsx(dest):
        dest.unlink(missing_ok=True)
        raise ValueError(
            f"{state_workbook}: downloaded file is not a valid .xlsx (soft-404?)"
        )
    return dest
