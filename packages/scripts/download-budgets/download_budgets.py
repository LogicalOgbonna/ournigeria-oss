#!/usr/bin/env python3
"""
Nigerian State Budget Document Downloader

Downloads budget documents from:
1. NGF Digital Repository (ngfrepository.org.ng)
2. OpenStates.ng

Organized by: budgets/{state}/{year}/filename
Prefers Excel over PDF. Avoids duplicates.
"""

import time
import urllib.request
import urllib.parse
import urllib.error
import ssl
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent / "source" / "budgets"

# Create SSL context that doesn't verify (the NGF repo uses self-signed certs)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


def download_file(url, dest_path, retries=3):
    """Download a file with retry logic."""
    if dest_path.exists():
        print(f"  SKIP (exists): {dest_path.name}")
        return True

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
            return True
        except Exception as e:
            print(f"  RETRY {attempt + 1}/{retries}: {e}")
            time.sleep(2 * (attempt + 1))

    print(f"  FAILED: {url}")
    return False


def scrape_handle_page(handle_url):
    """Scrape a DSpace handle page to find all bitstream download links."""
    files = []
    try:
        req = urllib.request.Request(handle_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=60, context=ssl_ctx) as response:
            html = response.read().decode("utf-8", errors="replace")

        # Find bitstream links in the HTML
        import re
        # Pattern for bitstream links: /bitstream/123456789/XXXX/N/filename
        # or /jspui/bitstream/...
        bitstream_pattern = r'href="([^"]*bitstream/[^"]+)"'
        matches = re.findall(bitstream_pattern, html)

        for match in matches:
            # Normalize the URL
            if match.startswith("/"):
                url = f"http://ngfrepository.org.ng:8080{match}"
            elif match.startswith("http"):
                url = match
            else:
                continue

            # Extract filename
            filename = urllib.parse.unquote(url.split("/")[-1])
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

            files.append({
                "url": url,
                "filename": filename,
                "ext": ext
            })

    except Exception as e:
        print(f"  Error scraping {handle_url}: {e}")

    return files


# ============================================================================
# NGF REPOSITORY DATA
# ============================================================================
# For each state/year, we list known direct download URLs.
# Where we only have handle URLs, we'll scrape them to find files.
#
# Format: { "State": { year: { "handle": url, "files": [ {"url": ..., "filename": ...} ] } } }
# ============================================================================

