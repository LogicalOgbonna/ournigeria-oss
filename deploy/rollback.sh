#!/usr/bin/env bash
set -euo pipefail

# ─── Rollback to a specific SHA ───────────────────────────────────
COMPOSE_DIR="/opt/ournigeria"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"
ENV_FILE="$COMPOSE_DIR/.env"
LOG_DIR="/var/log/ournigeria-deploy"
LOCK_FILE="/tmp/ournigeria-deploy.lock"

SHA="${1:?SHA required}"
IMAGE_TAG="sha-${SHA:0:7}"

# Deploy lock
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "ERROR: Deploy/rollback already in progress."
  exit 1
fi

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_DIR/rollback-$(date +%Y%m%d-%H%M%S).log") 2>&1

echo "═══════════════════════════════════════════════════"
echo "  ROLLBACK to $IMAGE_TAG"
echo "  Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════════════"

# shellcheck source=/dev/null
source "$ENV_FILE"
ACTIVE="${ACTIVE_STACK:-blue}"

export IMAGE_TAG
docker compose -f "$COMPOSE_FILE" pull "api-${ACTIVE}" "ingest-${ACTIVE}" "socials-${ACTIVE}"
docker compose -f "$COMPOSE_FILE" up -d "api-${ACTIVE}" "ingest-${ACTIVE}" "socials-${ACTIVE}"

# Update .env
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/" "$ENV_FILE"

echo "Rollback complete. Active stack: $ACTIVE, Tag: $IMAGE_TAG"
