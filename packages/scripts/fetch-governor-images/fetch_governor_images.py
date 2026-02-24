#!/usr/bin/env python3
"""
Fetch current governor images and bio from nggovernorsforum.org.
Downloads images, converts to base64, and updates metadata.json files.
"""

import json
import os
import glob
import base64
import urllib.request
import urllib.parse
import urllib.error
import ssl
import time
import re
import sys
from html.parser import HTMLParser

BUDGETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "source", "budgets")
BASE_URL = "https://nggovernorsforum.org"

ssl_ctx = ssl.create_default_context()

# Current governors from NGF website - mapped by state
# State name in metadata -> NGF data
NGF_GOVERNORS = {
    "Abia": {
        "ngf_name": "Dr. Alex Otti",
        "metadata_name": "Alex Otti",
        "image_path": "/media/jact/medium/images/Governors/Abia-State---Alex-Otti.jpg",
        "profile_path": "/index.php/the-ngf/governors/571-abia-state-governor",
    },
    "Adamawa": {
        "ngf_name": "Ahmadu Umaru Fintiri",
        "metadata_name": "Ahmadu Umaru Fintiri",
        "image_path": "/media/jact/medium/images/Governors/ADAMAWA_GOV_2020.jpg",
        "profile_path": "/index.php/the-ngf/governors/570-adamawa-state-governor",
    },
    "Akwa_Ibom": {
        "ngf_name": "Pastor Umo Eno",
        "metadata_name": "Umo Bassey Eno",
        "image_path": "/media/jact/medium/images/Governors/Akwa-Ibom---Umo-Eno.png",
        "profile_path": "/index.php/the-ngf/governors/569-akwa-ibom-state-governor",
    },
    "Anambra": {
        "ngf_name": "Charles Chukwuma Soludo CFR",
        "metadata_name": "Charles Chukwuma Soludo",
        "image_path": "/media/jact/medium/images/Governors/Anambra---Charles-Soludo.png",
        "profile_path": "/index.php/the-ngf/governors/568-anambra-state-governor",
    },
    "Bauchi": {
        "ngf_name": "Bala Abdulkadir Mohammed",
        "metadata_name": "Bala Abdulkadir Mohammed",
        "image_path": "/media/jact/medium/images/Governors/BAUCHI_GOV_2020.jpg",
        "profile_path": "/index.php/the-ngf/governors/567-bauchi-state-governor",
    },
    "Bayelsa": {
        "ngf_name": "Douye Diri",
        "metadata_name": "Douye Diri",
        "image_path": "/media/jact/medium/images/Governors/Diri_Duoye_Bayelsa_Gov.jpg",
        "profile_path": "/index.php/the-ngf/governors/566-bayelsa-state-governor",
    },
    "Benue": {
        "ngf_name": "Rev. Fr. Hyacinth Alia",
        "metadata_name": "Hyacinth Iormem Alia",
        "image_path": "/media/jact/medium/images/Governors/Benue-State---Hycinth-Alia.jpg",
        "profile_path": "/index.php/the-ngf/governors/565-benue-state-governor",
    },
    "Borno": {
        "ngf_name": "Engr. Prof. Babagana Umara Zulum",
        "metadata_name": "Babagana Umara Zulum",
        "image_path": "/media/jact/medium/images/Governors/BORNO_GOV_2020.jpg",
        "profile_path": "/index.php/the-ngf/governors/564-borno-state-governor",
    },
    "Cross_River": {
        "ngf_name": "Bassey Edet Otu",
        "metadata_name": "Bassey Edet Otu",
        "image_path": "/media/jact/medium/images/Governors/Cross-River-State---Bassey-Otu---2.jpeg",
        "profile_path": "/index.php/the-ngf/governors/563-cross-river-state-governor",
    },
    "Delta": {
        "ngf_name": "Rt. Hon. Sheriff Oborevwori",
        "metadata_name": None,  # Not in current metadata as governor
        "image_path": "/media/jact/medium/images/Governors/Delta-State---Sheriff-Oborevwori.jpg",
        "profile_path": "/index.php/the-ngf/governors/562-delta-state-governor",
    },
    "Ebonyi": {
        "ngf_name": "Francis Nwifuru",
        "metadata_name": None,
        "image_path": "/media/jact/medium/images/Governors/Ebonyi-State---Francis-Nwifuru.jpg",
        "profile_path": "/index.php/the-ngf/governors/561-ebonyi-state-governor",
    },
    "Edo": {
        "ngf_name": "Monday Okpebholo",
        "metadata_name": "Monday Okpebholo",
        "image_path": "/media/jact/medium/images/2024_Gallery/Monday_Okpebholo_Gov._Edo_State.jpg",
        "profile_path": "/index.php/the-ngf/governors/560-edo-state-governor",
    },
    "Ekiti": {
        "ngf_name": "Abiodun Oyebanji",
        "metadata_name": "Biodun Abayomi Oyebanji",
        "image_path": "/media/jact/medium/images/Governors/Ekiti-State---Biodun-Oyebanji.jpg",
        "profile_path": "/index.php/the-ngf/governors/559-ekiti-state-governor",
    },
    "Enugu": {
        "ngf_name": "Peter Mbah",
        "metadata_name": "Peter Ndubuisi Mbah",
        "image_path": "/media/jact/medium/images/Governors/Enugu-State---Peter-Mbah.jpg",
        "profile_path": "/index.php/the-ngf/governors/558-enugu-state-governor",
    },
    "Gombe": {
        "ngf_name": "Alhaji Muhammad Inuwa Yahaya",
        "metadata_name": "Muhammad Inuwa Yahaya",
        "image_path": "/media/jact/medium/images/Governors/GOMBE_GOV_2020.jpg",
        "profile_path": "/index.php/the-ngf/governors/557-gombe-state-governor",
    },
    "Imo": {
        "ngf_name": "Hope Odidika Uzodinma",
        "metadata_name": "Hope Uzodimma",
        "image_path": "/media/jact/medium/images/Governors/H.E_Hope_Odidika_Uzodinma.jpg",
        "profile_path": "/index.php/the-ngf/governors/556-imo-state-governor",
    },
    "Jigawa": {
        "ngf_name": "Umar Namadi",
        "metadata_name": "Umar Namadi",
        "image_path": "/media/jact/medium/images/Governors/Jigawa-State---Umar-Namadi.png",
        "profile_path": "/index.php/the-ngf/governors/555-jigawa-state-governor",
    },
    "Kaduna": {
        "ngf_name": "Uba Sani",
        "metadata_name": "Uba Sani",
        "image_path": "/media/jact/medium/images/Governors/Kaduna-State---Uba-Sani.png",
        "profile_path": "/index.php/the-ngf/governors/554-kaduna-state-governor",
    },
    "Kano": {
        "ngf_name": "Abba Kabir Yusuf",
        "metadata_name": "Abba Kabir Yusuf",
        "image_path": "/media/jact/medium/images/Governors/Kano-State---Abba-Kabir-Yusuf.jpeg",
        "profile_path": "/index.php/the-ngf/governors/553-kano-state-governor",
    },
    "Katsina": {
        "ngf_name": "Dikko Umar Radda",
        "metadata_name": "Dikko Umaru Radda",
        "image_path": "/media/jact/medium/images/Governors/Katsina-State---Dikko-Umar-Radda.jpg",
        "profile_path": "/index.php/the-ngf/governors/552-katsina-state-governor",
    },
    "Kebbi": {
        "ngf_name": "Dr. Nasir Idris",
        "metadata_name": "Nasir Idris",
        "image_path": "/media/jact/medium/images/Governors/Kebbi-State--Nasir-Idris-2.jpg",
        "profile_path": "/index.php/the-ngf/governors/551-kebbi-state-governor",
    },
    "Kogi": {
        "ngf_name": "Alhaji Ahmed Usman Ododo",
        "metadata_name": "Ahmed Usman Ododo",
        "image_path": "/media/jact/medium/images/Governors/Kogi_State_-_Ahmed_Usman_Ododo.jpg",
        "profile_path": "/index.php/the-ngf/governors/550-kogi-state-governor",
    },
    "Kwara": {
        "ngf_name": "AbdulRahman AbdulRazaq",
        "metadata_name": "AbdulRahman AbdulRazaq",
        "image_path": "/media/jact/medium/images/Governors/KWARA_GOV_2020.jpg",
        "profile_path": "/index.php/the-ngf/governors/549-kwara-state-governor",
    },
    "Lagos": {
        "ngf_name": "Babajide Olusola Sanwo-Olu",
        "metadata_name": "Babajide Olusola Sanwo-Olu",
        "image_path": "/media/jact/medium/images/Governors/Lagos-State---Babajide-Sanwo-Olu.png",
        "profile_path": "/index.php/the-ngf/governors/548-lagos-state-governor",
    },
    "Nasarawa": {
        "ngf_name": "Engineer Abdullahi Sule",
        "metadata_name": "Abdullahi Audu Sule",
        "image_path": "/media/jact/medium/images/Governors/NASARAWA_GOV_2020.jpg",
        "profile_path": "/index.php/the-ngf/governors/547-nassarawa-state-governor",
    },
    "Niger": {
        "ngf_name": "Mohammed Umar Bago",
        "metadata_name": "Mohammed Umar Bago",
        "image_path": "/media/jact/medium/images/Governors/Niger-State---Mohammed-Umar-Bago.png",
        "profile_path": "/index.php/the-ngf/governors/546-niger-state-governor",
    },
    "Ogun": {
        "ngf_name": "Prince Dapo Abiodun",
        "metadata_name": "Dapo Abiodun",
        "image_path": "/media/jact/medium/images/Governors/Gov_DapoAbiodun_Ogun.JPG",
        "profile_path": "/index.php/the-ngf/governors/545-ogun-state-governor",
    },
    "Ondo": {
        "ngf_name": "Lucky Orimisan Aiyedatiwa",
        "metadata_name": "Lucky Aiyedatiwa",
        "image_path": "/media/jact/medium/images/Governors/Ondo_State_-_Lucky_Orimisan_Aiyedatiwa.png",
        "profile_path": "/index.php/the-ngf/governors/544-ondo-state-governor",
    },
    "Osun": {
        "ngf_name": "Ademola Adeleke",
        "metadata_name": "Ademola Adeleke",
        "image_path": "/media/jact/medium/images/Governors/Osun-State---Ademola-Adeleke.jpeg",
        "profile_path": "/index.php/the-ngf/governors/543-osun-state-governor",
    },
    "Oyo": {
        "ngf_name": "Engr. Seyi Abiodun Makinde",
        "metadata_name": "Seyi Makinde",
        "image_path": "/media/jact/medium/images/Governors/OYO_GOV_2020.jpg",
        "profile_path": "/index.php/the-ngf/governors/542-oyo-state-governor",
    },
    "Plateau": {
        "ngf_name": "Caleb Manasseh Mutfwang",
        "metadata_name": "Caleb Mutfwang",
        "image_path": "/media/jact/medium/images/Governors/Plateau-State---Caleb-Mutfwang.png",
        "profile_path": "/index.php/the-ngf/governors/541-plateau-state-governor",
    },
    "Rivers": {
        "ngf_name": "Siminalayi Fubara",
        "metadata_name": "Siminalayi Fubara",
        "image_path": "/media/jact/medium/images/Governors/Rivers-State---Siminalayi-Fubara.jpg",
        "profile_path": "/index.php/the-ngf/governors/540-rivers-state-governor",
    },
    "Sokoto": {
        "ngf_name": "Ahmad Aliyu Sokoto",
        "metadata_name": "Ahmad Aliyu",
        "image_path": "/media/jact/medium/images/Governors/Sokoto-State---Ahmad-Aliyu.jpg",
        "profile_path": "/index.php/the-ngf/governors/539-sokoto-state-governor",
    },
    "Taraba": {
        "ngf_name": "Agbu Kefas",
        "metadata_name": "Agbu Kefas",
        "image_path": "/media/jact/medium/images/Governors/Taraba-State---Agbu-Kefas.png",
        "profile_path": "/index.php/the-ngf/governors/538-taraba-state-governor",
    },
    "Yobe": {
        "ngf_name": "Hon. Mai Mala Buni",
        "metadata_name": "Mai Mala Buni",
        "image_path": "/media/jact/medium/images/Governors/Yobe-State---Mai-Mala-Buni.jpg",
        "profile_path": "/index.php/the-ngf/governors/537-yobe-state-governor",
    },
    "Zamfara": {
        "ngf_name": "Dauda Lawal",
        "metadata_name": "Dauda Lawal",
        "image_path": "/media/jact/medium/images/Governors/Zamfara-State---Dauda-Lawal.jpg",
        "profile_path": "/index.php/the-ngf/governors/536-zamfara-state-governor",
    },
}


