#!/bin/sh
# Seed the single-purpose Hermes home from baked-in material on first boot, write the
# secrets .env from container env (env is the source of truth), then hand off to the
# image's real entrypoint (s6 /init). Runs as root, before s6 drops to the hermes user.
set -e

HOME_DIR="${HERMES_HOME:-/opt/data}"

if [ ! -f "$HOME_DIR/SOUL.md" ]; then
  echo "[seed] initializing $HOME_DIR from /opt/seed"
  mkdir -p "$HOME_DIR/skills"
  cp -a /opt/seed/SOUL.md       "$HOME_DIR/SOUL.md"
  cp -a /opt/seed/config.yaml   "$HOME_DIR/config.yaml"
fi

# Always re-sync skills from the image so a rebuild ships new/updated skills without
# wiping the agent's sessions/memory (SOUL + config stay first-boot-only above).
echo "[seed] syncing skills into $HOME_DIR/skills"
mkdir -p "$HOME_DIR/skills"
cp -a /opt/seed/skills/. "$HOME_DIR/skills/"

# Secrets: always rewritten from env so rotation just needs a container restart.
umask 077
cat > "$HOME_DIR/.env" <<EOF
OPENAI_API_KEY=${DEEPSEEK_API_KEY}
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
ENRICHMENT_AGENT_DATABASE_URL=${ENRICHMENT_AGENT_DATABASE_URL}
CAMOFOX_URL=${CAMOFOX_URL}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_ALLOWED_USERS=${TELEGRAM_ALLOWED_USERS}
EOF

# Own the home as the hermes runtime user so the supervised gateway can write skills/sessions.
chown -R "${HERMES_UID:-10000}:${HERMES_GID:-10000}" "$HOME_DIR" 2>/dev/null || true

exec /init /opt/hermes/docker/main-wrapper.sh "$@"
