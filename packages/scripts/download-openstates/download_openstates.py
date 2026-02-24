#!/usr/bin/env python3
"""
Supplementary downloader for openstates.ng budget documents (hosted on AWS S3).

Fills gaps left by the NGF repository download:
- 2025 budgets for states not yet on NGF
- Missing state-year combinations
- Prefers Excel but most openstates.ng files are PDF

Files are hosted at:
  https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/documents/dataset_...
"""

import os
import time
import urllib.request
import urllib.parse
import urllib.error
import ssl
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent / "source" / "budgets"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

S3_BASE = "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/documents/"


def download_file(url, dest_path, retries=3):
    """Download a file with retry logic. Skip if exists."""
    if dest_path.exists():
        print(f"  SKIP (exists): {dest_path.name}")
        return "skipped"

    dest_path.parent.mkdir(parents=True, exist_ok=True)

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            })
            with urllib.request.urlopen(req, timeout=120, context=ssl_ctx) as response:
                data = response.read()
                with open(dest_path, "wb") as f:
                    f.write(data)
            print(f"  OK: {dest_path.name} ({len(data) / 1024:.0f} KB)")
            return "downloaded"
        except Exception as e:
            print(f"  RETRY {attempt + 1}/{retries}: {e}")
            time.sleep(2 * (attempt + 1))

    print(f"  FAILED: {url}")
    return "failed"


def has_file_for(state, year):
    """Check if we already have a file for this state/year from the NGF download."""
    state_dir = BASE_DIR / state / str(year)
    if not state_dir.exists():
        return False
    files = list(state_dir.glob("*.xlsx")) + list(state_dir.glob("*.pdf")) + list(state_dir.glob("*.docx"))
    return len(files) > 0


