#!/usr/bin/env python3
"""
Download missing budget documents from OpenStates.ng API.

Searches for:
  - Approved Budgets
  - Citizen Budgets
  - Quarterly Budget Implementation Reports

Downloads to: packages/source/budgets/{State}/{year}/
"""

import json
import time
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent / "source" / "budgets"
API_BASE = "https://openstates.ng/api"
S3_BASE = "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/"

YEARS = list(range(2019, 2026))  # 2019-2025

# Map folder names to API slugs
FOLDER_TO_SLUG = {
    "Abia": "abia",
    "Adamawa": "adamawa",
    "Akwa_Ibom": "akwa-ibom",
    "Anambra": "anambra",
    "Bauchi": "bauchi",
    "Bayelsa": "bayelsa",
    "Benue": "benue",
    "Borno": "borno",
    "Cross_River": "cross-river",
    "Delta": "delta",
    "Ebonyi": "ebonyi",
    "Edo": "edo",
    "Ekiti": "ekiti",
    "Enugu": "enugu",
    "FCT": "fct",
    "Gombe": "gombe",
    "Imo": "imo",
    "Jigawa": "jigawa",
    "Kaduna": "kaduna",
    "Kano": "kano",
    "Katsina": "katsina",
    "Kebbi": "kebbi",
    "Kogi": "kogi",
    "Kwara": "kwara",
    "Lagos": "lagos",
    "Nasarawa": "nasarawa",
    "Niger": "niger",
    "Ogun": "ogun",
    "Ondo": "ondo",
    "Osun": "osun",
    "Oyo": "oyo",
    "Plateau": "plateau",
    "Rivers": "rivers",
    "Sokoto": "sokoto",
    "Taraba": "taraba",
    "Yobe": "yobe",
    "Zamfara": "zamfara",
}

QUARTER_KEYWORDS = {
    "FIRST": 1, "1ST": 1, "QUARTER ONE": 1, "QUARTER 1": 1, "Q1": 1,
    "SECOND": 2, "2ND": 2, "QUARTER TWO": 2, "QUARTER 2": 2, "Q2": 2,
    "THIRD": 3, "3RD": 3, "QUARTER THREE": 3, "QUARTER 3": 3, "Q3": 3,
    "FOURTH": 4, "4TH": 4, "QUARTER FOUR": 4, "QUARTER 4": 4, "Q4": 4,
}


def detect_quarter(title: str) -> int | None:
    upper = title.upper()
    for keyword, q in QUARTER_KEYWORDS.items():
        if keyword in upper:
            return q
    return None


def fetch_json(url: str, retries: int = 3) -> dict | None:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "BudgetDownloader/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
            else:
                print(f"  WARN: Failed to fetch {url}: {e}")
                return None


def fetch_all_pages(slug: str, search_term: str) -> list[dict]:
    """Fetch all pages from the drill endpoint for a given search term."""
    results = []
    page = 1
    while True:
        encoded_term = urllib.parse.quote(search_term)
        url = f"{API_BASE}/{slug}/dataset/drill?page={page}&locale=en&search_term={encoded_term}"
        data = fetch_json(url)
        if not data:
            break

        # Handle both wrapped and unwrapped responses
        dataset = data.get("dataset", data)
        items = dataset.get("data", [])
        if not items:
            break

        results.extend(items)
        last_page = dataset.get("last_page", 1)
        if page >= last_page:
            break
        page += 1
        time.sleep(0.3)  # be polite

    return results