NGF_DATA = {
    "Abia": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5641",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5641/1/ABIA-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "ABIA-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5782",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5782/1/Abia%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Abia State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5782/3/Abia-State-2023-Aproved-Budget.pdf", "filename": "Abia-State-2023-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5784"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5786"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5791"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5789"},
    },
    "Adamawa": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5644",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5644/1/2024%20Approved%20Budget%20of%20Adamawa%20State%20of%20Nigeria%20Multi%20Year%20Budget%20%281%29.pdf", "filename": "Adamawa-State-2024-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5797",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5797/2/Adamawa%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Adamawa State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5797/1/2023%20Approved%20Budget.pdf", "filename": "Adamawa-State-2023-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5798"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5802"},
        2019: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5804",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5804/3/ADAMAWA-STATE-2019-BUDGET.pdf", "filename": "ADAMAWA-STATE-2019-BUDGET.pdf", "ext": "pdf"}
            ]
        },
    },
    "Akwa_Ibom": {
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6272",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6272/1/Akwa%20Ibom%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Akwa Ibom FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6272/2/Akwa-Ibom-FY-2023-Budget.pdf", "filename": "Akwa-Ibom-FY-2023-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5808"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5809"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5811"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5813"},
    },
    "Anambra": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/5652",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/bitstream/123456789/5652/1/2024-BUDGET-OF-ANAMBRA-STATE.pdf", "filename": "2024-BUDGET-OF-ANAMBRA-STATE.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5815"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5817"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5820"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5821"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5824"},
    },
    "Bauchi": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5657",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5657/1/Bauchi-State-Approved-Budget-2024.pdf", "filename": "Bauchi-State-Approved-Budget-2024.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5838"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5841"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5842"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5846"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5847"},
    },
    "Bayelsa": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5660",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5660/1/APPROVED%20BAYELSA%20BUDGET%202024.pdf", "filename": "APPROVED-BAYELSA-BUDGET-2024.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5854"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5857"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5860"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5861"},
    },
    "Benue": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5664",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5664/1/Benue%202024%20Budget.pdf", "filename": "Benue-2024-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5869"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5868"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5871"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5873"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5876"},
    },
    "Borno": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5668",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5668/1/Borno-State-2024-Approved-Budget.pdf", "filename": "Borno-State-2024-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5882"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5884"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5886"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5888"},
        2019: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5893",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5893/2/Borno-State-2019-Approved-Budget.pdf", "filename": "Borno-State-2019-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
    },
    "Cross_River": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5672",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5672/1/CRS-2024-APPROVED-BUDGET.pdf", "filename": "CRS-2024-APPROVED-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5901",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5901/1/Cross%20River%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Cross River State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5901/2/CROSS-RIVER-STATE-2023-APPROVED-BUDGET.pdf", "filename": "CROSS-RIVER-STATE-2023-APPROVED-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5900"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5899"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5905"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5904"},
    },
    "Delta": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5676",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5676/1/Delta-State-2024-Budget.pdf", "filename": "Delta-State-2024-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5909"},
        2022: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5910",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5910/2/Delta%20State%20FY%202022%20Budget%20-%20Publication%20Version.xlsx", "filename": "Delta State FY 2022 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5910/1/Delta%20-%202022-Budget-Delta-State.pdf", "filename": "Delta-2022-Budget.pdf", "ext": "pdf"}
            ]
        },
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5912"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5914"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5917"},
    },
    "Ebonyi": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5680",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5680/1/EBSG_2024_Approved_Budget.pdf", "filename": "EBSG_2024_Approved_Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/5922",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5922/4/Ebonyi%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Ebonyi State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5922/1/Ebonyi%20State%20Approved_Budget_31_1_2023.pdf", "filename": "Ebonyi-State-2023-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5923",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/bitstream/123456789/5923/3/Ebonyi%20State%20FY%202022%20Budget%20-%20Publication%20Version.xlsx", "filename": "Ebonyi State FY 2022 Budget - Publication Version.xlsx", "ext": "xlsx"}
            ]
        },
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5926"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5927"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5929"},
    },
    "Edo": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5685",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5685/1/2024-Edo-State-Approved-Budget.pdf", "filename": "2024-Edo-State-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5938"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5940"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5942"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5944"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5949"},
    },
    "Ekiti": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5688",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5688/1/Ekiti-State-2024-Approved-Budget.pdf", "filename": "Ekiti-State-2024-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5954"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5958"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5957"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5960"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5968"},
    },
    "Enugu": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5692",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5692/1/Enugu-State-FY-2024-Approved-Budget.pdf", "filename": "Enugu-State-FY-2024-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5978",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5978/1/Enugu%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Enugu State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5978/2/Enugu-State-FY-2023-Approved-Budget.pdf", "filename": "Enugu-State-FY-2023-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5979"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5980"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5982"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5983"},
    },
    "Gombe": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5695",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5695/1/GOMBE-STATE-2024-BUDGET.pdf", "filename": "GOMBE-STATE-2024-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5987"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5989"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5994"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5997"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5999"},
    },
    "Imo": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/5700",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5700/1/IMSG_2024_Budget_ver-Approved.pdf", "filename": "IMSG_2024_Budget_ver-Approved.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/6006",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/bitstream/123456789/6006/1/Imo%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Imo State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/bitstream/123456789/6006/4/IMSG_2023_Consolidated_Budget.pdf", "filename": "IMSG_2023_Consolidated_Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/6007",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6007/4/IMO%20State%20FY%202022%20Budget%20-%20Publication%20Version.xlsx", "filename": "IMO State FY 2022 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6007/2/Imo%20State%202022%20Approved%20Budget.pdf", "filename": "Imo-State-2022-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2021: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/6009",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6009/1/Final%20Imo%20State%20FY%202021%20NCoA%20Complaint%20%20%20Approved%20Budget%20-%20Publication%20Version.xlsx", "filename": "Imo State FY 2021 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6009/3/Imo%20State%202021%20Budget.pdf", "filename": "Imo-State-2021-Budget.pdf", "ext": "pdf"}
            ]
        },
        2020: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/6012",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6012/2/IMSG_2020_Budget%20-%20Imo%20State.pdf", "filename": "IMSG_2020_Budget.pdf", "ext": "pdf"}
            ]
        },
        2019: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/6014",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/bitstream/123456789/6014/2/Imo-State-2019-approved-budget.pdf", "filename": "Imo-State-2019-approved-budget.pdf", "ext": "pdf"}
            ]
        },
    },
    "Jigawa": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5703",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5703/1/Jigawa%20State%20Government_2024%20Fiscal%20Year_Approved%20Budget.pdf", "filename": "Jigawa-State-2024-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6016",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6016/1/Jigawa%20State%20FY%202023%20BUdget%20-%20Publication%20Version.xlsx", "filename": "Jigawa State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6016/2/Jigawa%20State%20Government_Fisacal%20Year%202023%20Budget.pdf", "filename": "Jigawa-State-2023-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6018"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6020"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6023"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6029"},
    },
    "Kaduna": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5707",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5707/1/KADUNA-STATE-2024-APPROVED-BUDGET.pdf", "filename": "KADUNA-STATE-2024-APPROVED-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6031",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6031/2/Kaduna%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Kaduna State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6031/3/upload_pdf_Kaduna%20State%202023%20Budget.pdf", "filename": "Kaduna-State-2023-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6033"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6035"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6037"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6039"},
    },
    "Kano": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5711",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5711/1/KANO-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "KANO-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6045",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6045/2/Kano%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Kano State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6045/3/kano-state-fy-2023-budget-publication-version.pdf", "filename": "kano-state-fy-2023-budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6049",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6049/2/Kano%20State%20FY%202022%20Budget%20-%20Publication%20Version.xlsx", "filename": "Kano State FY 2022 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6049/3/kano-publication-reports-%202022.pdf", "filename": "kano-2022-budget-reports.pdf", "ext": "pdf"}
            ]
        },
        2021: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6047",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6047/3/Final%20Kano%20State%20FY%202021%20NCoA%20Compliant%20Approved%20Budget%20-%20Publication%20Version.xlsx", "filename": "Kano State FY 2021 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6047/1/2021%20KANO%20STATE%20NGF%20APPROVED%20BUDGET.pdf", "filename": "Kano-State-2021-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6051"},
    },
    "Katsina": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5714",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5714/1/KATSINA-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "KATSINA-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6061"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6053"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6055"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6057"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6059"},
    },
    "Kebbi": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5717",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5717/1/KEBBI%20STATE%202024%20APPROVED%20BUDGET.pdf", "filename": "KEBBI-STATE-2024-APPROVED-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6063"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6065"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6067"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6069"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6071"},
    },
    "Kogi": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5721",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5721/1/KOGI-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "KOGI-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6075"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6077"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6079"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6081"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6083"},
    },
    "Kwara": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5725",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5725/1/Kwara%20State%20Approved_Budget_FY_2024.pdf", "filename": "Kwara-State-Approved-Budget-FY-2024.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6090"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6094"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6092"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6097"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6096"},
    },
    "Lagos": {
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6099",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6099/1/Lagos%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Lagos State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6099/2/SIGNED-APPROPRIATION-LAW-2023-IN-NCoA-FORMAT-LSPC-.pdf", "filename": "Lagos-State-2023-Appropriation-Law.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6101"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6104"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6105"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6107"},
    },
    "Nasarawa": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5733",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5733/1/NASARAWA-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "NASARAWA-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6118"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6121"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6122"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6125"},
    },
    "Niger": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5737",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5737/1/NIGER%20STATE%20APPROVED%202024%20BUDGET.pdf", "filename": "NIGER-STATE-APPROVED-2024-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6131"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6133"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6135"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6137"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6140"},
    },
    "Ogun": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5740",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5740/1/OGUN-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "OGUN-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6145",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6145/8/Ogun%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Ogun State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6147"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6149"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6151"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6153"},
    },
    "Ondo": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5744",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5744/1/ONDO-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "ONDO-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6155"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6157"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6159"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6162"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6166"},
    },
    "Osun": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5748",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5748/1/OSUN-State-FY-2024-Budget-Publication.pdf", "filename": "OSUN-State-FY-2024-Budget.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6174"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6173"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6178"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6177"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6181"},
    },
    "Oyo": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5752",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5752/1/OYO-STATE-FY2024-APPROVED-BUDGET.pdf", "filename": "OYO-STATE-FY2024-APPROVED-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6188"},
        2022: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6191",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6191/1/Oyo%20State%20FY%202022%20Budget%20-%20Publication%20Version.xlsx", "filename": "Oyo State FY 2022 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6191/3/OYO-STATE-FY-2022-NCOA-COMPLIANT-APPROVED-BUDGET.pdf", "filename": "OYO-STATE-FY-2022-APPROVED-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6190"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6193"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6197"},
    },
    "Plateau": {
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5756",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5756/1/PLATEAU_STATE_2024_APPROVED_BUDGET.pdf", "filename": "PLATEAU_STATE_2024_APPROVED_BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6201"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6205"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6204"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6207"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6209"},
    },
    "Rivers": {
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6213",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6213/2/RIVERS-STATE-2023-APPROVED-BUDGET-ONLINE-PUBLICATION%20and%20Appropriation%20Law.pdf", "filename": "RIVERS-STATE-2023-APPROVED-BUDGET.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6215"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6217"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6219"},
    },
    "Sokoto": {
        2025: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6969",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6969/1/SOKOTO-State-FY-2025-Budget-Publication-PDF.pdf", "filename": "SOKOTO-State-FY-2025-Budget.pdf", "ext": "pdf"}
            ]
        },
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5763",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5763/1/SOKOTO-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "SOKOTO-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6222",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6222/2/Sokoto%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Sokoto State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6222/1/2023-Approved-Budget-Summary.pdf", "filename": "Sokoto-2023-Approved-Budget-Summary.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6225"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6227"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6228"},
    },
    "Taraba": {
        2025: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6956",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6956/1/TARABA%20State%20FY%202025%20Budget%20Publication.xlsx", "filename": "TARABA State FY 2025 Budget Publication.xlsx", "ext": "xlsx"}
            ]
        },
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5767",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5767/1/TARABA-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "TARABA-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {
            "handle": "https://ngfrepository.org.ng:8443/handle/123456789/6233",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6233/3/Taraba%20State%20FY%202023%20Budget%20-%20Publication%20Version.xlsx", "filename": "Taraba State FY 2023 Budget - Publication Version.xlsx", "ext": "xlsx"},
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6233/2/Taraba%20State%20FY%202023%20Approved%20Budget.pdf", "filename": "Taraba-State-2023-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6235"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6237"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6239"},
    },
    "Yobe": {
        2025: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6918",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6918/1/YOBE%20State%20FY%202025%20Budget%20Publication.xlsx", "filename": "YOBE State FY 2025 Budget Publication.xlsx", "ext": "xlsx"}
            ]
        },
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5772",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5772/1/YOBE-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "YOBE-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6241"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6245"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6244"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6247"},
        2019: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6250"},
    },
    "Zamfara": {
        2025: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6769",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/6769/1/ZAMFARA%20STATE%20FY%202025-Approved-Budget.pdf", "filename": "ZAMFARA-STATE-FY-2025-Approved-Budget.pdf", "ext": "pdf"}
            ]
        },
        2024: {
            "handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/5776",
            "files": [
                {"url": "http://ngfrepository.org.ng:8080/jspui/bitstream/123456789/5776/1/ZAMFARA-STATE-2024-APPROVED-ESTIMATES.pdf", "filename": "ZAMFARA-STATE-2024-APPROVED-ESTIMATES.pdf", "ext": "pdf"}
            ]
        },
        2023: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6264"},
        2022: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6266"},
        2021: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6268"},
        2020: {"handle": "https://ngfrepository.org.ng:8443/jspui/handle/123456789/6270"},
    },
}


