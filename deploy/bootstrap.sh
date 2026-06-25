#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="/opt/ournigeria"
WEBHOOK_PORT="${WEBHOOK_PORT:-9000}"
WEBHOOK_SECRET=""
STATUS_TOKEN=""
GHCR_TOKEN=""
GHCR_USER=""
POSTGRES_PASSWORD=""
INFISICAL_TOKEN=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_DEPLOY_CHAT_ID=""

# ─── Parse args ───────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --webhook-secret|--status-token|--ghcr-token|--ghcr-user|--port|--postgres-password|--infisical-token|--telegram-bot-token|--telegram-chat-id)
      if [[ $# -lt 2 ]]; then
        echo "Error: $1 requires a value"
        exit 1
      fi
      ;;&
    --webhook-secret)      WEBHOOK_SECRET="$2"; shift 2 ;;
    --status-token)        STATUS_TOKEN="$2"; shift 2 ;;
    --ghcr-token)          GHCR_TOKEN="$2"; shift 2 ;;
    --ghcr-user)           GHCR_USER="$2"; shift 2 ;;
    --port)                WEBHOOK_PORT="$2"; shift 2 ;;
    --postgres-password)   POSTGRES_PASSWORD="$2"; shift 2 ;;
    --infisical-token)     INFISICAL_TOKEN="$2"; shift 2 ;;
    --telegram-bot-token)  TELEGRAM_BOT_TOKEN="$2"; shift 2 ;;
    --telegram-chat-id)    TELEGRAM_DEPLOY_CHAT_ID="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [ -z "$WEBHOOK_SECRET" ] || [ -z "$GHCR_TOKEN" ] || [ -z "$GHCR_USER" ] || [ -z "$STATUS_TOKEN" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$INFISICAL_TOKEN" ]; then
  echo "Usage: $0 --webhook-secret <SECRET> --status-token <TOKEN> --ghcr-token <TOKEN> --ghcr-user <USER> [options]"
  echo ""
  echo "Required:"
  echo "  --webhook-secret <SECRET>     Webhook secret for GitHub"
  echo "  --status-token <TOKEN>        Bearer token for deploy status endpoint"
  echo "  --ghcr-token <TOKEN>          GitHub Container Registry PAT"
  echo "  --ghcr-user <USER>            GitHub Container Registry username"
  echo "  --postgres-password <PASS>    PostgreSQL password"
  echo "  --infisical-token <TOKEN>     Infisical service token"
  echo ""
  echo "Optional:"
  echo "  --port <PORT>                 Webhook port (default: 9000)"
  echo "  --telegram-bot-token <TOKEN>  Telegram bot token for deploy alerts"
  echo "  --telegram-chat-id <ID>       Telegram chat ID for deploy alerts"
  exit 1
fi

echo "═══════════════════════════════════════════════════"
echo "  OurNigeria Deploy Bootstrap"
echo "═══════════════════════════════════════════════════"

# ─── Create directory structure ───────────────────────────────────
echo "1. Creating directory structure..."
mkdir -p "$DEPLOY_DIR/deploy/traefik"
mkdir -p /var/log/ournigeria-deploy

# ─── Authenticate to GHCR ─────────────────────────────────────────
echo "2. Authenticating to GitHub Container Registry..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

# ─── Copy files ───────────────────────────────────────────────────
echo "3. Copying deploy files..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/hooks.yaml" "$DEPLOY_DIR/deploy/hooks.yaml"
cp "$SCRIPT_DIR/deploy.sh" "$DEPLOY_DIR/deploy/deploy.sh"
cp "$SCRIPT_DIR/rollback.sh" "$DEPLOY_DIR/deploy/rollback.sh"
cp "$SCRIPT_DIR/deploy-status.sh" "$DEPLOY_DIR/deploy/deploy-status.sh"
cp "$SCRIPT_DIR/Dockerfile.webhook" "$DEPLOY_DIR/deploy/Dockerfile.webhook"
cp "$SCRIPT_DIR/traefik/dynamic-blue.yml" "$DEPLOY_DIR/deploy/traefik/dynamic-blue.yml"
cp "$SCRIPT_DIR/traefik/dynamic-green.yml" "$DEPLOY_DIR/deploy/traefik/dynamic-green.yml"
cp "$SCRIPT_DIR/traefik/dynamic-blue.yml" "$DEPLOY_DIR/deploy/traefik/dynamic.yml"
chmod +x "$DEPLOY_DIR/deploy/"*.sh

