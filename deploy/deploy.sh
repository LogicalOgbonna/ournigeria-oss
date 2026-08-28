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
  local host_header="$1"   # e.g. api.ournigeria.ng
  local health_path="$2"   # e.g. /health
  local max_wait="${3:-15}"

  echo "Verifying Traefik routes to $host_header (up to ${max_wait}s)..."

  # First attempt: wait for file watch to pick up the change
  for i in $(seq 1 "$max_wait"); do
    if curl -sfk --connect-to "$host_header:443:traefik:443" "https://$host_header$health_path" >/dev/null 2>&1; then
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
    if curl -sfk --connect-to "$host_header:443:traefik:443" "https://$host_header$health_path" >/dev/null 2>&1; then
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

# ─── Enrichment agent image (pull-only; containers stay human-managed) ────
# The enrichment stack (agent + camofox) is a sibling stack deliberately outside
# blue-green: restarts are stateful (camofox/playwright pairing, sweeper opt-in,
# agent DB creds), so deploys only PRE-PULL the fresh image — a human recreates
# the containers when ready. MUST run AFTER `docker image prune -a`: the freshly
# pulled image has no container referencing it yet, so pulling before the prune
# would delete it again immediately.
pull_enrichment_image() {
  local tag="latest"
  [ "$DEPLOY_ENV" = "staging" ] && tag="latest-amd64"   # staging box is x86_64
  # REGISTRY is defined later in the prod flow — the staging path exits before
  # reaching it, so carry a local fallback.
  local reg="${REGISTRY:-ghcr.io/logicalogbonna}"
  echo "Pre-pulling enrichment agent image (:${tag}) — pull-only, containers untouched..."
  docker pull "${reg}/ournigeria-enrichment-agent:${tag}" 2>&1 | tail -1 || \
    echo "WARN: enrichment image pull failed (non-fatal; retry manually)"
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
# prod branch → production box (Infisical `prod`).
# main/staging branch → staging box (Infisical `staging`).
case "$BRANCH" in
  prod)         DEPLOY_ENV="prod" ;;
  main|staging) DEPLOY_ENV="staging" ;;
  *)            echo "ERROR: Unknown branch $BRANCH"; exit 1 ;;
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

# Load env (Telegram notify creds + ACTIVE_STACK) BEFORE the first notify, so the
# "Deploy started"/staging-complete messages can actually send. Previously .env was
# sourced only at the blue-green step below — after those notifies — so they silently
# no-op'd (notify() guards on TELEGRAM_BOT_TOKEN/TELEGRAM_DEPLOY_CHAT_ID being set).
# shellcheck source=/dev/null
source "$ENV_FILE"

# The Infisical environment the containers boot against follows the deploy
# environment (prod branch → prod secrets, main/staging → staging secrets).
# Authoritative over any static INFISICAL_ENV in .env, so one shared deploy.sh
# serves both the prod box and the staging box. Exported here (after sourcing
# .env) so the branch-derived value wins over the box's static .env.
export INFISICAL_ENV="$DEPLOY_ENV"

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
  # api + ingest run on every box; socials only on boxes whose compose defines it
  # (the dev/staging box doesn't run socials). Treat socials as best-effort so its
  # absence doesn't abort the deploy under `set -e`.
  STAGING_SVCS=(api-blue ingest-blue)
  if docker compose -f "$COMPOSE_FILE" config --services 2>/dev/null | grep -qx socials-blue; then
    STAGING_SVCS+=(socials-blue)
  fi
  docker compose -f "$COMPOSE_FILE" pull "${STAGING_SVCS[@]}"
  docker compose -f "$COMPOSE_FILE" up -d "${STAGING_SVCS[@]}"
  DEPLOY_END=$(date +%s)
  log_deploy "success" "" "$(( DEPLOY_END - DEPLOY_START ))"
  notify "✅ *Staging deploy complete*
