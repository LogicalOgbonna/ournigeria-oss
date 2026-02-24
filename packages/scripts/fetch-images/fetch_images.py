#!/usr/bin/env python3
"""
Fetch images for dignitaries in budget metadata.json files.
Uses Wikipedia API to find images, downloads them, converts to base64,
and updates metadata.json files with image_url and image_blob.
"""

import json
import os
import glob
import base64
import urllib.request
import urllib.parse
import urllib.error
import time
import ssl
import sys

BUDGETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "source", "budgets")
PERSON_ROLES = [
    "governor",
    "commissioner_of_finance",
    "house_of_assembly_speaker",
    "appropriation_committee_chair",
    "accountant_general",
]

# Cache: name -> {image_url, image_blob} to avoid re-fetching same person
image_cache = {}

# Create SSL context that doesn't verify (for some Wikipedia CDN issues)
ssl_ctx = ssl.create_default_context()


def search_wikipedia_image(name, state=None, role=None):
    """Search Wikipedia for a person's image using the API."""
    # Try different search queries
    queries = [name]
    if state and role == "governor":
        queries.insert(0, f"{name} governor")
        queries.insert(0, f"{name} politician")
    elif state:
        queries.insert(0, f"{name} Nigeria")

    for query in queries:
        try:
            # Step 1: Search Wikipedia for the person
            search_url = (
                "https://en.wikipedia.org/w/api.php?"
                + urllib.parse.urlencode(
                    {
                        "action": "query",
                        "list": "search",
                        "srsearch": query,
                        "format": "json",
                        "srlimit": 3,
                    }
                )
            )

            req = urllib.request.Request(
                search_url,
                headers={"User-Agent": "BudgetApp/1.0 (budget research project)"},
            )
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=15) as resp:
                search_data = json.loads(resp.read().decode())

            results = search_data.get("query", {}).get("search", [])
            if not results:
                continue

            # Try each search result
            for result in results:
                title = result["title"]

                # Step 2: Get the page image (thumbnail)
                image_url = (
                    "https://en.wikipedia.org/w/api.php?"
                    + urllib.parse.urlencode(
                        {
                            "action": "query",
                            "titles": title,
                            "prop": "pageimages",
                            "format": "json",
                            "pithumbsize": 400,
                        }
                    )
                )

                req = urllib.request.Request(
                    image_url,
                    headers={
                        "User-Agent": "BudgetApp/1.0 (budget research project)"
                    },
                )
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=15) as resp:
                    image_data = json.loads(resp.read().decode())

                pages = image_data.get("query", {}).get("pages", {})
                for page_id, page in pages.items():
                    thumb = page.get("thumbnail", {})
                    thumb_url = thumb.get("source")
                    if thumb_url:
                        return thumb_url, title

        except Exception as e:
            print(f"    Wikipedia search error for '{query}': {e}")
            continue

    return None, None


def download_image_as_base64(url):
    """Download an image from URL and return as base64 string."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "BudgetApp/1.0 (budget research project)"},
        )
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
            image_bytes = resp.read()
            content_type = resp.headers.get("Content-Type", "image/jpeg")

            # Convert to base64 with data URI prefix
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            data_uri = f"data:{content_type};base64,{b64}"
            return data_uri

    except Exception as e:
        print(f"    Download error for {url}: {e}")
        return None


def process_metadata_files():
    """Process all metadata.json files and add images."""
    files = sorted(glob.glob(os.path.join(BUDGETS_DIR, "**/metadata.json"), recursive=True))
    print(f"Found {len(files)} metadata files")

    total_found = 0
    total_not_found = 0
    not_found_names = []

    for i, filepath in enumerate(files):
        with open(filepath) as f:
            data = json.load(f)

        state = data.get("state", "")
        year = data.get("year", "")
        print(f"\n[{i+1}/{len(files)}] Processing {state} {year}...")

        modified = False

        for role in PERSON_ROLES:
            person = data.get(role)
            if not isinstance(person, dict):
                continue

            name = person.get("name")
            if not name:
                continue

            # Skip if already has image
            if person.get("image_url") and person.get("image_blob"):
                print(f"  {role}: {name} - already has image, skipping")
                continue

            # Check cache first
            if name in image_cache:
                cached = image_cache[name]
                if cached:
                    person["image_url"] = cached["image_url"]
                    person["image_blob"] = cached["image_blob"]
                    modified = True
                    print(f"  {role}: {name} - using cached image")
                else:
                    print(f"  {role}: {name} - cached as not found")
                continue

            print(f"  {role}: {name} - searching...")

            # Search Wikipedia
            thumb_url, wiki_title = search_wikipedia_image(name, state, role)

            if thumb_url:
                print(f"    Found Wikipedia image: {wiki_title}")

                # Download and convert to base64
                blob = download_image_as_base64(thumb_url)

                if blob:
                    person["image_url"] = thumb_url
                    person["image_blob"] = blob
                    image_cache[name] = {
                        "image_url": thumb_url,
                        "image_blob": blob,
                    }
                    modified = True
                    total_found += 1
                    print(f"    Successfully added image for {name}")
                else:
                    image_cache[name] = None
                    total_not_found += 1
                    not_found_names.append(f"{name} ({role}, {state})")
                    print(f"    Failed to download image for {name}")
            else:
                image_cache[name] = None
                total_not_found += 1
                not_found_names.append(f"{name} ({role}, {state})")
                print(f"    No Wikipedia image found for {name}")

            # Be nice to the API
            time.sleep(0.5)

        if modified:
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            print(f"  Updated {filepath}")

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Images found: {total_found}")
    print(f"Images not found: {total_not_found}")
    if not_found_names:
        print(f"\nPeople without images:")
        for name in sorted(set(not_found_names)):
            print(f"  - {name}")


if __name__ == "__main__":
    process_metadata_files()
