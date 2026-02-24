#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Backup the spending database (PostgreSQL + pgvector)
#
# Usage:  ./backup.sh <name>
# Output: backups/<YYYY-MM-DD>_<name>.sql.gz
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
# TODO: use the container name from the docker-compose.yml file
CONTAINER="naija_budget_db"
# TODO: use the database name from environment file
DB_NAME="spending"
DB_USER="spending"

# ── Validate input ──────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-name>"
  echo "  Example: $0 after-708k-embeddings"
  exit 1
fi

BACKUP_NAME="$1"
DATE="$(date +%Y-%m-%d_%H%M%S)"
FILENAME="${DATE}_${BACKUP_NAME}.sql.gz"

# ── Verify container is running ─────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: Docker container '${CONTAINER}' is not running."
  echo "Start it with: docker compose up -d"
  exit 1
fi

# ── Create backup directory ─────────────────────────────────
mkdir -p "${BACKUP_DIR}"

# ── Show what we're backing up ──────────────────────────────
echo "=== Database Backup ==="
echo "Container:  ${CONTAINER}"
echo "Database:   ${DB_NAME}"
echo "Output:     ${BACKUP_DIR}/${FILENAME}"
echo ""

# TODO: read through the prisma schema and get the table names
echo "Key row counts:"
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

# ── Run pg_dump inside the container, gzip on host ──────────
echo "Starting backup..."
docker exec "${CONTAINER}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --create \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

# ── Verify ──────────────────────────────────────────────────
FILE_SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo ""
echo "Backup complete!"
echo "  File: ${BACKUP_DIR}/${FILENAME}"
echo "  Size: ${FILE_SIZE}"
echo ""
echo "To restore: ./restore.sh ${FILENAME}"