Tag: \`$NEW_IMAGE_TAG\`
Duration: $(( DEPLOY_END - DEPLOY_START ))s"
  echo "Staging deploy complete."
  
  echo "Cleaning up old Docker images..."
  docker image prune -a -f

  pull_enrichment_image

  exit 0
fi

# ─── Read current active stack (env already sourced above) ─────────
ACTIVE="${ACTIVE_STACK:-blue}"
if [ "$ACTIVE" = "blue" ]; then
  STANDBY="green"
else
  STANDBY="blue"
fi
echo "Active stack: $ACTIVE → deploying to: $STANDBY"

# ─── Pull new images — fall back gracefully if a service wasn't rebuilt ───────
# CI only builds Docker images for affected services (Nx change detection).
# When only one app changed, the other service has no sha-XXXXXXX image in
# the registry. We detect this per-service: if the new image doesn't exist,
# we retag the currently running image with the new SHA locally so that
# docker compose can find IMAGE_TAG=$NEW_IMAGE_TAG for all services.
echo "Pulling images with tag: $NEW_IMAGE_TAG"
export IMAGE_TAG="$NEW_IMAGE_TAG"
REGISTRY="ghcr.io/logicalogbonna"

for svc in api ingest socials; do
  new_image="${REGISTRY}/ournigeria-${svc}:${NEW_IMAGE_TAG}"
  if docker pull "$new_image" >/dev/null 2>&1; then
    echo "Pulled new ${svc} image: $new_image"
  else
    echo "WARNING: ${svc} image not found in registry (not rebuilt this commit) — reusing active image"
    current_image=$(docker inspect --format='{{.Config.Image}}' "ournigeria_${svc}_${ACTIVE}" 2>/dev/null || true)
    if [ -z "$current_image" ]; then
      echo "ERROR: Could not determine running ${svc} image for fallback"
      log_deploy "pull_failed"
      notify "❌ *Deploy FAILED*
Stage: ${svc} image pull (fallback failed)
Tag: \`$NEW_IMAGE_TAG\`"
      exit 1
    fi
    echo "Retagging ${current_image} → ${new_image}"
    docker tag "$current_image" "$new_image"
  fi
done

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

# ─── DEPLOY SOCIALS (before the shared Traefik switch) ────────────
# Socials shares the single Traefik dynamic file with api + ingest, so it must be
# healthy on $STANDBY BEFORE we flip the file (one swap switches all three).
echo ""
echo "── Deploying Socials to $STANDBY stack ──"
echo "Starting socials-$STANDBY..."
if ! docker compose -f "$COMPOSE_FILE" up -d "socials-${STANDBY}"; then
  echo "ERROR: Failed to start socials-$STANDBY. Aborting before switch (active stack untouched)."
  docker compose -f "$COMPOSE_FILE" rm -sf "api-${STANDBY}" 2>/dev/null || true
  log_deploy "socials_start_failed"
  notify "❌ *Deploy FAILED*
Stage: Socials start (\`$STANDBY\`)
Tag: \`$NEW_IMAGE_TAG\`"
  exit 1
fi

echo "Health check socials-$STANDBY (up to ${HEALTH_TIMEOUT}s)..."
SOCIALS_HEALTHY=false
for i in $(seq 1 $HEALTH_TIMEOUT); do
  if curl -sf "http://socials-${STANDBY}:3005/health" >/dev/null 2>&1; then
    SOCIALS_HEALTHY=true
    echo "Socials health check PASSED after ${i}s"
    break
  fi
  if [ $((i % 10)) -eq 0 ]; then
    if ! check_container_alive "ournigeria_socials_${STANDBY}"; then
      echo "Container crashed — aborting health check early"
      break
    fi
  fi
  sleep 1
done

if [ "$SOCIALS_HEALTHY" != "true" ]; then
  echo "ERROR: Socials health check FAILED after ${HEALTH_TIMEOUT}s"
  echo "Aborting before Traefik switch — active stack untouched (no downtime)."
  docker compose -f "$COMPOSE_FILE" rm -sf "socials-${STANDBY}" "api-${STANDBY}" 2>/dev/null || true
  log_deploy "socials_health_check_failed" "rollback"
  notify "❌ *Deploy FAILED*
Stage: Socials health check (\`$STANDBY\`)
Tag: \`$NEW_IMAGE_TAG\`
Action: Aborted before switch"
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
verify_traefik_routing "api.ournigeria.ng" "/health" 15 || {
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

# Drain old Socials (switched together with API via the shared Traefik file)
echo "Draining socials-$ACTIVE..."
docker compose -f "$COMPOSE_FILE" stop "socials-${ACTIVE}" 2>/dev/null || true

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
  # Also rollback API + Socials back to original stack (both were switched + drained above)
  echo "Rolling back API + Socials to $ACTIVE..."
  cat "$TRAEFIK_DIR/dynamic-${ACTIVE}.yml" > "$TRAEFIK_DIR/dynamic.yml"
  docker compose -f "$COMPOSE_FILE" up -d "api-${ACTIVE}" "socials-${ACTIVE}"
  docker compose -f "$COMPOSE_FILE" stop "api-${STANDBY}" "socials-${STANDBY}"
  log_deploy "ingest_health_check_failed" "rollback"
  notify "❌ *Deploy FAILED*
Stage: Ingest health check (\`$STANDBY\`)
Tag: \`$NEW_IMAGE_TAG\`
Action: Rolled back API + Socials + Ingest"
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

# ─── Bump enrichment sibling stack (prod only, best-effort) ───────
# Enrichment is a NON-blue/green sibling stack (agent + camofox, single containers)
# that exists only on the prod box. CI builds a fresh agent image only when
# deploy/enrichment/** (or apps/api/src/enrichment/**) changed, so:
#   - if the agent image for THIS sha exists, we recreate the agent with it;
#   - otherwise we retag the running agent image to the new tag so compose (which
#     interpolates ${IMAGE_TAG}) finds it and just ensures the stack is up.
# camofox is a pinned, build-once image (pull_policy: missing in the oci override).
# This block MUST NEVER fail the deploy — the app blue/green already succeeded above,
# so any error here is logged, alerted, and swallowed (|| true on the group).
ENRICHMENT_DIR="$COMPOSE_DIR/deploy/enrichment"
if [ -f "$ENRICHMENT_DIR/docker-compose.yml" ] && [ -f "$ENRICHMENT_DIR/docker-compose.oci.yml" ]; then
  echo ""
  echo "── Bumping enrichment sibling stack (best-effort) ──"
  ENRICHMENT_COMPOSE=(-f "$ENRICHMENT_DIR/docker-compose.yml" -f "$ENRICHMENT_DIR/docker-compose.oci.yml")
  {
    agent_img="${REGISTRY}/ournigeria-enrichment-agent:${NEW_IMAGE_TAG}"
    if docker pull "$agent_img" >/dev/null 2>&1; then
      echo "New enrichment agent image for this commit — recreating agent"
    else
      echo "Enrichment agent not rebuilt this commit — reusing running image under the new tag"
      current_agent=$(docker inspect --format='{{.Config.Image}}' enrichment_agent 2>/dev/null || true)
      if [ -n "$current_agent" ]; then
        docker tag "$current_agent" "$agent_img" || true
      fi
    fi
    # Secrets inject from Infisical /enrichment for this env; IMAGE_TAG was exported
    # above. `source "$ENV_FILE"` does NOT export INFISICAL_TOKEN (no `set -a`), so
    # pass it explicitly with --token or `infisical run` (a child) can't authenticate.
    infisical run --token "$INFISICAL_TOKEN" --env "$DEPLOY_ENV" --path /enrichment -- \
      docker compose "${ENRICHMENT_COMPOSE[@]}" up -d camofox agent
    echo "Enrichment stack ensured up (tag ${NEW_IMAGE_TAG})."
    notify "🧪 *Enrichment stack up* — tag \`$NEW_IMAGE_TAG\`"
  } || {
    echo "WARNING: enrichment bump failed — app deploy UNAFFECTED (sibling stack)."
    notify "⚠️ *Enrichment bump failed* — app deploy OK, agent may be stale"
  }
fi

# ─── Log deploy ──────────────────────────────────────────────────
DEPLOY_END=$(date +%s)
DURATION=$(( DEPLOY_END - DEPLOY_START ))
log_deploy "success" "" "$DURATION"

# ─── Prune old deploy logs (>30 days) ─────────────────────────────
find "$LOG_DIR" -name "deploy-*.log" -mtime +30 -delete 2>/dev/null || true

# ─── Clean up old Docker images ───────────────────────────────────
echo "Cleaning up old Docker images..."
docker image prune -a -f

pull_enrichment_image

notify "✅ *Deploy complete*
Active: \`$STANDBY\` | Tag: \`$NEW_IMAGE_TAG\`
Duration: ${DURATION}s"

echo "═══════════════════════════════════════════════════"
echo "  DEPLOY COMPLETE"
echo "  Active: $STANDBY | Tag: $NEW_IMAGE_TAG | Duration: ${DURATION}s"
echo "═══════════════════════════════════════════════════"
