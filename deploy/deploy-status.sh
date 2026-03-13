#!/usr/bin/env bash
set -euo pipefail

COMPOSE_DIR="/opt/ournigeria"
ENV_FILE="$COMPOSE_DIR/.env"
HISTORY_FILE="/var/log/ournigeria-deploy/history.json"

# shellcheck source=/dev/null
source "$ENV_FILE"
ACTIVE="${ACTIVE_STACK:-blue}"

# Get running container image tags
API_IMAGE=$(docker inspect --format='{{.Config.Image}}' "ournigeria_api_${ACTIVE}" 2>/dev/null || echo "unknown")
INGEST_IMAGE=$(docker inspect --format='{{.Config.Image}}' "ournigeria_ingest_${ACTIVE}" 2>/dev/null || echo "unknown")

# Get health status
API_HEALTH=$(curl -sf "http://api-${ACTIVE}:3000/health" 2>/dev/null && echo "healthy" || echo "unhealthy")
INGEST_HEALTH=$(curl -sf "http://ingest-${ACTIVE}:3002/health" 2>/dev/null && echo "healthy" || echo "unhealthy")

# Last deploy
LAST_DEPLOY=$(jq -r '.[-1]' "$HISTORY_FILE" 2>/dev/null || echo '{}')

cat <<EOF
{
  "active_stack": "$ACTIVE",
  "image_tag": "${IMAGE_TAG:-unknown}",
  "api": {
    "image": "$API_IMAGE",
    "health": "$API_HEALTH"
  },
  "ingest": {
    "image": "$INGEST_IMAGE",
    "health": "$INGEST_HEALTH"
  },
  "last_deploy": $LAST_DEPLOY
}
EOF
