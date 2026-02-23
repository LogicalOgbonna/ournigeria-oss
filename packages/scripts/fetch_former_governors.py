#!/usr/bin/env python3
"""
Fetch former governor images from nggovernorsforum.org/media/jact/medium/images/Governors/
Maps governor names to image filenames and updates metadata.json files.
"""

import json
import os
import glob
import base64
import urllib.request
import ssl
import time

BUDGETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "source", "budgets")
BASE_URL = "https://nggovernorsforum.org"
IMG_DIR = "/media/jact/medium/images/Governors/"

ssl_ctx = ssl.create_default_context()

# Mapping: (state_in_metadata, governor_name) -> image filename from NGF directory
FORMER_GOVERNORS = {
    ("Abia", "Okezie Victor Ikpeazu"): "Abia---Okezie-Ikpeazu.jpg",
    ("Akwa Ibom", "Udom Gabriel Emmanuel"): "Akwa_Ibom_-_Udom_Emmanuel.jpg",
    ("Anambra", "Willie Obiano"): "Anambra_-_Willie_Obiano.jpg",
    ("Bayelsa", "Henry Seriake Dickson"): "Gov_Dickson_Bayelsa.jpeg",
    ("Benue", "Samuel Ortom"): "Benue_-_Samuel-Ortom.jpg",
    ("Cross River", "Bassey Edet Otu"): "Cross-River-State---Bassey-Otu---2.jpeg",
    ("Cross River", "Benedict Ayade"): "Gov_Ayade_CrossRiver.JPG",
    ("Delta", "Ifeanyi Arthur Okowa"): "Delta_-_Ifeanyi_Okowa.jpg",
    ("Ebonyi", "David Nweze Umahi"): "Umahi_Ebonyi_Gov.jpg",
    ("Edo", "Godwin Nogheghase Obaseki"): "Gov_GodwinObaseki_EDO.jpg",
    ("Ekiti", "John Kayode Fayemi"): "Kayode-Fayemi.jpg",
    ("Enugu", "Ifeanyi Ugwuanyi"): "Enugu_-_Ugwuanyi.jpg",
    ("FCT", "Muhammad Musa Bello"): None,  # No image found in directory
    ("Gombe", "Ibrahim Hassan Dankwambo"): "Gombe_-_Dankwambo.jpg",
    ("Imo", "Rochas Okorocha"): "Imo-Rochas_Okorocha.jpg",
    ("Jigawa", "Mohammed Badaru Abubakar"): "Jigawa_-_Badaru_Abubakar.jpg",
    ("Kaduna", "Nasir Ahmad el-Rufai"): "Gov_El-Rufai.jpg",
    ("Kano", "Abdullahi Umar Ganduje"): "Gov_Abdullahi_Ganduje.jpg",
    ("Katsina", "Aminu Bello Masari"): "Gov_Masari_Katsina.JPG",
    ("Kebbi", "Abubakar Atiku Bagudu"): "Gov_Bagudu_kebbiState.jpg",
    ("Kogi", "Yahaya Bello"): "Yahaya-Bello.jpg",
    ("Kwara", "Abdulfatah Ahmed"): "Kwara_-_Abdulfatah_Ahmed.jpg",
    ("Lagos", "Akinwunmi Ambode"): "Lagos_-_Ambode.jpg",
    ("Nasarawa", "Umaru Tanko Al-Makura"): "Nasarawa.jpg",
    ("Niger", "Abubakar Sani Bello"): "Gov_Alhaji_Sani_Bello_Niger.JPG",
    ("Ogun", "Ibikunle Amosun"): "Ogun_-_Ibikunle-Amosun-official.jpg",
    ("Ondo", "Rotimi Akeredolu"): "Gov_Akeredolu.jpg",
    ("Osun", "Gboyega Oyetola"): "Gov_Oyetola_Osun.JPG",
    ("Oyo", "Abiola Ajimobi"): "oyo_Ajimobi.jpg",
    ("Plateau", "Simon Lalong"): "Plateau_-_lalong_Simon.jpg",
    ("Rivers", "Nyesom Wike"): "Rivers_-_Nyesom_Wike.jpg",
    ("Sokoto", "Aminu Tambuwal"): "Sokoto_-_Aminu-Tambuwal-Official.jpg",
    ("Taraba", "Darius Ishaku"): "Taraba-_DARIUS_ISHAKU.jpg",
    ("Yobe", "Ibrahim Gaidam"): "yobe_Gaidam1.jpg",
    ("Zamfara", "Bello Matawalle"): "zamfara-Gov_Bello_Matawalle.jpeg",
}


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


def main():
    # Pre-download all unique images
    image_cache = {}  # filename -> {image_url, image_blob}
    unique_files = set(v for v in FORMER_GOVERNORS.values() if v is not None)

    print(f"Downloading {len(unique_files)} former governor images...\n")

    for filename in sorted(unique_files):
        image_url = BASE_URL + IMG_DIR + urllib.request.quote(filename)
        print(f"Downloading: {filename}...")
        content_type, image_bytes = download_image(image_url)

        if image_bytes:
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            blob = f"data:{content_type};base64,{b64}"
            image_cache[filename] = {
                "image_url": image_url,
                "image_blob": blob,
            }
            print(f"  OK - {len(image_bytes)/1024:.1f}KB")
        else:
            print(f"  FAILED")

        time.sleep(0.3)

    print(f"\nDownloaded {len(image_cache)}/{len(unique_files)} images\n")

    # Update metadata files
    files = sorted(glob.glob(os.path.join(BUDGETS_DIR, "**/metadata.json"), recursive=True))
    updated = 0
    failed = []

    for filepath in files:
        with open(filepath) as f:
            data = json.load(f)

        state = data.get("state", "")
        year = data.get("year", "")
        gov = data.get("governor", {})
        gov_name = gov.get("name", "") if isinstance(gov, dict) else ""

        if not gov_name or gov.get("image_url"):
            continue  # Skip if no name or already has image

        key = (state, gov_name)
        filename = FORMER_GOVERNORS.get(key)

        if filename is None:
            continue  # No mapping or explicitly marked as unavailable

        cached = image_cache.get(filename)
        if not cached:
            failed.append(f"{state}/{year} - {gov_name}")
            continue

        gov["image_url"] = cached["image_url"]
        gov["image_blob"] = cached["image_blob"]

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

        updated += 1
        print(f"Updated: {state}/{year} - {gov_name}")

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Images downloaded: {len(image_cache)}")
    print(f"Metadata files updated: {updated}")
    if failed:
        print(f"\nFailed updates:")
        for f in failed:
            print(f"  - {f}")

    # Check remaining
    remaining = []
    for filepath in files:
        with open(filepath) as f:
            data = json.load(f)
        gov = data.get("governor", {})
        if isinstance(gov, dict) and gov.get("name") and not gov.get("image_url"):
            remaining.append(f"{data.get('state')}/{data.get('year')} - {gov['name']}")
    if remaining:
        print(f"\nStill missing images:")
        for r in remaining:
            print(f"  - {r}")


if __name__ == "__main__":
    main()
