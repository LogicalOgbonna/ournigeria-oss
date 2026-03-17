#!/usr/bin/env bash
set -euo pipefail

# ─── Helper: Telegram notification ────────────────────────────────
notify() {
  local message="$1"
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_DEPLOY_CHAT_ID:-}" ]; then
    curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_DEPLOY_CHAT_ID" \
      -d text="$message" \
      -d parse_mode="Markdown" \
      >/dev/null 2>&1 || true
  fi
}

# ─── Helper: log deploy to history ────────────────────────────────
log_deploy() {
  local status="${1:-unknown}"
  local rollback="${2:-}"
  local duration="${3:-0}"

  mkdir -p "$(dirname "$HISTORY_FILE")"

  local entry
  entry=$(cat <<ENTRY
{"timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","sha":"$SHA","branch":"$BRANCH","image_tag":"$NEW_IMAGE_TAG","status":"$status","duration_seconds":$duration,"rollback_performed":$([ -n "$rollback" ] && echo true || echo false),"active_stack":"${STANDBY:-unknown}","env":"$DEPLOY_ENV"}
ENTRY
)

  if [ -f "$HISTORY_FILE" ]; then
    local tmp
    tmp=$(mktemp)
    jq --argjson entry "$entry" '. + [$entry] | .[-100:]' "$HISTORY_FILE" > "$tmp" 2>/dev/null || echo "[$entry]" > "$tmp"
    mv "$tmp" "$HISTORY_FILE"
  else
    echo "[$entry]" > "$HISTORY_FILE"
  fi
}

# ─── Helper: verify traefik config was updated ────────────────────
verify_traefik_switch() {
  local expected_url="$1"
  local config_file="$2"
  if ! grep -q "$expected_url" "$config_file"; then
    echo "ERROR: Traefik config verification failed. Expected '$expected_url' in $config_file"
    return 1
  fi
  echo "Traefik config verified: $expected_url present"
}

# ─── Helper: verify Traefik actually routes to the new backend ─────
# Curls through Traefik's entrypoint to confirm routing is live.
# If routing fails, restarts Traefik and retries.
verify_traefik_routing() {
  local host_header="$1"   # e.g. api.example.invalid
  local health_path="$2"   # e.g. /health
  local max_wait="${3:-15}"

  # NOTE: deploy.sh runs inside the webhook container, so we reach
  # Traefik via its Docker service name, not localhost.
  local traefik_url="http://traefik:80"

  echo "Verifying Traefik routes to $host_header (up to ${max_wait}s)..."

  # First attempt: wait for file watch to pick up the change
  for i in $(seq 1 "$max_wait"); do
    if curl -sf -H "Host: $host_header" "${traefik_url}${health_path}" >/dev/null 2>&1; then
      echo "Traefik routing verified for $host_header after ${i}s"
      return 0
    fi
    sleep 1
  done

  # File watch failed — restart Traefik as fallback
  echo "WARNING: Traefik did not pick up config change. Restarting Traefik..."
  docker compose -f "$COMPOSE_FILE" restart traefik

  # Wait for Traefik to come back up and route correctly
  for i in $(seq 1 "$max_wait"); do
    if curl -sf -H "Host: $host_header" "${traefik_url}${health_path}" >/dev/null 2>&1; then
      echo "Traefik routing verified for $host_header after restart (${i}s)"
      return 0
    fi
    sleep 1
  done

  echo "ERROR: Traefik routing verification FAILED for $host_header even after restart"
  return 1
}

# ─── Helper: check if container is still running ──────────────────
check_container_alive() {
  local container="$1"
  local running
  running=$(docker inspect --format='{{.State.Running}}' "$container" 2>/dev/null || echo "false")
  if [ "$running" != "true" ]; then
    echo "ERROR: Container $container is no longer running (crashed/OOM?)"
    return 1
  fi
}