def download_file(file_url: str, dest_path: Path) -> bool:
    """Download a file from S3 to the destination path."""
    full_url = S3_BASE + urllib.parse.quote(file_url, safe="/")
    try:
        req = urllib.request.Request(full_url, headers={"User-Agent": "BudgetDownloader/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            with open(dest_path, "wb") as f:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    f.write(chunk)
        size = dest_path.stat().st_size
        if size < 1000:
            print(f"  WARN: File suspiciously small ({size} bytes): {dest_path}")
        return True
    except Exception as e:
        print(f"  ERROR downloading {full_url}: {e}")
        return False


def get_existing_files(state_dir: Path, year: int) -> dict:
    """Check what already exists for a state/year."""
    year_dir = state_dir / str(year)
    result = {
        "has_budget": False,
        "has_citizen_budget": False,
        "has_year_dir": year_dir.is_dir(),
        "impl_quarters": set(),
    }
    if not year_dir.is_dir():
        return result

    for f in year_dir.iterdir():
        if f.name.startswith("."):
            continue
        name_lower = f.name.lower()
        if "implementation_report_q" in name_lower:
            for q in [1, 2, 3, 4]:
                if f"q{q}" in name_lower:
                    result["impl_quarters"].add(q)
        elif "citizen" in name_lower:
            result["has_citizen_budget"] = True
        elif "implementation" not in name_lower:
            result["has_budget"] = True

    return result


def pick_best_file(files: list[dict]) -> dict | None:
    """Pick the best file from a list, preferring PDFs."""
    pdfs = [f for f in files if f.get("type", "").lower() == "pdf" or f.get("url", "").lower().endswith(".pdf")]
    if pdfs:
        return pdfs[0]
    return files[0] if files else None


def main():
    stats = {"downloaded": 0, "skipped_exists": 0, "not_found": 0, "errors": 0}

    for folder, slug in sorted(FOLDER_TO_SLUG.items()):
        state_dir = BASE_DIR / folder
        print(f"\n{'='*60}")
        print(f"Processing: {folder} (API: {slug})")
        print(f"{'='*60}")

        # Determine what's missing
        missing_budgets = []
        missing_citizen = []
        missing_impl = {}  # year -> set of quarters

        for year in YEARS:
            existing = get_existing_files(state_dir, year)
            if not existing["has_budget"]:
                missing_budgets.append(year)
            if not existing["has_citizen_budget"]:
                missing_citizen.append(year)
            missing_q = {1, 2, 3, 4} - existing["impl_quarters"]
            if missing_q:
                missing_impl[year] = missing_q

        if not missing_budgets and not missing_citizen and not missing_impl:
            print("  All complete, skipping.")
            continue

        print(f"  Missing budgets: {missing_budgets}")
        print(f"  Missing citizen budgets: {missing_citizen}")
        impl_summary = {y: sorted(qs) for y, qs in sorted(missing_impl.items())}
        print(f"  Missing impl reports: {impl_summary}")

        # Fetch from API
        budget_items = fetch_all_pages(slug, "Approved Budget")
        citizen_items = fetch_all_pages(slug, "Citizen Budget")
        impl_items = fetch_all_pages(slug, "Budget Implementation")

        print(f"  API results: {len(budget_items)} budgets, {len(citizen_items)} citizen, {len(impl_items)} impl reports")

        # Process approved budgets
        for item in budget_items:
            year_str = item.get("year")
            if not year_str:
                continue
            try:
                year = int(year_str)
            except (ValueError, TypeError):
                continue
            if year not in missing_budgets:
                continue
            title = item.get("title", "").upper()
            # Skip if it's actually a citizen budget or analysis
            if "CITIZEN" in title:
                continue

            best_file = pick_best_file(item.get("files", []))
            if not best_file:
                continue

            file_url = best_file.get("url", "")
            ext = Path(file_url).suffix or ".pdf"
            dest = state_dir / str(year) / f"{folder} State Approved Budget {year}{ext}"
            if dest.exists():
                stats["skipped_exists"] += 1
                continue

            print(f"  Downloading budget {year}: {best_file.get('name', '')}")
            if download_file(file_url, dest):
                stats["downloaded"] += 1
                missing_budgets.remove(year)
            else:
                stats["errors"] += 1

        # Process citizen budgets
        for item in citizen_items:
            year_str = item.get("year")
            if not year_str:
                continue
            try:
                year = int(year_str)
            except (ValueError, TypeError):
                continue
            if year not in missing_citizen:
                continue

            best_file = pick_best_file(item.get("files", []))
            if not best_file:
                continue

            file_url = best_file.get("url", "")
            ext = Path(file_url).suffix or ".pdf"
            dest = state_dir / str(year) / f"{folder} State Citizen Budget {year}{ext}"
            if dest.exists():
                stats["skipped_exists"] += 1
                continue

            print(f"  Downloading citizen budget {year}: {best_file.get('name', '')}")
            if download_file(file_url, dest):
                stats["downloaded"] += 1
                missing_citizen.remove(year)
            else:
                stats["errors"] += 1

        # Process implementation reports
        for item in impl_items:
            year_str = item.get("year")
            if not year_str:
                continue
            try:
                year = int(year_str)
            except (ValueError, TypeError):
                continue
            if year not in missing_impl:
                continue

            title = item.get("title", "")
            quarter = detect_quarter(title)
            if not quarter:
                continue
            if quarter not in missing_impl[year]:
                continue

            best_file = pick_best_file(item.get("files", []))
            if not best_file:
                continue

            file_url = best_file.get("url", "")
            dest = state_dir / str(year) / f"implementation_report_q{quarter}.pdf"
            if dest.exists():
                stats["skipped_exists"] += 1
                continue

            print(f"  Downloading impl report {year} Q{quarter}: {best_file.get('name', '')}")
            if download_file(file_url, dest):
                stats["downloaded"] += 1
                missing_impl[year].discard(quarter)
            else:
                stats["errors"] += 1

        # Report what's still missing for this state
        still_missing_budgets = missing_budgets
        still_missing_citizen = missing_citizen
        still_missing_impl = {y: sorted(qs) for y, qs in missing_impl.items() if qs}
        if still_missing_budgets or still_missing_citizen or still_missing_impl:
            stats["not_found"] += len(still_missing_budgets) + len(still_missing_citizen)
            for qs in still_missing_impl.values():
                stats["not_found"] += len(qs)
            print(f"  Still missing budgets: {still_missing_budgets}")
            print(f"  Still missing citizen: {still_missing_citizen}")
            print(f"  Still missing impl: {still_missing_impl}")

        time.sleep(0.5)  # rate limit between states

    print(f"\n{'='*60}")
    print("DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"  Downloaded:      {stats['downloaded']}")
    print(f"  Skipped (exist): {stats['skipped_exists']}")
    print(f"  Not found on API:{stats['not_found']}")
    print(f"  Errors:          {stats['errors']}")


if __name__ == "__main__":
    main()
