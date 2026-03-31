#!/usr/bin/env bash
# Neo4j backup script — dumps the database and uploads to S3.
# Usage: ./backup-neo4j.sh
# Requires: NEO4J_PASSWORD, S3_BUCKET, AWS_REGION (or defaults)
#
# Retention: 7 daily + 4 weekly backups maintained in S3.

set -euo pipefail

CONTAINER="${NEO4J_CONTAINER:-ournigeria_neo4j}"
S3_BUCKET="${S3_BUCKET:?S3_BUCKET env var required}"
S3_PREFIX="${S3_NEO4J_PREFIX:-backups/neo4j}"
DATE=$(date -u +%Y-%m-%d)
DAY_OF_WEEK=$(date -u +%u)
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
DUMP_FILE="neo4j-${TIMESTAMP}.dump"

echo "[neo4j-backup] Starting backup at ${TIMESTAMP}"

# Step 1: Dump the database inside the container
echo "[neo4j-backup] Running neo4j-admin database dump..."
docker exec "${CONTAINER}" neo4j-admin database dump neo4j --to-path=/backups/ --overwrite-destination 2>&1

# Step 2: Copy dump out of the container
docker cp "${CONTAINER}:/backups/neo4j.dump" "/tmp/${DUMP_FILE}"
DUMP_SIZE=$(stat -f%z "/tmp/${DUMP_FILE}" 2>/dev/null || stat -c%s "/tmp/${DUMP_FILE}")
echo "[neo4j-backup] Dump size: ${DUMP_SIZE} bytes"

# Step 3: Upload daily backup to S3
echo "[neo4j-backup] Uploading daily backup to s3://${S3_BUCKET}/${S3_PREFIX}/daily/${DUMP_FILE}"
aws s3 cp "/tmp/${DUMP_FILE}" "s3://${S3_BUCKET}/${S3_PREFIX}/daily/${DUMP_FILE}" --quiet

# Step 4: If Sunday (day 7), also upload as weekly
if [ "${DAY_OF_WEEK}" = "7" ]; then
  WEEKLY_FILE="neo4j-weekly-${DATE}.dump"
  echo "[neo4j-backup] Sunday — uploading weekly backup: ${WEEKLY_FILE}"
  aws s3 cp "/tmp/${DUMP_FILE}" "s3://${S3_BUCKET}/${S3_PREFIX}/weekly/${WEEKLY_FILE}" --quiet
fi

# Step 5: Clean up local dump
rm -f "/tmp/${DUMP_FILE}"

# Step 6: Prune old daily backups (keep last 7)
echo "[neo4j-backup] Pruning daily backups older than 7 days..."
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/daily/" \
  | sort -r \
  | tail -n +8 \
  | awk '{print $4}' \
  | while read -r file; do
      echo "[neo4j-backup] Deleting old daily: ${file}"
      aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/daily/${file}" --quiet
    done

# Step 7: Prune old weekly backups (keep last 4)
echo "[neo4j-backup] Pruning weekly backups older than 4 weeks..."
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/weekly/" \
  | sort -r \
  | tail -n +5 \
  | awk '{print $4}' \
  | while read -r file; do
      echo "[neo4j-backup] Deleting old weekly: ${file}"
      aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/weekly/${file}" --quiet
    done

echo "[neo4j-backup] Backup complete"