# ─── Config ───────────────────────────────────────────────────────
COMPOSE_DIR="/opt/ournigeria"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"
ENV_FILE="$COMPOSE_DIR/.env"
LOG_DIR="/var/log/ournigeria-deploy"
HISTORY_FILE="$LOG_DIR/history.json"
LOCK_FILE="/tmp/ournigeria-deploy.lock"
TRAEFIK_DIR="$COMPOSE_DIR/deploy/traefik"
HEALTH_TIMEOUT=90
DRAIN_WAIT=10

# ─── Args from webhook ────────────────────────────────────────────
REF="${1:-refs/heads/main}"
SHA="${2:-unknown}"
TIMESTAMP="${3:-$(date +%s)}"
DEPLOY_START=$(date +%s)

# ─── Initialize variables ─────────────────────────────────────────
BRANCH="${REF#refs/heads/}"
NEW_IMAGE_TAG="sha-${SHA:0:7}"
DEPLOY_ENV="unknown"
STANDBY=""

# ─── Timestamp replay protection (5 min window) ───────────────────
NOW=$(date +%s)
AGE=$(( NOW - TIMESTAMP ))
if [ "$AGE" -gt 300 ] || [ "$AGE" -lt -30 ]; then
  echo "ERROR: Stale webhook payload (age: ${AGE}s). Rejecting."
  exit 1
fi

# ─── Determine environment from branch ────────────────────────────
case "$BRANCH" in
  main)    DEPLOY_ENV="prod" ;;
  staging) DEPLOY_ENV="staging" ;;
  *)       echo "ERROR: Unknown branch $BRANCH"; exit 1 ;;
esac

# ─── Deploy lock (flock) ──────────────────────────────────────────
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "ERROR: Deploy already in progress. Rejecting."
  exit 1
fi

# ─── Logging ──────────────────────────────────────────────────────
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "═══════════════════════════════════════════════════"
echo "  DEPLOY STARTED"
echo "  Branch: $BRANCH | SHA: $SHA | Env: $DEPLOY_ENV"
echo "  Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════════════"

