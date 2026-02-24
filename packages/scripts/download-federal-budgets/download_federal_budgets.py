#!/usr/bin/env python3
"""
Nigerian Federal Budget Document Downloader

Downloads ALL budget documents from:
https://budgetoffice.gov.ng/index.php/resources/internal-resources/budget-documents

Organized by: federal_budget/{year}/{filename}
Handles nested subcategories and pagination.
"""

import os
import re
import time
import urllib.request
import urllib.parse
import ssl
import json
from pathlib import Path
from html import unescape

BASE_DIR = Path(__file__).parent.parent.parent / "source" / "federal_budget"
BASE_URL = "https://budgetoffice.gov.ng"

# SSL context
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Year categories from the main page
YEAR_CATEGORIES = [
    {"year": "2026", "slug": "2026-budget", "docs": 2},
    {"year": "2025", "slug": "2025-budget", "docs": 6},
    {"year": "2024", "slug": "2024-budget", "docs": 10},
    {"year": "2023", "slug": "2023-budget", "docs": 64},
    {"year": "2022", "slug": "2022-budget", "docs": 57},
    {"year": "2021", "slug": "2021-budget", "docs": 29},
    {"year": "2020", "slug": "2020-budget", "docs": 65},
    {"year": "2019", "slug": "2019-budget", "docs": 15},
    {"year": "2018", "slug": "2018-budget", "docs": 8},
    {"year": "2017", "slug": "2017-budget", "docs": 38},
    {"year": "2017_approved", "slug": "2017-approved-budget", "docs": 42},
    {"year": "2016", "slug": "2016-budget", "docs": 41},
    {"year": "2015", "slug": "2015-budget", "docs": 58},
    {"year": "2014", "slug": "2014-budget", "docs": 57},
    {"year": "2013", "slug": "2013-budget", "docs": 56},
    {"year": "2012", "slug": "2012-budget", "docs": 41},
    {"year": "2011", "slug": "2011-budget", "docs": 60},
    {"year": "2010", "slug": "2010-budget", "docs": 55},
    {"year": "2009", "slug": "2009-budget", "docs": 51},
    {"year": "2024_amendment", "slug": "2024-appropriation-amendment-act", "docs": 3},
]


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
    """Download a file with retry logic."""
    if dest_path.exists() and dest_path.stat().st_size > 0:
        print(f"    SKIP (exists): {dest_path.name}")
        return True

    dest_path.parent.mkdir(parents=True, exist_ok=True)

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=300, context=ssl_ctx) as response:
                data = response.read()
                # Try to get filename from Content-Disposition header
                content_disp = response.headers.get("Content-Disposition", "")
                if content_disp and "filename=" in content_disp:
                    match = re.search(r'filename[*]?=["\']?(?:UTF-8\'\')?([^"\';\r\n]+)', content_disp)
                    if match:
                        server_filename = urllib.parse.unquote(match.group(1).strip())
                        if server_filename and server_filename != "download":
                            dest_path = dest_path.parent / sanitize_filename(server_filename)

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


def extract_all_links(html):
    """Extract ALL href links from HTML page, decoding HTML entities."""
    if not html:
        return []
    pattern = r'href="(/index\.php/[^"]+)"'
    raw_links = re.findall(pattern, html)
    # Decode HTML entities like &amp; -> &
    return list(set(unescape(link) for link in raw_links))


