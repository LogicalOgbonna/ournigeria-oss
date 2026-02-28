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
ENV_FILE="${SCRIPT_DIR}/.env"

# ── Load config from .env ────────────────────────────────────
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: .env file not found at ${ENV_FILE}"
  exit 1
fi
source "${ENV_FILE}"

CONTAINER="${CONTAINER:?CONTAINER not set in .env}"
DB_NAME="${DB_NAME:?DB_NAME not set in .env}"
DB_USER="${DB_USER:?DB_USER not set in .env}"
PRISMA_SCHEMA="${PRISMA_SCHEMA:?PRISMA_SCHEMA not set in .env}"
EXTRA_TABLES="${EXTRA_TABLES:-}"

# ── Resolve Prisma schema path ───────────────────────────────
if [[ "${PRISMA_SCHEMA}" != /* ]]; then
  PRISMA_SCHEMA="${SCRIPT_DIR}/${PRISMA_SCHEMA}"
fi

if [[ ! -f "${PRISMA_SCHEMA}" ]]; then
  echo "ERROR: Prisma schema not found at ${PRISMA_SCHEMA}"
  exit 1
fi

# ── Parse table names from Prisma schema ─────────────────────
# Extracts @@map("table_name") only from model blocks (not enums)
parse_tables() {
  awk '
    /^model /    { in_model = 1 }
    /^enum /     { in_model = 0 }
    /^}/         { in_model = 0 }
    in_model && /@@map\("/ {
      gsub(/.*@@map\("/, "")
      gsub(/".*/, "")
      print
    }
  ' "$1"
}

TABLES=()
while IFS= read -r line; do
  TABLES+=("$line")
done < <(parse_tables "${PRISMA_SCHEMA}")

# Append extra tables (pgvector indexes etc.)
for t in ${EXTRA_TABLES}; do
  TABLES+=("$t")
done

if [[ ${#TABLES[@]} -eq 0 ]]; then
  echo "ERROR: No tables found in Prisma schema"
  exit 1
fi

echo "Discovered ${#TABLES[@]} tables from schema"

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

echo "Key row counts:"
COUNTS_SQL=""
for i in "${!TABLES[@]}"; do
  table="${TABLES[$i]}"
  if [[ $i -gt 0 ]]; then
    COUNTS_SQL+=" UNION ALL "
  fi
  COUNTS_SQL+="SELECT '${table}: ' || count(*) FROM ${table}"
done
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "${COUNTS_SQL}" 2>/dev/null || echo "  (some tables may not exist yet)"
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
