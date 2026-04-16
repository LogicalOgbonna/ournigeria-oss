#!/usr/bin/env python3
"""
Download Nigerian State Budget Implementation Reports
Organizes into: packages/source/budgets/{State}/{Year}/implementation_report_q{N}.pdf
"""

import os
import time
import urllib.request
import urllib.error
import ssl
import json
from pathlib import Path

BASE_DIR = Path("packages/source/budgets")

# All verified direct PDF download links organized by state
DOWNLOADS = {
    "Abia": [
        {"year": 2025, "quarter": 4, "url": "https://abiastate.gov.ng/wp-content/uploads/2026/01/Abia-State-BIR4-C-BPR-Publication-TemplateTeamIb-4th-Quarter-CR.pdf"},
        {"year": 2024, "quarter": 3, "url": "https://abiastate.gov.ng/wp-content/uploads/2024/10/Abia-Q3-Budget-Performance-Report-FinalTeamIbe-CR-Final.pdf"},
        {"year": 2023, "quarter": 4, "url": "https://abiastate.gov.ng/wp-content/uploads/2024/09/2023_ABIA-STATE_BUDGET-PERFORMANCE-REPORT-QUARTER-4-2023-Publication_vFinal.pdf"},
    ],
    "Akwa_Ibom": [
        {"year": 2024, "quarter": 2, "url": "https://www.aksbudgetoffice.ak.gov.ng/budgets/Appraisal%20of%20Implementation%20of%20Budget2/AKWA%20IBOM%20STATE%202024%20Q2%20BPR.pdf"},
    ],
    "Anambra": [
        {"year": 2024, "quarter": 4, "url": "https://anambrastate.gov.ng/wp-content/uploads/Anambra-State-2024-Q4-BPR.pdf"},
    ],
    "Bauchi": [
        {"year": 2023, "quarter": 4, "url": "https://www.bauchistate.gov.ng/wp-content/uploads/2024/01/Bauchi-State-2023-Q4-Budget-Performance-Report-1.pdf"},
    ],
    "Bayelsa": [
        {"year": 2024, "quarter": 1, "url": "https://www.mof.by.gov.ng/uploads/Bayelsa%20BPR%20Q1%202024.pdf"},
        {"year": 2024, "quarter": 3, "url": "https://www.mof.by.gov.ng/uploads/Bayelsa%20BPR%20Q3%202024.pdf"},
        {"year": 2021, "quarter": 2, "url": "https://www.mof.by.gov.ng/uploads/Bayelsa%20State%202021%20Q2%20Budget%20Performance%20Report.pdf"},
    ],
    "Borno": [
        {"year": 2022, "quarter": 2, "url": "https://pfm.bo.gov.ng/wp-content/uploads/2022/07/Borno-State-Budget-Performance-Report-Q2.pdf"},
    ],
    "Cross_River": [
        {"year": 2025, "quarter": 2, "url": "https://www.crossriverstate.gov.ng/download/Budget/CRS%202025%20Q2%20BIR-1.pdf"},
    ],
    "Delta": [
        {"year": 2024, "quarter": 3, "url": "https://deltastate.gov.ng/wp-content/uploads/2024/10/Delta-State-Budget-Performance-Report-Qtr-3-2024.pdf"},
        {"year": 2023, "quarter": 4, "url": "https://www.deltastate.gov.ng/wp-content/uploads/2024/03/BPR-FOURTH-QUARTER-2023_PUBLISHED-2.pdf"},
    ],
    "Ebonyi": [
        {"year": 2025, "quarter": 2, "url": "https://www.ebonyistate.gov.ng/storage/documents/min-1-ebsg-2025-q2-budget-implementation-reportpdf-1753699591.pdf"},
        {"year": 2024, "quarter": 4, "url": "https://ebonyistate.gov.ng/storage/documents/min-1-ebonyi-state-government-4th-quarter-2024-budget-implementation-report-compressedpdf-1738096711.pdf"},
        {"year": 2024, "quarter": 2, "url": "https://ebonyistate.gov.ng/storage/documents/min-2-ebonyi-state-government-2024-2nd-quarter-budget-implementation-reportpdf-1735680424.pdf"},
        {"year": 2024, "quarter": 1, "url": "https://ebonyistate.gov.ng/storage/documents/min-2-ebsg-2024-q1-budgmet-implementation-report-final-1-240428-203229pdf-1730825702.pdf"},
    ],
    "Ekiti": [
        {"year": 2025, "quarter": 1, "url": "https://www.ekitistate.gov.ng/wp-content/uploads/2025/2025_Q1.pdf"},
        {"year": 2024, "quarter": 4, "url": "https://ekitistate.gov.ng/wp-content/uploads/2024/2024Q4.pdf"},
    ],
    "Enugu": [
        {"year": 2025, "quarter": 2, "url": "https://mbp.en.gov.ng/wp-content/uploads/Enugu-State-2025-Q2-BPR.pdf"},
        {"year": 2023, "quarter": 4, "url": "https://mbp.en.gov.ng/wp-content/uploads/Enugu-State-Q4-2023-BPR.pdf"},
        {"year": 2023, "quarter": 3, "url": "https://mbp.en.gov.ng/wp-content/uploads/3rd-Quarter_opt-1.pdf"},
    ],
    "Gombe": [
        {"year": 2024, "quarter": 4, "url": "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/documents/dataset_GOMBE%20STATE%20QUARTER%20FOUR%20BUDGET%20IMPLEMENTATION%20REPORT%20FOR%20THE%20YEAR%202024.pdf"},
    ],
    "Imo": [
        {"year": 2024, "quarter": 2, "url": "https://axxpoint.imostate.gov.ng/pdf/IMSG_2024_Q2_Budget_Report.pdf?ver=056"},
        {"year": 2023, "quarter": 3, "url": "https://axxpoint.imostate.gov.ng/pdf/IMSG_2023_Q3_Budget_Report.pdf?ver=081"},
        {"year": 2023, "quarter": 2, "url": "https://axxpoint.imostate.gov.ng/pdf/IMSG_2023_Q2_Budget_Report.pdf"},
    ],
    "Jigawa": [
        {"year": 2025, "quarter": 3, "url": "https://www.jigawastate.gov.ng/uploads/Jigawa%20State%20Government_Budget%20Implementation%20Report%20(BIR)_Third%20Quarter%20(Q3)%202025.pdf"},
        {"year": 2024, "quarter": 4, "url": "https://jigawastate.gov.ng/uploads/Jigawa%20State%20Governement_Fourth%20(Q4th)%20Quarter%202024_Budget%20Implementation%20Performance%20Report.pdf"},
        {"year": 2024, "quarter": 3, "url": "https://www.jigawastate.gov.ng/uploads/Jigawa%20State%20Governement_Third%20Quarter%20(Q3rd)_2024%20Budget%20Implementation%20Performance%20Report.pdf"},
        {"year": 2022, "quarter": 1, "url": "https://www.jigawastate.gov.ng/budget/Jigawa%20State%202022%20Q1.%20Budget%20Implementation%20Report.pdf"},
    ],
    "Kebbi": [
        {"year": 2025, "quarter": 3, "url": "https://www.kebbistate.gov.ng/sites/default/files/Kebbi%20BPR%20Publication%20October%2028%202025%20NDK%20UO%20CR.pdf"},
        {"year": 2025, "quarter": 2, "url": "https://www.kebbistate.gov.ng/sites/default/files/2025%20Budget%20Performance%20Report%20Quarter%202.pdf"},
    ],
    "Kwara": [
        {"year": 2020, "quarter": 4, "url": "https://kwarastate.gov.ng/wp-content/uploads/KWARA-STATE-2020-4TH-QUARTER-BUDGET-IMPLEMENTATION-PERFORMANCE.pdf"},
        {"year": 2019, "quarter": 4, "url": "https://kwarastate.gov.ng/wp-content/uploads/2019-Q4-Budget-Implementation-Performance.pdf"},
    ],
    "Lagos": [
        {"year": 2025, "quarter": 1, "url": "https://lagosmepb.org/wp-content/uploads/Y2025-Lagos-State-Budget-Implementation-Report-FY25.pdf"},
    ],
    "Niger": [
        {"year": 2025, "quarter": 2, "url": "https://nogp.nigerstate.gov.ng/wp-content/uploads/NIGER-STATE-BUDGET-PERFORMANCE-REPORT-SECOND-QUARTER-2025.pdf"},
        {"year": 2023, "quarter": 4, "url": "https://nogp.nigerstate.gov.ng/wp-content/uploads/2024/01/NIGER-STATE-BUDGET-PERFORMANCE-REPORT-FOUTH-QUARTER-2023.pdf"},
    ],
    "Ogun": [
        {"year": 2025, "quarter": 1, "url": "https://api.ogunstate.gov.ng/archive/OGUNSTATEQ12025BIR3-CBPRPublicationTemplateWORDDOCUMENT2FINALCHRIS27FEB.pdf"},
        {"year": 2025, "quarter": 2, "url": "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/documents/dataset_OGUN%20STATE%20SECOND%20QUARTER%20BUDGET%20IMPLEMENTATION%20REPORT%20FOR%20THE%20YEAR%202025.pdf"},
    ],
    "Ondo": [
        {"year": 2025, "quarter": 2, "url": "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/documents/dataset_ONDO%20STATE%20SECOND%20QUARTER%20BUDGET%20IMPLEMENTATION%20REPORT%20FOR%20THE%20YEAR%202025.pdf"},
    ],
    "Oyo": [
        {"year": 2025, "quarter": 2, "url": "https://budget.oyostate.gov.ng/wp-content/uploads/2025/07/OYO-STATE-BUDGET-PERFORMANCE-REPORT-FOR-YEAR-2025-SECOND-QUARTER.pdf"},
    ],
    "Plateau": [
        {"year": 2024, "quarter": 1, "url": "https://www.plateaustate.gov.ng/uploads/PLATEAU_STATE_2024_BUDGET_PERFORMANCE_REPORT_Q1.pdf"},
        {"year": 2024, "quarter": 4, "url": "https://www.plateaustate.gov.ng/uploads/PLATEAU_STATE_2024_Q4_BUDGET_PERFORMANCE_REPORT.pdf"},
    ],
    "Rivers": [
        {"year": 2023, "quarter": 4, "url": "https://www.riversstate.gov.ng/wp-content/uploads/2020/07/2023-Q4-Budget-Performance-Report-BPR-Word-Publication-Template-NEW-1-1_compressed-1.pdf"},
        {"year": 2023, "quarter": 2, "url": "https://www.riversstate.gov.ng/wp-content/uploads/2020/07/Rivers-State-2023-Q2-Budget-Performance-Report-CR.pdf"},
        {"year": 2021, "quarter": 4, "url": "https://www.riversstate.gov.ng/wp-content/uploads/2022/07/Rivers-State-Q4-BPR-2021-27-01-2022.pdf"},
    ],
    "Sokoto": [
        {"year": 2025, "quarter": 4, "url": "https://sokotostate.gov.ng/wp-content/uploads/2026/01/Sokoto-State-2025-Q4-BIRCN-CR-Updated-final-Published.pdf"},
        {"year": 2025, "quarter": 3, "url": "https://sokotostate.gov.ng/wp-content/uploads/2025/10/Sokoto-State-2025-Q3-BIRCN-CR-Final.pdf"},
        {"year": 2025, "quarter": 2, "url": "https://sokotostate.gov.ng/wp-content/uploads/2025/07/Sokoto-State-2025-Q2-BIRCN-CR-final.pdf"},
        {"year": 2025, "quarter": 1, "url": "https://sokotostate.gov.ng/wp-content/uploads/2025/04/Sokoto-State-2025-Q1-BIR3-C-BPR-Publication-Template-WL-APRIL-2025-2CN_updated-CR.pdf"},
        {"year": 2024, "quarter": 4, "url": "https://sokotostate.gov.ng/wp-content/uploads/2025/01/BPR3-C-BPR-Publication-Q4-2024-cR.pdf"},
    ],
    "Taraba": [
        {"year": 2025, "quarter": 3, "url": "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/documents/dataset_TARABA%20STATE%20THIRD%20QUARTER%20BUDGET%20IMPLEMENTATION%20REPORT%20DOCUMENT%20FOR%20THE%20YEAR%202025.pdf"},
        {"year": 2024, "quarter": 3, "url": "https://s3.eu-west-2.amazonaws.com/openstates.ng.storage/documents/dataset_TARABA_STATE_3rd_QUARTER_2024_BUDGET_PERFORMANCE_REPORT-NEW.pdf"},
    ],
    "Yobe": [
        {"year": 2025, "quarter": 1, "url": "https://budget.pfm.yb.gov.ng/wp-content/uploads/2025/04/Yobe-State-Q1-BIR-2025-final-1.pdf"},
        {"year": 2024, "quarter": 2, "url": "http://budget.pfm.yb.gov.ng/wp-content/uploads/2024/07/Yobe-State-Q2-2024-BPR-final.pdf"},
        {"year": 2019, "quarter": 4, "url": "http://budget.pfm.yb.gov.ng/wp-content/uploads/2023/12/FOURTH-QUARTER-BUDGET-PERFORMANCE-2019.pdf"},
    ],
    "Zamfara": [
        {"year": 2025, "quarter": 4, "url": "https://zamfara.gov.ng/wp-content/uploads/2026/01/Zamfara-State-2025-Q4-Budget-Performance-Report.pdf"},
        {"year": 2025, "quarter": 3, "url": "https://zamfara.gov.ng/wp-content/uploads/2025/10/Zamfara-State-2025-Q3-BIR-Updated_Final-28.10.2025.pdf"},
        {"year": 2025, "quarter": 2, "url": "https://zamfara.gov.ng/wp-content/uploads/2025/07/Zamfara-State-Second-Quarter-2025-Budget-Performance-Report.pdf"},
        {"year": 2025, "quarter": 1, "url": "https://zamfara.gov.ng/wp-content/uploads/2025/04/Zamfara-State-2025-First-Quarter-Budget-Performance-Report.pdf"},
        {"year": 2024, "quarter": 4, "url": "https://zamfara.gov.ng/wp-content/uploads/2025/01/Zamfara-State-2024-Fourth-Quarter-Budget-Performance.pdf"},
        {"year": 2024, "quarter": 3, "url": "https://zamfara.gov.ng/wp-content/uploads/2024/10/Zamfara-State-2024-Q3-Budget-Performance-Report.pdf"},
        {"year": 2024, "quarter": 2, "url": "https://zamfara.gov.ng/wp-content/uploads/2024/07/Zamfara-State-2024-Second-Quarter-Budget-Performance-Report.pdf"},
        {"year": 2023, "quarter": 4, "url": "https://zamfara.gov.ng/wp-content/uploads/2024/01/Zamfara-State-FY-2023-Q4-BPR.pdf"},
    ],
}