def extract_items_from_page(html, page_url):
    """
    Extract documents and subcategory links from a page.
    Returns: (documents, subcategories, max_pagination_start)
    """
    documents = []
    subcategories = []
    max_start = 0

    if not html:
        return documents, subcategories, max_start

    all_links = extract_all_links(html)

    # 1. Find download links
    download_slugs = set()
    seen_downloads = set()
    for link in all_links:
        if link.endswith("/download"):
            if link in seen_downloads:
                continue
            seen_downloads.add(link)

            full_url = BASE_URL + link
            parts = link.replace("/download", "").split("/")
            slug = parts[-1] if parts else "document"
            title = slug.replace("-", " ").replace("_", " ").title()
            download_slugs.add(slug)

            documents.append({
                "title": title,
                "slug": slug,
                "download_url": full_url,
            })

    # 2. Find subcategory links - look for "(N Documents)" pattern near links
    # Two HTML patterns exist:
    #   a) <a href="URL">Title <small>( N Documents )</small></a>  (count INSIDE link)
    #   b) <a href="URL">Title</a> ... (N Documents)              (count OUTSIDE link)

    # Pattern a: document count inside the <a> tag
    subcat_pattern_inside = r'<a[^>]*href="(/index\.php/[^"]+)"[^>]*>\s*(.+?)\s*</a>'
    # Pattern b: document count after the </a> tag
    subcat_pattern_outside = r'<a[^>]*href="(/index\.php/[^"]+)"[^>]*>\s*([^<]+?)\s*</a>(?:[^(]{0,300})\(\s*(\d+)\s+Documents?\s*\)'

    seen_subcats = set()

    # Try pattern a first (count inside link tag)
    for url, inner_html in re.findall(subcat_pattern_inside, html, re.DOTALL | re.IGNORECASE):
        # Check if there's a document count inside
        count_match = re.search(r'\(\s*(\d+)\s+Documents?\s*\)', inner_html, re.IGNORECASE)
        if not count_match:
            continue

        doc_count = int(count_match.group(1))
        # Extract title (text before the count)
        title = re.sub(r'<[^>]+>', '', inner_html)  # Strip HTML tags
        title = re.sub(r'\(\s*\d+\s+Documents?\s*\)', '', title, flags=re.IGNORECASE).strip()

        if any(x in url for x in ["/download", "/viewdocument/", "start="]):
            continue
        if url in seen_subcats or doc_count == 0:
            continue

        seen_subcats.add(url)
        subcategories.append({
            "title": title,
            "url": BASE_URL + unescape(url),
            "doc_count": doc_count,
        })

    # Try pattern b (count outside link tag)
    for url, title, doc_count_str in re.findall(subcat_pattern_outside, html, re.DOTALL | re.IGNORECASE):
        title = title.strip()
        doc_count = int(doc_count_str)

        if any(x in url for x in ["/download", "/viewdocument/", "start="]):
            continue
        if url in seen_subcats or doc_count == 0:
            continue

        seen_subcats.add(url)
        subcategories.append({
            "title": title,
            "url": BASE_URL + unescape(url),
            "doc_count": doc_count,
        })

    # 3. Also find "detail" page links that might be subcategories
    # These are links under the budget-documents path that aren't downloads or viewdocuments
    # and don't correspond to any known document
    budget_doc_path = "/index.php/resources/internal-resources/budget-documents/"
    for link in all_links:
        if not link.startswith(budget_doc_path):
            continue
        if any(x in link for x in ["/download", "/viewdocument/", "start=", "layout="]):
            continue

        # Get the slug from this link
        remaining = link[len(budget_doc_path):]
        parts = remaining.strip("/").split("/")

        # If this is a 2-level deep path (year/subcategory), it might be a subcategory
        if len(parts) >= 2 and link not in seen_subcats:
            slug = parts[-1]
            # Check if this slug corresponds to a known document
            if slug not in download_slugs:
                # Check it's not already found as a subcategory
                already_found = any(s["url"] == BASE_URL + link for s in subcategories)
                if not already_found:
                    title = slug.replace("-", " ").replace("_", " ").title()
                    seen_subcats.add(link)
                    subcategories.append({
                        "title": title,
                        "url": BASE_URL + link,
                        "doc_count": 0,  # unknown
                    })

    # 4. Check for pagination
    pagination_pattern = r'[?&]start=(\d+)'
    for link in all_links:
        pag_match = re.search(pagination_pattern, link)
        if pag_match:
            start = int(pag_match.group(1))
            if start > max_start:
                max_start = start

    return documents, subcategories, max_start


def scrape_page_recursive(url, depth=0, visited=None):
    """
    Recursively scrape a page for all documents.
    Handles subcategories and pagination.
    """
    if visited is None:
        visited = set()

    if url in visited:
        return []
    visited.add(url)

    prefix = "  " * (depth + 1)
    all_documents = []

    print(f"{prefix}Fetching: {url}")
    html = fetch_page(url)
    if not html:
        return all_documents

    documents, subcategories, max_start = extract_items_from_page(html, url)
    all_documents.extend(documents)

    if documents:
        print(f"{prefix}  Found {len(documents)} documents on this page")

    # Handle pagination
    if max_start > 0:
        for start in range(40, max_start + 1, 40):
            # Build pagination URL
            if "?" in url:
                pag_url = f"{url}&start={start}"
            else:
                pag_url = f"{url}?start={start}"

            if pag_url in visited:
                continue
            visited.add(pag_url)

            print(f"{prefix}  Fetching page (start={start})...")
            time.sleep(1)
            pag_html = fetch_page(pag_url)
            if pag_html:
                pag_docs, pag_subcats, _ = extract_items_from_page(pag_html, url)
                all_documents.extend(pag_docs)
                if pag_docs:
                    print(f"{prefix}  Found {len(pag_docs)} more documents")
                # Add any new subcategories found on pagination pages
                subcategories.extend(pag_subcats)

    # Handle subcategories recursively (max depth 3 to avoid infinite loops)
    if depth < 3:
        for subcat in subcategories:
            if subcat["url"] in visited:
                continue
            doc_count_str = f" ({subcat['doc_count']} docs)" if subcat['doc_count'] > 0 else ""
            print(f"{prefix}  -> Subcategory: {subcat['title']}{doc_count_str}")
            time.sleep(0.5)
            sub_docs = scrape_page_recursive(subcat["url"], depth + 1, visited)
            all_documents.extend(sub_docs)

    return all_documents


