#!/usr/bin/env python3
"""
Download 2026 budget documents from OpenStates.ng API for all states.

Searches for:
  - Approved Budgets (2026)
  - Citizen Budgets (2026)
  - Quarterly Budget Implementation Reports (2026, Q1-Q4)

Downloads to: packages/source/budgets/{State}/2026/
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent / "source" / "budgets"
API_BASE = "https://openstates.ng/api"
S3_BASE = "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/"

YEAR = 2026

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

        dataset = data.get("dataset", data)
        items = dataset.get("data", [])
        if not items:
            break

        results.extend(items)
        last_page = dataset.get("last_page", 1)
        if page >= last_page:
            break
        page += 1
        time.sleep(0.3)

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


def pick_best_file(files: list[dict]) -> dict | None:
    """Pick the best file from a list, preferring PDFs."""
    pdfs = [f for f in files if f.get("type", "").lower() == "pdf" or f.get("url", "").lower().endswith(".pdf")]
    if pdfs:
        return pdfs[0]
    return files[0] if files else None


def get_existing(year_dir: Path) -> dict:
    """Check what already exists for 2026."""
    result = {
        "has_budget": False,
        "has_citizen": False,
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
            result["has_citizen"] = True
        elif "implementation" not in name_lower:
            result["has_budget"] = True

    return result


def main():
    stats = {"downloaded": 0, "skipped_exists": 0, "not_found": 0, "errors": 0}

    print(f"Downloading {YEAR} budgets for all states")
    print(f"Target: {BASE_DIR}")
    print(f"{'='*60}\n")

    for folder, slug in sorted(FOLDER_TO_SLUG.items()):
        state_dir = BASE_DIR / folder
        year_dir = state_dir / str(YEAR)
        print(f"\n{'='*60}")
        print(f"Processing: {folder} (API: {slug})")
        print(f"{'='*60}")

        # Check what already exists
        existing = get_existing(year_dir)
        missing_impl_quarters = {1, 2, 3, 4} - existing["impl_quarters"]

        need_budget = not existing["has_budget"]
        need_citizen = not existing["has_citizen"]
        need_impl = len(missing_impl_quarters) > 0

        if not need_budget and not need_citizen and not need_impl:
            print(f"  Already have everything for {YEAR}, skipping.")
            stats["skipped_exists"] += 2 + 4
            continue

        status_parts = []
        if need_budget:
            status_parts.append("budget")
        if need_citizen:
            status_parts.append("citizen budget")
        if need_impl:
            status_parts.append(f"impl Q{sorted(missing_impl_quarters)}")
        print(f"  Need: {', '.join(status_parts)}")

        # Fetch from API
        budget_items = []
        citizen_items = []
        impl_items = []

        if need_budget:
            budget_items = fetch_all_pages(slug, "Approved Budget")
            if not budget_items:
                budget_items = fetch_all_pages(slug, f"{YEAR} Budget")

        if need_citizen:
            citizen_items = fetch_all_pages(slug, "Citizen Budget")
            if not citizen_items:
                citizen_items = fetch_all_pages(slug, f"Citizen Budget {YEAR}")

        if need_impl:
            impl_items = fetch_all_pages(slug, "Budget Implementation")
            if not impl_items:
                impl_items = fetch_all_pages(slug, f"Implementation Report {YEAR}")

        print(f"  API results: {len(budget_items)} budget, {len(citizen_items)} citizen, {len(impl_items)} impl")

        # Download approved budget
        if need_budget:
            found = False
            for item in budget_items:
                year_str = item.get("year")
                if not year_str:
                    continue
                try:
                    year = int(year_str)
                except (ValueError, TypeError):
                    continue
                if year != YEAR:
                    continue
                title = item.get("title", "").upper()
                if "CITIZEN" in title:
                    continue

                best_file = pick_best_file(item.get("files", []))
                if not best_file:
                    continue

                file_url = best_file.get("url", "")
                ext = Path(file_url).suffix or ".pdf"
                dest = year_dir / f"{folder} State Approved Budget {YEAR}{ext}"
                if dest.exists():
                    stats["skipped_exists"] += 1
                    found = True
                    break

                print(f"  Downloading budget: {best_file.get('name', '')}")
                if download_file(file_url, dest):
                    stats["downloaded"] += 1
                    found = True
                else:
                    stats["errors"] += 1
                break

            if not found:
                print(f"  {YEAR} approved budget not found on API")
                stats["not_found"] += 1
        else:
            print(f"  {YEAR} approved budget already exists")

        # Download citizen budget
        if need_citizen:
            found = False
            for item in citizen_items:
                year_str = item.get("year")
                if not year_str:
                    continue
                try:
                    year = int(year_str)
                except (ValueError, TypeError):
                    continue
                if year != YEAR:
                    continue

                best_file = pick_best_file(item.get("files", []))
                if not best_file:
                    continue

                file_url = best_file.get("url", "")
                ext = Path(file_url).suffix or ".pdf"
                dest = year_dir / f"{folder} State Citizen Budget {YEAR}{ext}"
                if dest.exists():
                    stats["skipped_exists"] += 1
                    found = True
                    break

                print(f"  Downloading citizen budget: {best_file.get('name', '')}")
                if download_file(file_url, dest):
                    stats["downloaded"] += 1
                    found = True
                else:
                    stats["errors"] += 1
                break

            if not found:
                print(f"  {YEAR} citizen budget not found on API")
                stats["not_found"] += 1
        else:
            print(f"  {YEAR} citizen budget already exists")

        # Download implementation reports
        if need_impl:
            found_quarters = set()
            for item in impl_items:
                year_str = item.get("year")
                if not year_str:
                    continue
                try:
                    year = int(year_str)
                except (ValueError, TypeError):
                    continue
                if year != YEAR:
                    continue

                title = item.get("title", "")
                quarter = detect_quarter(title)
                if not quarter:
                    continue
                if quarter not in missing_impl_quarters:
                    continue
                if quarter in found_quarters:
                    continue

                best_file = pick_best_file(item.get("files", []))
                if not best_file:
                    continue

                file_url = best_file.get("url", "")
                dest = year_dir / f"implementation_report_q{quarter}.pdf"
                if dest.exists():
                    stats["skipped_exists"] += 1
                    found_quarters.add(quarter)
                    continue

                print(f"  Downloading impl report Q{quarter}: {best_file.get('name', '')}")
                if download_file(file_url, dest):
                    stats["downloaded"] += 1
                    found_quarters.add(quarter)
                else:
                    stats["errors"] += 1

            still_missing = sorted(missing_impl_quarters - found_quarters)
            if still_missing:
                print(f"  {YEAR} impl reports not found: Q{still_missing}")
                stats["not_found"] += len(still_missing)
        else:
            print(f"  {YEAR} implementation reports already exist")

        time.sleep(0.5)  # rate limit between states

    print(f"\n{'='*60}")
    print(f"DOWNLOAD SUMMARY — {YEAR} Budgets")
    print(f"{'='*60}")
    print(f"  States:          {len(FOLDER_TO_SLUG)}")
    print(f"  Downloaded:      {stats['downloaded']}")
    print(f"  Skipped (exist): {stats['skipped_exists']}")
    print(f"  Not found on API:{stats['not_found']}")
    print(f"  Errors:          {stats['errors']}")


if __name__ == "__main__":
    main()