# States with no direct PDF links - only portal pages (create placeholder dirs)
PORTAL_ONLY_STATES = [
    "Adamawa", "Benue", "Edo", "Kaduna", "Kano", "Katsina",
    "Kogi", "Nasarawa", "Osun", "FCT"
]


def create_ssl_context():
    """Create a permissive SSL context for government sites with cert issues."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def download_file(url, filepath, timeout=60):
    """Download a file from URL to filepath with proper error handling."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/pdf,*/*",
        })
        ctx = create_ssl_context()
        response = urllib.request.urlopen(req, timeout=timeout, context=ctx)

        with open(filepath, "wb") as f:
            data = response.read()
            f.write(data)

        file_size = os.path.getsize(filepath)
        if file_size < 1000:  # Less than 1KB probably not a real PDF
            os.remove(filepath)
            return False, f"File too small ({file_size} bytes) - likely an error page"

        return True, f"OK ({file_size:,} bytes)"

    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, f"URL Error: {e.reason}"
    except Exception as e:
        return False, f"Error: {str(e)}"


def main():
    # Track results
    results = {"success": [], "failed": [], "skipped": []}
    total = sum(len(reports) for reports in DOWNLOADS.values())

    print(f"=" * 70)
    print(f"Nigerian State Budget Implementation Reports Downloader")
    print(f"=" * 70)
    print(f"Total reports to download: {total}")
    print(f"Target directory: {BASE_DIR}")
    print(f"=" * 70)
    print()

    # Create directories for portal-only states
    for state in PORTAL_ONLY_STATES:
        state_dir = BASE_DIR / state
        state_dir.mkdir(parents=True, exist_ok=True)
        readme_path = state_dir / "README.md"
        if not readme_path.exists():
            with open(readme_path, "w") as f:
                f.write(f"# {state} State Budget Implementation Reports\n\n")
                f.write(f"No direct PDF download links available.\n")
                f.write(f"Visit the state's official budget portal to download reports manually.\n")
                f.write(f"See /workspace/nigerian_state_budget_implementation_reports.md for portal URLs.\n")

    # Download reports
    count = 0
    for state, reports in sorted(DOWNLOADS.items()):
        print(f"\n--- {state.replace('_', ' ')} State ---")

        for report in sorted(reports, key=lambda r: (r["year"], r["quarter"])):
            count += 1
            year = report["year"]
            quarter = report["quarter"]
            url = report["url"]
            filename = f"implementation_report_q{quarter}.pdf"

            # Create directory
            target_dir = BASE_DIR / state / str(year)
            target_dir.mkdir(parents=True, exist_ok=True)
            filepath = target_dir / filename

            # Check if already downloaded
            if filepath.exists() and filepath.stat().st_size > 1000:
                print(f"  [{count}/{total}] {year}/Q{quarter}: Already exists, skipping")
                results["skipped"].append(f"{state}/{year}/Q{quarter}")
                continue

            print(f"  [{count}/{total}] {year}/Q{quarter}: Downloading...", end=" ", flush=True)

            success, message = download_file(url, str(filepath))

            if success:
                print(f"SUCCESS - {message}")
                results["success"].append(f"{state}/{year}/Q{quarter}")
            else:
                print(f"FAILED - {message}")
                results["failed"].append({"state": state, "year": year, "quarter": quarter, "url": url, "error": message})

            # Small delay between downloads to be respectful
            time.sleep(0.5)

    # Print summary
    print(f"\n{'=' * 70}")
    print(f"DOWNLOAD SUMMARY")
    print(f"{'=' * 70}")
    print(f"Successful: {len(results['success'])}")
    print(f"Failed:     {len(results['failed'])}")
    print(f"Skipped:    {len(results['skipped'])}")
    print(f"Total:      {total}")

    if results["failed"]:
        print(f"\n--- Failed Downloads ---")
        for item in results["failed"]:
            print(f"  {item['state']}/{item['year']}/Q{item['quarter']}: {item['error']}")
            print(f"    URL: {item['url']}")

    # Save results to JSON for reference
    results_path = BASE_DIR / "download_results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {results_path}")

    # Save failed URLs for retry
    if results["failed"]:
        failed_path = BASE_DIR / "failed_downloads.json"
        with open(failed_path, "w") as f:
            json.dump(results["failed"], f, indent=2)
        print(f"Failed downloads saved to: {failed_path}")


if __name__ == "__main__":
    main()