def process_year(category):
    """Process all documents for a given year category."""
    year = category["year"]
    slug = category["slug"]
    expected_docs = category["docs"]

    year_dir = BASE_DIR / year
    year_dir.mkdir(parents=True, exist_ok=True)

    year_url = f"{BASE_URL}/index.php/resources/internal-resources/budget-documents/{slug}"

    print(f"\n{'=' * 60}")
    print(f"YEAR: {year} (expected: {expected_docs} documents)")
    print(f"URL: {year_url}")
    print(f"{'=' * 60}")

    # Scrape all documents recursively
    documents = scrape_page_recursive(year_url)

    # Deduplicate by download URL
    seen = set()
    unique_docs = []
    for doc in documents:
        if doc["download_url"] not in seen:
            seen.add(doc["download_url"])
            unique_docs.append(doc)
    documents = unique_docs

    print(f"\n  Found {len(documents)} unique documents (expected {expected_docs})")

    # Download each document
    downloaded = 0
    failed = 0

    for i, doc in enumerate(documents, 1):
        title = doc["title"]
        slug = doc.get("slug", title.lower().replace(" ", "-"))
        download_url = doc["download_url"]

        # Create filename from slug
        filename = sanitize_filename(slug)
        if not any(filename.lower().endswith(ext) for ext in [".pdf", ".xlsx", ".xls", ".doc", ".docx", ".zip", ".csv", ".pptx", ".ppt"]):
            filename += ".pdf"

        dest_path = year_dir / filename

        print(f"\n  [{i}/{len(documents)}] {title}")
        if download_file(download_url, dest_path):
            downloaded += 1
        else:
            failed += 1

        time.sleep(0.3)

    return downloaded, failed, len(documents)


def main():
    print("=" * 70)
    print("NIGERIAN FEDERAL BUDGET DOCUMENT DOWNLOADER")
    print("Source: Budget Office of the Federation")
    print(f"URL: {BASE_URL}/index.php/resources/internal-resources/budget-documents")
    print("=" * 70)
    print(f"\nOutput directory: {BASE_DIR}")
    print(f"Categories: {len(YEAR_CATEGORIES)}")

    total_expected = sum(c["docs"] for c in YEAR_CATEGORIES)
    print(f"Total expected documents: {total_expected}")

    BASE_DIR.mkdir(parents=True, exist_ok=True)

    total_downloaded = 0
    total_failed = 0
    total_found = 0
    results = []

    for category in YEAR_CATEGORIES:
        downloaded, failed, found = process_year(category)
        total_downloaded += downloaded
        total_failed += failed
        total_found += found

        results.append({
            "year": category["year"],
            "expected": category["docs"],
            "found": found,
            "downloaded": downloaded,
            "failed": failed,
        })

        print(f"\n  Summary for {category['year']}: {downloaded} downloaded, {failed} failed ({found} found / {category['docs']} expected)")

    print(f"\n{'=' * 70}")
    print(f"FINAL SUMMARY")
    print(f"{'=' * 70}")
    print(f"Total found:      {total_found}")
    print(f"Total downloaded:  {total_downloaded}")
    print(f"Total failed:      {total_failed}")
    print(f"Total expected:    {total_expected}")

    print(f"\nPer-year breakdown:")
    for r in results:
        status = "OK" if r["found"] >= r["expected"] else "PARTIAL"
        print(f"  {r['year']:20s}: {r['downloaded']:3d} downloaded, {r['found']:3d} found / {r['expected']:3d} expected  [{status}]")

    # Save manifest
    manifest = {
        "download_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": "Budget Office of the Federation (budgetoffice.gov.ng)",
        "total_found": total_found,
        "total_downloaded": total_downloaded,
        "total_failed": total_failed,
        "total_expected": total_expected,
        "categories": results,
    }
    manifest_path = BASE_DIR / "download_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest saved to: {manifest_path}")


if __name__ == "__main__":
    main()