def choose_best_files(files):
    """
    Given a list of files, choose the best ones to download.
    Prefer Excel over PDF. If Excel exists, skip PDF of the same budget.
    Skip appropriation laws, citizen budgets, speeches - prefer main budget docs.
    """
    excel_files = [f for f in files if f["ext"] in ("xlsx", "xls")]
    pdf_files = [f for f in files if f["ext"] == "pdf"]
    other_files = [f for f in files if f["ext"] not in ("xlsx", "xls", "pdf")]

    # If we have Excel, prefer it. Also keep PDFs that don't have Excel equivalents.
    if excel_files:
        # Return only the first/main Excel file (the "Publication Version" typically)
        result = [excel_files[0]]
        # Only add PDF if it's a different document (e.g., appropriation law we actually want)
        return result
    elif pdf_files:
        # Filter: prefer budget docs over appropriation laws, speeches, etc.
        budget_pdfs = []
        other_pdfs = []
        for f in pdf_files:
            fname_lower = f["filename"].lower()
            if any(x in fname_lower for x in ["appropriation", "citizen", "speech", "summary", "financial"]):
                other_pdfs.append(f)
            else:
                budget_pdfs.append(f)
        return budget_pdfs[:1] if budget_pdfs else other_pdfs[:1]
    else:
        return other_files[:1]