def normalize_name(name):
    """Normalize a name for comparison by removing titles and lowercasing."""
    if not name:
        return ""
    # Remove common titles/prefixes
    prefixes = [
        "dr.", "dr", "prof.", "prof", "engr.", "engr", "hon.", "hon",
        "alhaji", "prince", "pastor", "rev.", "rev", "fr.", "fr",
        "rt.", "rt", "cfr", "con", "gcon", "mfr", "ofr",
    ]
    parts = name.lower().strip().split()
    filtered = [p for p in parts if p.strip(".") not in prefixes]
    return " ".join(filtered)


def names_match(name1, name2):
    """Check if two names refer to the same person."""
    if not name1 or not name2:
        return False
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)
    if n1 == n2:
        return True
    # Check if one name contains all parts of the other
    parts1 = set(n1.split())
    parts2 = set(n2.split())
    # At least 2 name parts must overlap
    overlap = parts1 & parts2
    if len(overlap) >= 2:
        return True
    # Check if surname matches (last part)
    if n1.split()[-1] == n2.split()[-1] and len(parts1 & parts2) >= 1:
        return True
    return False


def download_image(url):
    """Download an image and return (content_type, raw_bytes)."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                              "AppleWebKit/537.36 (KHTML, like Gecko) "
                              "Chrome/120.0.0.0 Safari/537.36",
            },
        )
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
            image_bytes = resp.read()
            content_type = resp.headers.get("Content-Type", "image/jpeg")
            return content_type, image_bytes
    except Exception as e:
        print(f"  ERROR downloading {url}: {e}")
        return None, None


def image_to_base64_blob(content_type, image_bytes):
    """Convert image bytes to a base64 data URI string."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{content_type};base64,{b64}"