notify "🚀 *Deploy started*
Branch: \`$BRANCH\`
SHA: \`${SHA:0:7}\`
Env: \`$DEPLOY_ENV\`"

# ─── Staging: simple restart (no blue-green) ──────────────────────
if [ "$DEPLOY_ENV" = "staging" ]; then
  echo "Staging deploy: simple restart (no blue-green)"
  export IMAGE_TAG="$NEW_IMAGE_TAG"
  docker compose -f "$COMPOSE_FILE" pull api-blue ingest-blue
  docker compose -f "$COMPOSE_FILE" up -d api-blue ingest-blue
  DEPLOY_END=$(date +%s)
  log_deploy "success" "" "$(( DEPLOY_END - DEPLOY_START ))"
  notify "✅ *Staging deploy complete*
Tag: \`$NEW_IMAGE_TAG\`
Duration: $(( DEPLOY_END - DEPLOY_START ))s"
  echo "Staging deploy complete."
  exit 0
fi

# ─── Read current active stack ─────────────────────────────────────
# shellcheck source=/dev/null
source "$ENV_FILE"
ACTIVE="${ACTIVE_STACK:-blue}"
if [ "$ACTIVE" = "blue" ]; then
  STANDBY="green"
else
  STANDBY="blue"
fi
echo "Active stack: $ACTIVE → deploying to: $STANDBY"

# ─── Pull ALL new images (parallel) ───────────────────────────────
echo "Pulling images with tag: $NEW_IMAGE_TAG"
export IMAGE_TAG="$NEW_IMAGE_TAG"
if ! docker compose -f "$COMPOSE_FILE" pull "api-${STANDBY}" "ingest-${STANDBY}"; then
  echo "ERROR: Failed to pull images. Aborting deploy."
  log_deploy "pull_failed"
  notify "❌ *Deploy FAILED*
Stage: Image pull
Tag: \`$NEW_IMAGE_TAG\`"
  exit 1
fi

# ─── DEPLOY API (step 1 of 2) ─────────────────────────────────────
echo ""
echo "── Deploying API to $STANDBY stack ──"

echo "Starting api-$STANDBY..."
if ! docker compose -f "$COMPOSE_FILE" up -d "api-${STANDBY}"; then
  echo "ERROR: Failed to start api-$STANDBY."
  log_deploy "api_start_failed"
  notify "❌ *Deploy FAILED*
Stage: API start (\`$STANDBY\`)
Tag: \`$NEW_IMAGE_TAG\`"
  exit 1
fi

echo "Health check api-$STANDBY (up to ${HEALTH_TIMEOUT}s)..."
API_HEALTHY=false
for i in $(seq 1 $HEALTH_TIMEOUT); do
  if curl -sf "http://api-${STANDBY}:3000/health" >/dev/null 2>&1; then
    API_HEALTHY=true
    echo "API health check PASSED after ${i}s"
    break
  fi
  # Every 10 iterations, check if container is still alive
  if [ $((i % 10)) -eq 0 ]; then
    if ! check_container_alive "ournigeria_api_${STANDBY}"; then
      echo "Container crashed — aborting health check early"
      break
    fi
  fi
  sleep 1
done

if [ "$API_HEALTHY" != "true" ]; then
  echo "ERROR: API health check FAILED after ${HEALTH_TIMEOUT}s"
  echo "Rolling back: stopping api-$STANDBY..."
  docker compose -f "$COMPOSE_FILE" stop "api-${STANDBY}"
  docker compose -f "$COMPOSE_FILE" rm -f "api-${STANDBY}"
  log_deploy "api_health_check_failed" "rollback"
  notify "❌ *Deploy FAILED*
Stage: API health check (\`$STANDBY\`)
Tag: \`$NEW_IMAGE_TAG\`
Action: Rolled back"
  exit 1
fi

# Switch Traefik routing for API
# NOTE: Use 'cat src > dst' instead of 'cp' to preserve the file inode.
# Docker bind mounts track inodes — 'cp' creates a new inode, leaving
# the container's mount pointing at the old (stale) file.
echo "Switching API traffic to $STANDBY..."
if ! cat "$TRAEFIK_DIR/dynamic-${STANDBY}.yml" > "$TRAEFIK_DIR/dynamic.yml"; then
  echo "CRITICAL: Failed to write Traefik config. Aborting."
  log_deploy "traefik_copy_failed" "rollback"
  notify "❌ *Deploy FAILED*
Stage: Traefik config write
Tag: \`$NEW_IMAGE_TAG\`"
  exit 1
fi
verify_traefik_switch "http://api-${STANDBY}:3000" "$TRAEFIK_DIR/dynamic.yml" || {
  echo "CRITICAL: Traefik switch verification failed for API. Aborting."
  # Restore previous config (preserve inode)
  cat "$TRAEFIK_DIR/dynamic-${ACTIVE}.yml" > "$TRAEFIK_DIR/dynamic.yml"
  log_deploy "traefik_switch_failed" "rollback"
  notify "❌ *Deploy FAILED*
Stage: Traefik verification
Tag: \`$NEW_IMAGE_TAG\`"
  exit 1
}

# Verify Traefik actually routes traffic to the new API backend
verify_traefik_routing "api.example.invalid" "/health" 15 || {
  echo "CRITICAL: Traefik routing failed. Rolling back config..."
  cat "$TRAEFIK_DIR/dynamic-${ACTIVE}.yml" > "$TRAEFIK_DIR/dynamic.yml"
  log_deploy "traefik_routing_failed" "rollback"
  notify "❌ *Deploy FAILED*
Stage: Traefik routing verification
Tag: \`$NEW_IMAGE_TAG\`"
  exit 1
}

# Drain old API
echo "Draining api-$ACTIVE (${DRAIN_WAIT}s)..."
sleep "$DRAIN_WAIT"
docker compose -f "$COMPOSE_FILE" stop "api-${ACTIVE}"

# ─── DEPLOY INGEST (step 2 of 2) ──────────────────────────────────
echo ""
echo "── Deploying Ingest to $STANDBY stack ──"

echo "Starting ingest-$STANDBY..."
if ! docker compose -f "$COMPOSE_FILE" up -d "ingest-${STANDBY}"; then
  echo "ERROR: Failed to start ingest-$STANDBY."
  log_deploy "ingest_start_failed"
  notify "❌ *Deploy FAILED*
Stage: Ingest start (\`$STANDBY\`)
Tag: \`$NEW_IMAGE_TAG\`"
  exit 1
fi

echo "Health check ingest-$STANDBY (up to ${HEALTH_TIMEOUT}s)..."
INGEST_HEALTHY=false
for i in $(seq 1 $HEALTH_TIMEOUT); do
  if curl -sf "http://ingest-${STANDBY}:3002/health" >/dev/null 2>&1; then
    INGEST_HEALTHY=true
    echo "Ingest health check PASSED after ${i}s"
    break
  fi
  # Every 10 iterations, check if container is still alive
  if [ $((i % 10)) -eq 0 ]; then
    if ! check_container_alive "ournigeria_ingest_${STANDBY}"; then
      echo "Container crashed — aborting health check early"
      break
    fi
  fi
  sleep 1
done

if [ "$INGEST_HEALTHY" != "true" ]; then
  echo "ERROR: Ingest health check FAILED after ${HEALTH_TIMEOUT}s"
  echo "Rolling back: stopping ingest-$STANDBY..."
  docker compose -f "$COMPOSE_FILE" stop "ingest-${STANDBY}"
  docker compose -f "$COMPOSE_FILE" rm -f "ingest-${STANDBY}"
  # Also rollback API back to original stack
  echo "Rolling back API to $ACTIVE..."
  cat "$TRAEFIK_DIR/dynamic-${ACTIVE}.yml" > "$TRAEFIK_DIR/dynamic.yml"
  docker compose -f "$COMPOSE_FILE" up -d "api-${ACTIVE}"
  docker compose -f "$COMPOSE_FILE" stop "api-${STANDBY}"
  log_deploy "ingest_health_check_failed" "rollback"
  notify "❌ *Deploy FAILED*
Stage: Ingest health check (\`$STANDBY\`)
Tag: \`$NEW_IMAGE_TAG\`
Action: Rolled back API + Ingest"
  exit 1
fi

# Ingest doesn't need Traefik switch (already done with the template copy above)
# Verify ingest is also in the config
verify_traefik_switch "http://ingest-${STANDBY}:3002" "$TRAEFIK_DIR/dynamic.yml" || {
  echo "WARNING: Ingest not in Traefik config — this is expected if using single template"
}

# Drain old Ingest
echo "Draining ingest-$ACTIVE (${DRAIN_WAIT}s)..."
sleep "$DRAIN_WAIT"
docker compose -f "$COMPOSE_FILE" stop "ingest-${ACTIVE}"

# ─── Update .env ──────────────────────────────────────────────────
sed -i "s/^ACTIVE_STACK=.*/ACTIVE_STACK=${STANDBY}/" "$ENV_FILE"
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${NEW_IMAGE_TAG}/" "$ENV_FILE"

# ─── Log deploy ──────────────────────────────────────────────────
DEPLOY_END=$(date +%s)
DURATION=$(( DEPLOY_END - DEPLOY_START ))
log_deploy "success" "" "$DURATION"

# ─── Prune old deploy logs (>30 days) ─────────────────────────────
find "$LOG_DIR" -name "deploy-*.log" -mtime +30 -delete 2>/dev/null || true

notify "✅ *Deploy complete*
Active: \`$STANDBY\` | Tag: \`$NEW_IMAGE_TAG\`
Duration: ${DURATION}s"

echo "═══════════════════════════════════════════════════"
echo "  DEPLOY COMPLETE"
echo "  Active: $STANDBY | Tag: $NEW_IMAGE_TAG | Duration: ${DURATION}s"
echo "═══════════════════════════════════════════════════"