def process_state(state, years_data):
    """Process all years for a state."""
    state_dir_name = state.replace(" ", "_")
    downloaded = 0
    failed = 0
    skipped = 0

    for year, data in sorted(years_data.items()):
        dest_dir = BASE_DIR / state_dir_name / str(year)
        dest_dir.mkdir(parents=True, exist_ok=True)

        files = data.get("files", [])

        # If no files listed, try scraping the handle page
        if not files and "handle" in data:
            print(f"\n  [{state} {year}] Scraping handle page...")
            files = scrape_handle_page(data["handle"])
            if files:
                print(f"  Found {len(files)} files on handle page")
            else:
                print(f"  No files found on handle page")
                skipped += 1
                continue

        if not files:
            skipped += 1
            continue

        # Choose best files
        best_files = choose_best_files(files)

        for f in best_files:
            url = f["url"]
            filename = f.get("filename", url.split("/")[-1])
            # Clean up filename
            filename = urllib.parse.unquote(filename)
            filename = filename.replace("%20", " ").replace("%28", "(").replace("%29", ")")
            dest_path = dest_dir / filename

            print(f"\n  [{state} {year}] Downloading: {filename}")
            if download_file(url, dest_path):
                downloaded += 1
            else:
                failed += 1

        # Rate limit to be respectful
        time.sleep(0.5)

    return downloaded, failed, skipped


