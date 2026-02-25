#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Restore the spending database from a backup
#
# Usage:
#   ./restore.sh              Restore the latest backup
#   ./restore.sh <filename>   Restore a specific backup file
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
# TODO: use the container name from the docker-compose.yml file
CONTAINER="ournigeria_db"
# TODO: use the database name from environment file
DB_NAME="spending"
DB_USER="spending"

# ── Verify container is running ─────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: Docker container '${CONTAINER}' is not running."
  echo "Start it with: docker compose up -d"
  exit 1
fi

# ── Determine which backup to restore ───────────────────────
if [[ $# -ge 1 ]]; then
  BACKUP_FILE="${BACKUP_DIR}/$1"
  if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    echo ""
    echo "Available backups:"
    ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | while read -r f; do
      echo "  $(basename "$f")  ($(du -h "$f" | cut -f1))"
    done
    exit 1
  fi
else
  # Find the latest backup
  BACKUP_FILE=$(ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | head -1)
  if [[ -z "${BACKUP_FILE}" ]]; then
    echo "ERROR: No backups found in ${BACKUP_DIR}"
    exit 1
  fi
fi

FILENAME="$(basename "${BACKUP_FILE}")"
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

# ── Show current state before restore ───────────────────────
echo "=== Database Restore ==="
echo "Backup:     ${FILENAME} (${FILE_SIZE})"
echo "Container:  ${CONTAINER}"
echo "Database:   ${DB_NAME}"
echo ""

# TODO: read through the prisma schema and get the table names
echo "Current key row counts:"
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "
  SELECT 'budget_chunks: ' || count(*) FROM budget_chunks
  UNION ALL
  SELECT 'corruption_chunks: ' || count(*) FROM corruption_chunks
  UNION ALL
  SELECT 'ingestion_records: ' || count(*) FROM ingestion_records
  UNION ALL
  SELECT 'documents: ' || count(*) FROM documents
  UNION ALL
  SELECT 'users: ' || count(*) FROM users;
" 2>/dev/null || echo "  (database may not exist yet)"
echo ""

# ── Confirm ─────────────────────────────────────────────────
read -rp "This will DROP and recreate the '${DB_NAME}' database. Continue? [y/N] " confirm
if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# ── Terminate existing connections ──────────────────────────
echo ""
echo "Terminating existing connections..."
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
" > /dev/null 2>&1 || true

# ── Restore ─────────────────────────────────────────────────
echo "Restoring from ${FILENAME}..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d postgres --single-transaction 2>&1 | tail -5

# ── Verify ──────────────────────────────────────────────────
echo ""
echo "Restore complete! Verifying..."
echo ""
echo "Row counts after restore:"
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "
  SELECT 'budget_chunks: ' || count(*) FROM budget_chunks
  UNION ALL
  SELECT 'corruption_chunks: ' || count(*) FROM corruption_chunks
  UNION ALL
  SELECT 'ingestion_records: ' || count(*) FROM ingestion_records
  UNION ALL
  SELECT 'documents: ' || count(*) FROM documents
  UNION ALL
  SELECT 'users: ' || count(*) FROM users;
"

echo ""
echo "Extensions:"
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT extname || ' v' || extversion FROM pg_extension WHERE extname != 'plpgsql';"

echo ""
echo "Restore verified successfully!"