# Confirmed S3 download URLs from openstates.ng research.
# Only include entries that fill gaps in our NGF download.
# Format: (state_folder, year, url, filename)
OPENSTATES_DATA = [
    # === 2025 BUDGETS (most states don't have these on NGF yet) ===
    ("Lagos", 2025, f"{S3_BASE}dataset_LAGOS%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf%202.pdf", "Lagos-State-2025-Approved-Budget.pdf"),
    ("Kano", 2025, f"{S3_BASE}dataset_KANO%20STATE%20PROPOSED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Kano-State-2025-Proposed-Budget.pdf"),
    ("Enugu", 2025, f"{S3_BASE}dataset_ENUGU%20STATE%20PROPOSED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Enugu-State-2025-Proposed-Budget.pdf"),
    ("Kaduna", 2025, f"{S3_BASE}dataset_KADUNA%20STATE%20PROPOSED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Kaduna-State-2025-Proposed-Budget.pdf"),
    ("Imo", 2025, f"{S3_BASE}dataset_IMO%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Imo-State-2025-Approved-Budget.pdf"),
    ("Anambra", 2025, f"{S3_BASE}dataset_ANAMBRA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Anambra-State-2025-Approved-Budget.pdf"),
    ("Edo", 2025, f"{S3_BASE}dataset_EDO%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Edo-State-2025-Approved-Budget.pdf"),
    ("Osun", 2025, f"{S3_BASE}dataset_OSUN%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Osun-State-2025-Approved-Budget.pdf"),
    ("Ekiti", 2025, f"{S3_BASE}dataset_EKITI%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.xlsx", "Ekiti-State-2025-Approved-Budget.xlsx"),
    ("Oyo", 2025, f"{S3_BASE}dataset_OYO%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Oyo-State-2025-Approved-Budget.pdf"),
    ("Delta", 2025, f"{S3_BASE}dataset_DELTA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Delta-State-2025-Approved-Budget.pdf"),
    ("Bayelsa", 2025, f"{S3_BASE}dataset_BAYELSA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Bayelsa-State-2025-Approved-Budget.pdf"),
    ("Abia", 2025, f"{S3_BASE}dataset_ABIA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Abia-State-2025-Approved-Budget.pdf"),
    ("Adamawa", 2025, f"{S3_BASE}dataset_ADAMAWA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Adamawa-State-2025-Approved-Budget.pdf"),
    ("Bauchi", 2025, f"{S3_BASE}dataset_BAUCHI%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Bauchi-State-2025-Approved-Budget.pdf"),
    ("Benue", 2025, f"{S3_BASE}dataset_BENUE%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Benue-State-2025-Approved-Budget.pdf"),
    ("Borno", 2025, f"{S3_BASE}dataset_BORNO%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Borno-State-2025-Approved-Budget.pdf"),
    ("Cross_River", 2025, f"{S3_BASE}dataset_CROSS%20RIVER%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Cross-River-State-2025-Approved-Budget.pdf"),
    ("Ebonyi", 2025, f"{S3_BASE}dataset_EBONYI%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Ebonyi-State-2025-Approved-Budget.pdf"),
    ("Gombe", 2025, f"{S3_BASE}dataset_GOMBE%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Gombe-State-2025-Approved-Budget.pdf"),
    ("Jigawa", 2025, f"{S3_BASE}dataset_JIGAWA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Jigawa-State-2025-Approved-Budget.pdf"),
    ("Katsina", 2025, f"{S3_BASE}dataset_KATSINA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Katsina-State-2025-Approved-Budget.pdf"),
    ("Kebbi", 2025, f"{S3_BASE}dataset_KEBBI%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Kebbi-State-2025-Approved-Budget.pdf"),
    ("Kogi", 2025, f"{S3_BASE}dataset_KOGI%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Kogi-State-2025-Approved-Budget.pdf"),
    ("Kwara", 2025, f"{S3_BASE}dataset_KWARA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Kwara-State-2025-Approved-Budget.pdf"),
    ("Nasarawa", 2025, f"{S3_BASE}dataset_NASARAWA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Nasarawa-State-2025-Approved-Budget.pdf"),
    ("Niger", 2025, f"{S3_BASE}dataset_NIGER%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Niger-State-2025-Approved-Budget.pdf"),
    ("Ogun", 2025, f"{S3_BASE}dataset_OGUN%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Ogun-State-2025-Approved-Budget.pdf"),
    ("Ondo", 2025, f"{S3_BASE}dataset_ONDO%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Ondo-State-2025-Approved-Budget.pdf"),
    ("Plateau", 2025, f"{S3_BASE}dataset_PLATEAU%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Plateau-State-2025-Approved-Budget.pdf"),
    ("Rivers", 2025, f"{S3_BASE}dataset_RIVERS%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Rivers-State-2025-Approved-Budget.pdf"),
    ("Akwa_Ibom", 2025, f"{S3_BASE}dataset_AKWA%20IBOM%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "Akwa-Ibom-State-2025-Approved-Budget.pdf"),
    ("FCT", 2025, f"{S3_BASE}dataset_FCT%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202025.pdf", "FCT-2025-Approved-Budget.pdf"),

    # === GAP FILLERS (missing from NGF download) ===
    # Adamawa 2020
    ("Adamawa", 2020, f"{S3_BASE}dataset_ADAMAWA-STATE-YEAR-2020-REVISED-APPROVED-BUDGET-LAW.pdf", "Adamawa-State-2020-Revised-Budget.pdf"),
    # Akwa Ibom 2024
    ("Akwa_Ibom", 2024, f"{S3_BASE}dataset_AKWA%20IBOM%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202024.pdf", "Akwa-Ibom-State-2024-Approved-Budget.pdf"),
    # Bayelsa 2022
    ("Bayelsa", 2022, f"{S3_BASE}dataset_BAYELSA%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202022.pdf", "Bayelsa-State-2022-Approved-Budget.pdf"),
    # Lagos 2024
    ("Lagos", 2024, f"{S3_BASE}dataset_LAGOS%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202024.pdf", "Lagos-State-2024-Approved-Budget.pdf"),
    # Rivers 2024
    ("Rivers", 2024, f"{S3_BASE}dataset_RIVERS%20STATE%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202024.pdf", "Rivers-State-2024-Approved-Budget.pdf"),
    # Rivers 2019
    ("Rivers", 2019, f"{S3_BASE}dataset_Rivers-State-2019-approved-budget.pdf", "Rivers-State-2019-Approved-Budget.pdf"),
    # Kano 2019
    ("Kano", 2019, f"{S3_BASE}dataset_KANO-STATE-2019-APPROVED-BUDGET.pdf", "Kano-State-2019-Approved-Budget.pdf"),
    # Sokoto 2019
    ("Sokoto", 2019, f"{S3_BASE}dataset_Sokoto-State-2019-Approved-Budget.pdf", "Sokoto-State-2019-Approved-Budget.pdf"),
    # Nasarawa 2019
    ("Nasarawa", 2019, f"{S3_BASE}dataset_NASARAWA-STATE-2019-APPROVED-BUDGET.pdf", "Nasarawa-State-2019-Approved-Budget.pdf"),
    # Taraba 2019
    ("Taraba", 2019, f"{S3_BASE}dataset_TARABA-STATE-2019-APPROVED-BUDGET.pdf", "Taraba-State-2019-Approved-Budget.pdf"),
    # Zamfara 2019
    ("Zamfara", 2019, f"{S3_BASE}dataset_ZAMFARA-STATE-2019-APPROVED-BUDGET.pdf", "Zamfara-State-2019-Approved-Budget.pdf"),

    # === FCT (not covered by NGF at all) ===
    ("FCT", 2024, f"{S3_BASE}dataset_FCT%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202024.pdf", "FCT-2024-Approved-Budget.pdf"),
    ("FCT", 2023, f"{S3_BASE}dataset_FCT%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202023.pdf", "FCT-2023-Approved-Budget.pdf"),
    ("FCT", 2022, f"{S3_BASE}dataset_FCT%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202022.pdf", "FCT-2022-Approved-Budget.pdf"),
    ("FCT", 2021, f"{S3_BASE}dataset_FCT%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202021.pdf", "FCT-2021-Approved-Budget.pdf"),
    ("FCT", 2020, f"{S3_BASE}dataset_FCT%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202020.pdf", "FCT-2020-Approved-Budget.pdf"),
    ("FCT", 2019, f"{S3_BASE}dataset_FCT%20APPROVED%20BUDGET%20FOR%20THE%20YEAR%202019.pdf", "FCT-2019-Approved-Budget.pdf"),
]


def main():
    print("=" * 70)
    print("OPENSTATES.NG SUPPLEMENTARY DOWNLOADER")
    print("=" * 70)
    print(f"Entries to process: {len(OPENSTATES_DATA)}")

    stats = {"downloaded": 0, "skipped": 0, "failed": 0}

    for state, year, url, filename in OPENSTATES_DATA:
        # Skip if we already have this state/year from NGF
        if has_file_for(state, year):
            print(f"\n[{state} {year}] Already have data, skipping")
            stats["skipped"] += 1
            continue

        dest_path = BASE_DIR / state / str(year) / filename
        print(f"\n[{state} {year}] Downloading: {filename}")
        result = download_file(url, dest_path)
        stats[result] += 1
        time.sleep(0.3)

    print(f"\n{'=' * 70}")
    print(f"OPENSTATES DOWNLOAD SUMMARY")
    print(f"{'=' * 70}")
    print(f"Downloaded: {stats['downloaded']}")
    print(f"Skipped (already had data): {stats['skipped']}")
    print(f"Failed: {stats['failed']}")


if __name__ == "__main__":
    main()