def process_governors():
    """Main processing function."""
    # Find all metadata files
    files = sorted(glob.glob(os.path.join(BUDGETS_DIR, "**/metadata.json"), recursive=True))
    print(f"Found {len(files)} metadata files")
    print(f"Processing {len(NGF_GOVERNORS)} current governors from NGF\n")

    # Download images for each governor (once per state)
    image_cache = {}  # state -> {image_url, image_blob}

    for state, ngf_data in sorted(NGF_GOVERNORS.items()):
        image_url = BASE_URL + ngf_data["image_path"]
        profile_url = BASE_URL + ngf_data["profile_path"]

        print(f"Downloading image for {ngf_data['ngf_name']} ({state})...")
        content_type, image_bytes = download_image(image_url)

        if image_bytes:
            blob = image_to_base64_blob(content_type, image_bytes)
            image_cache[state] = {
                "image_url": image_url,
                "image_blob": blob,
                "profile_url": profile_url,
            }
            size_kb = len(image_bytes) / 1024
            print(f"  OK - {size_kb:.1f}KB downloaded")
        else:
            print(f"  FAILED to download")

        time.sleep(0.3)

    print(f"\nSuccessfully downloaded {len(image_cache)} governor images\n")

    # Now update metadata files
    updated_count = 0
    skipped_count = 0

    for filepath in files:
        with open(filepath) as f:
            data = json.load(f)

        state = data.get("state", "")
        year = data.get("year", "")
        governor = data.get("governor", {})
        gov_name = governor.get("name", "") if isinstance(governor, dict) else ""

        if not state or not gov_name:
            continue

        # Check if this governor matches the current NGF governor
        ngf_data = NGF_GOVERNORS.get(state)
        if not ngf_data:
            continue

        cached = image_cache.get(state)
        if not cached:
            continue

        # Match the governor name
        if names_match(gov_name, ngf_data["ngf_name"]) or names_match(gov_name, ngf_data.get("metadata_name", "")):
            governor["image_url"] = cached["image_url"]
            governor["image_blob"] = cached["image_blob"]
            governor["profile_url"] = cached["profile_url"]

            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)

            updated_count += 1
            print(f"Updated: {state}/{year} - {gov_name}")
        else:
            skipped_count += 1

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Governor images downloaded: {len(image_cache)}")
    print(f"Metadata files updated: {updated_count}")
    print(f"Metadata files skipped (different governor): {skipped_count}")


if __name__ == "__main__":
    process_governors()
