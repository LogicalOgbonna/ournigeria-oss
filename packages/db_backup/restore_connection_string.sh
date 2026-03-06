#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Restore the spending database from a backup via connection string
#
# Usage:
#   ./restore_connection_string.sh              Restore the latest backup
#   ./restore_connection_string.sh <filename>   Restore a specific backup file
#
# Requires DATABASE_URL in .env (e.g. postgresql://user:pass@host:5432/dbname)
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

DATABASE_URL="${DATABASE_URL:?DATABASE_URL not set in .env}"
PRISMA_SCHEMA="${PRISMA_SCHEMA:?PRISMA_SCHEMA not set in .env}"
EXTRA_TABLES="${EXTRA_TABLES:-}"

# ── Parse DB name and base URL from connection string ────────
# Extract dbname from the end of the URL (after last /)
DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"
# Build postgres maintenance URL (replace dbname with postgres)
BASE_URL="${DATABASE_URL%/*}/postgres"

# ── Resolve Prisma schema path ───────────────────────────────
if [[ "${PRISMA_SCHEMA}" != /* ]]; then
  PRISMA_SCHEMA="${SCRIPT_DIR}/${PRISMA_SCHEMA}"
fi

if [[ ! -f "${PRISMA_SCHEMA}" ]]; then
  echo "ERROR: Prisma schema not found at ${PRISMA_SCHEMA}"
  exit 1
fi

# ── Parse table names from Prisma schema ─────────────────────
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

# ── Verify connectivity ─────────────────────────────────────
if ! psql "${DATABASE_URL}" -c "SELECT 1" > /dev/null 2>&1; then
  echo "ERROR: Cannot connect to database at ${DATABASE_URL%%@*}@****"
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
  BACKUP_FILE=$(ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | head -1)
  if [[ -z "${BACKUP_FILE}" ]]; then
    echo "ERROR: No backups found in ${BACKUP_DIR}"
    exit 1
  fi
fi

FILENAME="$(basename "${BACKUP_FILE}")"
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

# ── Show current state before restore ───────────────────────
echo "=== Database Restore (Connection String) ==="
echo "Backup:    ${FILENAME} (${FILE_SIZE})"
echo "Database:  ${DB_NAME}"
echo "Host:      ${DATABASE_URL%%@*}@****"
echo ""

echo "Current key row counts:"
psql "${DATABASE_URL}" -t -A -c "$(build_counts_sql)" 2>/dev/null || echo "  (database may not exist yet)"
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
psql "${BASE_URL}" -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
" > /dev/null 2>&1 || true

# ── Drop and recreate database ──────────────────────────────
echo "Dropping and recreating '${DB_NAME}'..."
psql "${BASE_URL}" -c "DROP DATABASE IF EXISTS ${DB_NAME};" -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_NAME%%@*};" 2>&1 || {
  # If OWNER fails (user != db name), try without OWNER
  psql "${BASE_URL}" -c "DROP DATABASE IF EXISTS ${DB_NAME};" -c "CREATE DATABASE ${DB_NAME};" 2>&1
}

# ── Restore ─────────────────────────────────────────────────
echo "Restoring from ${FILENAME}..."
gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}" --single-transaction 2>&1 | tail -5

# ── Verify ──────────────────────────────────────────────────
echo ""
echo "Restore complete! Verifying..."
echo ""
echo "Row counts after restore:"
psql "${DATABASE_URL}" -t -A -c "$(build_counts_sql)"

echo ""
echo "Extensions:"
psql "${DATABASE_URL}" -t -A -c "SELECT extname || ' v' || extversion FROM pg_extension WHERE extname != 'plpgsql';"

echo ""
echo "Restore verified successfully!"
