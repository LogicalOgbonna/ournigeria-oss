#!/usr/bin/env python3
"""
Nigerian State Budget Implementation Report Downloader

Downloads quarterly budget implementation report PDFs from state government websites.
Currently supports: Ebonyi State (https://ebonyistate.gov.ng/laws/and/financials)
Supports Abia State (https://abiastate.gov.ng/document-library/)

Organized by: budgets/{state}/{year}/implementation_report_Q{N}.pdf
Uses stdlib only (urllib, re, ssl, json, pathlib). No external dependencies.
"""

import argparse
import json
import os
import re
import time
import urllib.request
import urllib.parse
import ssl
from html import unescape
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent / "source" / "budgets"

# SSL context (some state sites use problematic certs)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# ---------------------------------------------------------------------------
# State configuration registry — add new states here
# ---------------------------------------------------------------------------
STATE_CONFIGS = {
    "Ebonyi": {
        "name": "Ebonyi",
        "folder": "Ebonyi",
        "base_url": "https://ebonyistate.gov.ng/laws/and/financials",
        "pagination_param": "budgetsPage",
        "max_pages": 10,
        "scraper": "ebonyi_table",
    },
}

# ---------------------------------------------------------------------------
# Core utilities (matching download_federal_budgets.py patterns)
# ---------------------------------------------------------------------------

