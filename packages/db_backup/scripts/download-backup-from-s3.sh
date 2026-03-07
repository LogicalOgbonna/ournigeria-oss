#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Download a database backup from S3
#
# Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION,
#           S3_BUCKET (injected by infisical)
#
# Usage:
#   infisical run --env=prod -- ./scripts/download-backup-from-s3.sh
#   infisical run --env=prod -- ./scripts/download-backup-from-s3.sh <filename>
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$(cd "${SCRIPT_DIR}/../backups" 2>/dev/null && pwd || echo "${SCRIPT_DIR}/../backups")"
S3_PREFIX="db_backup"

# ── Validate env vars ────────────────────────────────────────
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is not set}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is not set}"
: "${AWS_REGION:?AWS_REGION is not set}"
: "${S3_BUCKET:?S3_BUCKET is not set}"

export AWS_DEFAULT_REGION="${AWS_REGION}"

# ── Ensure backup dir exists ─────────────────────────────────
mkdir -p "${BACKUP_DIR}"

# ── List or download ─────────────────────────────────────────
if [[ $# -ge 1 ]]; then
  FILENAME="$1"
else
  echo "Available backups in s3://${S3_BUCKET}/${S3_PREFIX}/:"
  echo ""
  aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --human-readable 2>/dev/null || {
    echo "ERROR: Could not list S3 bucket. Check credentials."
    exit 1
  }
  echo ""
  read -rp "Enter filename to download: " FILENAME
  if [[ -z "${FILENAME}" ]]; then
    echo "No filename provided. Aborted."
    exit 0
  fi
fi

S3_PATH="s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME}"
LOCAL_PATH="${BACKUP_DIR}/${FILENAME}"

# ── Check if already downloaded ──────────────────────────────
if [[ -f "${LOCAL_PATH}" ]]; then
  LOCAL_SIZE=$(du -h "${LOCAL_PATH}" | cut -f1)
  echo "File already exists locally: ${LOCAL_PATH} (${LOCAL_SIZE})"
  read -rp "Re-download and overwrite? [y/N] " confirm
  if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    echo "Skipped."
    exit 0
  fi
fi

# ── Download ─────────────────────────────────────────────────
echo "Downloading ${S3_PATH} -> ${LOCAL_PATH}"
echo "This may take a while for large files..."
echo ""

aws s3 cp "${S3_PATH}" "${LOCAL_PATH}"

# ── Verify size ──────────────────────────────────────────────
if [[ ! -f "${LOCAL_PATH}" ]]; then
  echo "ERROR: Download failed — file not found."
  exit 1
fi

FILE_SIZE=$(du -h "${LOCAL_PATH}" | cut -f1)
echo ""
echo "Download complete: ${LOCAL_PATH} (${FILE_SIZE})"

# ── Verify gzip integrity ────────────────────────────────────
echo "Verifying file integrity..."
if gzip -t "${LOCAL_PATH}" 2>/dev/null; then
  echo "Integrity check passed."
else
  echo "ERROR: File is corrupted. Delete and re-download:"
  echo "  rm ${LOCAL_PATH}"
  exit 1
fi