def main():
    print("=" * 70)
    print("NIGERIAN STATE BUDGET DOCUMENT DOWNLOADER")
    print("=" * 70)
    print(f"\nBase directory: {BASE_DIR}")
    print(f"States: {len(NGF_DATA)}")

    total_downloaded = 0
    total_failed = 0
    total_skipped = 0

    for state in sorted(NGF_DATA.keys()):
        years_data = NGF_DATA[state]
        print(f"\n{'=' * 50}")
        print(f"STATE: {state} ({len(years_data)} years)")
        print(f"{'=' * 50}")

        downloaded, failed, skipped = process_state(state, years_data)
        total_downloaded += downloaded
        total_failed += failed
        total_skipped += skipped

        print(f"\n  {state}: {downloaded} downloaded, {failed} failed, {skipped} skipped")

    print(f"\n{'=' * 70}")
    print(f"FINAL SUMMARY")
    print(f"{'=' * 70}")
    print(f"Total downloaded: {total_downloaded}")
    print(f"Total failed: {total_failed}")
    print(f"Total skipped (no files): {total_skipped}")

    # Save a manifest
    manifest = {
        "download_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": "NGF Digital Repository (ngfrepository.org.ng)",
        "total_downloaded": total_downloaded,
        "total_failed": total_failed,
        "states_covered": list(sorted(NGF_DATA.keys())),
    }
    manifest_path = BASE_DIR / "download_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest saved to: {manifest_path}")


if __name__ == "__main__":
    main()