def fetch_page(url, retries=3):
    """Fetch a page and return its HTML content."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60, context=ssl_ctx) as response:
                return response.read().decode("utf-8", errors="replace")
        except Exception as e:
            print(f"    Fetch retry {attempt + 1}/{retries} for {url}: {e}")
            time.sleep(3 * (attempt + 1))
    print(f"    FAILED to fetch: {url}")
    return None


def download_file(url, dest_path, retries=3):
    """Download a file with retry logic. Skips if file already exists."""
    if dest_path.exists() and dest_path.stat().st_size > 0:
        print(f"    SKIP (exists): {dest_path.name}")
        return True

    dest_path.parent.mkdir(parents=True, exist_ok=True)

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=300, context=ssl_ctx) as response:
                data = response.read()
                with open(dest_path, "wb") as f:
                    f.write(data)
                size_kb = len(data) / 1024
                if size_kb > 1024:
                    print(f"    OK: {dest_path.name} ({size_kb / 1024:.1f} MB)")
                else:
                    print(f"    OK: {dest_path.name} ({size_kb:.0f} KB)")
                return True
        except Exception as e:
            print(f"    RETRY {attempt + 1}/{retries}: {e}")
            time.sleep(3 * (attempt + 1))

    print(f"    FAILED: {url}")
    return False


def sanitize_filename(name):
    """Clean up a filename for safe filesystem use."""
    name = urllib.parse.unquote(name)
    name = unescape(name)
    name = re.sub(r'[<>:"/\\|?*]', '-', name)
    name = re.sub(r'\s+', ' ', name).strip()
    if len(name) > 200:
        base, ext = os.path.splitext(name)
        name = base[:200 - len(ext)] + ext
    return name


# ---------------------------------------------------------------------------
# Year / quarter extraction helpers
# ---------------------------------------------------------------------------

def extract_timestamp(url):
    """Extract the numeric upload timestamp from a PDF URL filename."""
    match = re.search(r'-(\d{10})\.pdf', url)
    return int(match.group(1)) if match else 0


def parse_year_quarter(title, url):
    """Extract fiscal year and quarter number from title and/or URL.

    Returns (year: int|None, quarter: int|None).
    """
    text = f"{title} {url}".lower()

    # Extract year (4-digit number 2000-2039)
    year = None
    year_match = re.search(r'(20[0-3]\d)', text)
    if year_match:
        year = int(year_match.group(1))

    # Extract quarter
    quarter = None
    q_patterns = [
        (r'(?:q4|4th\s*quarter|fourth\s*quarter)', 4),
        (r'(?:q3|3rd\s*quarter|third\s*quarter)', 3),
        (r'(?:q2|2nd\s*quarter|second\s*quarter)', 2),
        (r'(?:q1|1st\s*quarter|first\s*quarter)', 1),
    ]
    for pattern, q_num in q_patterns:
        if re.search(pattern, text):
            quarter = q_num
            break

    return year, quarter


# ---------------------------------------------------------------------------
# Ebonyi scraper
# ---------------------------------------------------------------------------

# Keywords that identify an implementation/performance report row
IMPLEMENTATION_KEYWORDS = [
    "implementation report",
    "budget performance report",
    "budget implementation",
    "budget-implementation",
]


def _is_implementation_row(title, href):
    """Check whether a table row represents an implementation report."""
    text = f"{title} {href}".lower()
    return any(kw in text for kw in IMPLEMENTATION_KEYWORDS)


def scrape_ebonyi_page(html):
    """Parse one page of the Ebonyi financials table.

    Returns a list of dicts: {title, url, year, quarter, timestamp}.
    """
    if not html:
        return []

    reports = []

    # Each document lives in a <tr>.  We look for rows that contain a PDF
    # link pointing at /assets/../storage/documents/…
    # NOTE: The actual href values contain leading/trailing whitespace, e.g.:
    #   href="    /assets/../storage/documents/file.pdf   "
    row_pattern = r'<tr[^>]*>(.*?)</tr>'
    link_pattern = r'href="\s*(/assets/\.\./storage/documents/[^"]*\.pdf)\s*"'
    # Grab all <td> content for title detection
    td_pattern = r'<td[^>]*>(.*?)</td>'

    for row_html in re.findall(row_pattern, html, re.DOTALL | re.IGNORECASE):
        link_match = re.search(link_pattern, row_html, re.DOTALL)
        if not link_match:
            continue

        relative_path = link_match.group(1).strip()

        # Collect all <td> text (strip tags) to find the title cell
        cells = re.findall(td_pattern, row_html, re.DOTALL | re.IGNORECASE)
        cell_texts = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]

        # Title is typically the longest text cell (skip S/N and Date)
        title = max(cell_texts, key=len) if cell_texts else ""

        # Only keep implementation / performance reports
        if not _is_implementation_row(title, relative_path):
            continue

        # Normalise URL: /assets/../storage/documents/… -> /storage/documents/…
        normalised = relative_path.replace("/assets/../", "/")
        full_url = urllib.parse.urljoin(
            "https://ebonyistate.gov.ng/", normalised
        )

        year, quarter = parse_year_quarter(title, full_url)
        if year is None or quarter is None:
            print(f"    WARN: could not parse year/quarter from: {title}")
            continue

        reports.append({
            "title": title,
            "url": full_url,
            "year": year,
            "quarter": quarter,
            "timestamp": extract_timestamp(full_url),
        })

    return reports


def _page_has_table_rows(html):
    """Check whether the HTML contains table rows with PDF links."""
    row_pattern = r'<tr[^>]*>(.*?)</tr>'
    for row_html in re.findall(row_pattern, html, re.DOTALL | re.IGNORECASE):
        if re.search(r'\.pdf', row_html, re.IGNORECASE):
            return True
    return False


def scrape_ebonyi(config):
    """Scrape all pages for Ebonyi implementation reports.

    Returns deduplicated list sorted by (year, quarter).
    """
    base_url = config["base_url"]
    param = config["pagination_param"]
    max_pages = config["max_pages"]

    all_reports = []

    for page in range(1, max_pages + 1):
        if page == 1:
            url = base_url
        else:
            sep = "&" if "?" in base_url else "?"
            url = f"{base_url}{sep}{param}={page}"

        print(f"  Fetching page {page}: {url}")
        html = fetch_page(url)
        if not html:
            print(f"  No HTML returned for page {page}, stopping pagination.")
            break

        page_reports = scrape_ebonyi_page(html)
        print(f"    Found {len(page_reports)} implementation reports on page {page}")
        all_reports.extend(page_reports)

        # Stop when the page has no table rows with PDFs at all (past last page)
        if not _page_has_table_rows(html):
            print(f"  No more table content, stopping at page {page}.")
            break

        if page < max_pages:
            time.sleep(1)  # rate-limit between page fetches

    # Deduplicate by (year, quarter), keeping highest timestamp
    best = {}  # (year, quarter) -> report
    for r in all_reports:
        key = (r["year"], r["quarter"])
        if key not in best or r["timestamp"] > best[key]["timestamp"]:
            best[key] = r

    deduped = sorted(best.values(), key=lambda r: (r["year"], r["quarter"]))
    print(f"\n  Total unique implementation reports: {len(deduped)}")
    return deduped


# Dispatcher for scraper functions
SCRAPERS = {
    "ebonyi_table": scrape_ebonyi,
}


# ---------------------------------------------------------------------------
# Processing & download
# ---------------------------------------------------------------------------

def process_state(state_key):
    """Scrape and download all implementation reports for a state."""
    config = STATE_CONFIGS[state_key]
    state_name = config["name"]
    folder = config["folder"]
    scraper_name = config["scraper"]

    print(f"\n{'=' * 60}")
    print(f"STATE: {state_name}")
    print(f"Source: {config['base_url']}")
    print(f"{'=' * 60}")

    scraper_fn = SCRAPERS[scraper_name]
    reports = scraper_fn(config)

    downloaded = 0
    failed = 0
    results = []

    for i, report in enumerate(reports, 1):
        year = report["year"]
        quarter = report["quarter"]
        url = report["url"]
        filename = f"implementation_report_Q{quarter}.pdf"

        dest_dir = BASE_DIR / folder / str(year)
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / filename

        print(f"\n  [{i}/{len(reports)}] {year} Q{quarter}: {report['title']}")
        if download_file(url, dest_path):
            downloaded += 1
            results.append({
                "state": state_name,
                "year": year,
                "quarter": quarter,
                "filename": filename,
                "source_url": url,
                "status": "ok",
            })
        else:
            failed += 1
            results.append({
                "state": state_name,
                "year": year,
                "quarter": quarter,
                "filename": filename,
                "source_url": url,
                "status": "failed",
            })

        time.sleep(0.5)  # rate-limit between downloads

    print(f"\n  {state_name} summary: {downloaded} downloaded, {failed} failed "
          f"({len(reports)} total reports)")
    return results


# ---------------------------------------------------------------------------
# CLI & main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Download Nigerian state budget implementation reports (quarterly PDFs)."
    )
    parser.add_argument(
        "--state",
        type=str,
        default=None,
        help="Target a specific state (default: all configured states). "
             f"Available: {', '.join(STATE_CONFIGS.keys())}",
    )
    args = parser.parse_args()

    if args.state:
        if args.state not in STATE_CONFIGS:
            print(f"ERROR: Unknown state '{args.state}'. "
                  f"Available: {', '.join(STATE_CONFIGS.keys())}")
            return
        state_keys = [args.state]
    else:
        state_keys = list(STATE_CONFIGS.keys())

    print("=" * 70)
    print("NIGERIAN STATE BUDGET IMPLEMENTATION REPORT DOWNLOADER")
    print("=" * 70)
    print(f"Output directory: {BASE_DIR}")
    print(f"States to process: {', '.join(state_keys)}")

    all_results = []
    total_downloaded = 0
    total_failed = 0

    for key in state_keys:
        results = process_state(key)
        all_results.extend(results)
        total_downloaded += sum(1 for r in results if r["status"] == "ok")
        total_failed += sum(1 for r in results if r["status"] == "failed")

    print(f"\n{'=' * 70}")
    print("FINAL SUMMARY")
    print(f"{'=' * 70}")
    print(f"Total downloaded:  {total_downloaded}")
    print(f"Total failed:      {total_failed}")

    # Save manifest
    manifest = {
        "download_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": "Nigerian state government websites",
        "total_downloaded": total_downloaded,
        "total_failed": total_failed,
        "reports": all_results,
    }
    manifest_path = BASE_DIR / "implementation_reports_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest saved to: {manifest_path}")


if __name__ == "__main__":
    main()
