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

mapfile -t TABLES < <(parse_tables "${PRISMA_SCHEMA}")

# Append extra tables (pgvector indexes etc.)
for t in ${EXTRA_TABLES}; do
  TABLES+=("$t")
done

if [[ ${#TABLES[@]} -eq 0 ]]; then
  echo "ERROR: No tables found in Prisma schema"
  exit 1
fi

echo "Discovered ${#TABLES[@]} tables from schema"

# ── Helper: build row-count SQL from TABLES array ────────────
build_counts_sql() {
  local sql=""
  for i in "${!TABLES[@]}"; do
    table="${TABLES[$i]}"
    if [[ $i -gt 0 ]]; then
      sql+=" UNION ALL "
    fi
    sql+="SELECT '${table}: ' || count(*) FROM ${table}"
  done
  echo "${sql}"
}

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

echo "Current key row counts:"
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$(build_counts_sql)" 2>/dev/null || echo "  (database may not exist yet)"
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
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "$(build_counts_sql)"

echo ""
echo "Extensions:"
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT extname || ' v' || extversion FROM pg_extension WHERE extname != 'plpgsql';"

echo ""
echo "Restore verified successfully!"