# ─── Set up .env if not exists ─────────────────────────────────────
# GHCR_OWNER is used in image refs (ghcr.io/<owner>/...), which Docker requires
# to be lowercase — even though GHCR_USER may be mixed-case (e.g. LogicalOgbonna).
GHCR_OWNER_LC="$(printf '%s' "$GHCR_USER" | tr '[:upper:]' '[:lower:]')"
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo "4. Creating .env file..."
  cat > "$DEPLOY_DIR/.env" <<ENVEOF
# ── Deploy config ──
ACTIVE_STACK=blue
IMAGE_TAG=latest
WEBHOOK_SECRET=$WEBHOOK_SECRET
WEBHOOK_PORT=$WEBHOOK_PORT
STATUS_BEARER_TOKEN=$STATUS_TOKEN
GHCR_OWNER=$GHCR_OWNER_LC

# ── Telegram deploy alerts (optional) ──
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
TELEGRAM_DEPLOY_CHAT_ID=$TELEGRAM_DEPLOY_CHAT_ID

# ── App config ──
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
INFISICAL_TOKEN=$INFISICAL_TOKEN
INFISICAL_ENV=prod
ENVEOF
  echo "   .env created with all required values."
else
  echo "4. .env already exists, appending missing deploy vars..."
  grep -q "ACTIVE_STACK" "$DEPLOY_DIR/.env" || echo "ACTIVE_STACK=blue" >> "$DEPLOY_DIR/.env"
  grep -q "IMAGE_TAG" "$DEPLOY_DIR/.env" || echo "IMAGE_TAG=latest" >> "$DEPLOY_DIR/.env"
  grep -q "WEBHOOK_SECRET" "$DEPLOY_DIR/.env" || echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> "$DEPLOY_DIR/.env"
  grep -q "WEBHOOK_PORT" "$DEPLOY_DIR/.env" || echo "WEBHOOK_PORT=$WEBHOOK_PORT" >> "$DEPLOY_DIR/.env"
  grep -q "STATUS_BEARER_TOKEN" "$DEPLOY_DIR/.env" || echo "STATUS_BEARER_TOKEN=$STATUS_TOKEN" >> "$DEPLOY_DIR/.env"
  grep -q "GHCR_OWNER" "$DEPLOY_DIR/.env" || echo "GHCR_OWNER=$GHCR_OWNER_LC" >> "$DEPLOY_DIR/.env"
  grep -q "TELEGRAM_BOT_TOKEN" "$DEPLOY_DIR/.env" || echo "TELEGRAM_BOT_TOKEN=" >> "$DEPLOY_DIR/.env"
  grep -q "TELEGRAM_DEPLOY_CHAT_ID" "$DEPLOY_DIR/.env" || echo "TELEGRAM_DEPLOY_CHAT_ID=" >> "$DEPLOY_DIR/.env"
fi

# ─── Copy docker-compose.yml ──────────────────────────────────────
echo "5. Copying docker-compose.yml..."
cp "$SCRIPT_DIR/../docker-compose.yml" "$DEPLOY_DIR/docker-compose.yml"

# ─── Build webhook image ──────────────────────────────────────────
echo "6. Building webhook image..."
cd "$DEPLOY_DIR"
docker compose build webhook

# ─── Pull initial images ──────────────────────────────────────────
echo "7. Pulling initial images..."
docker compose pull api-blue ingest-blue socials-blue || echo "   WARNING: Pull failed — check GHCR auth"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Bootstrap complete!"
echo ""
echo "  Next steps:"
echo "  1. Verify $DEPLOY_DIR/.env has correct values"
echo "  2. Traefik terminates TLS via Let's Encrypt directly (no NPM)."
echo "     Ensure ports 80 and 443 are open to the internet (OCI security list)."
echo "     Hosts served: api / ingest / socials .ournigeria.ng"
echo "  3. Run: cd $DEPLOY_DIR && docker compose up -d"
echo "  4. Webhook is served via Traefik HTTPS at https://deploy.ournigeria.ng/hooks/deploy"
echo "     (internal only — port 9000 is NOT publicly exposed)"
echo "  5. Set OCI_DEPLOY_WEBHOOK_URL and OCI_WEBHOOK_SECRET in GitHub repo secrets"
echo "═══════════════════════════════════════════════════"
