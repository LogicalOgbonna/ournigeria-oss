# OurNigeria Deploy Guide

Automated blue-green deployment pipeline for the OurNigeria platform. Pushes to `main` trigger a GitHub Actions build, push images to GHCR, and fire a webhook that performs a zero-downtime deploy on the production server.

---

## Architecture

```
                    GitHub                                  Production Server
  ┌───────────────────────────────────┐    ┌──────────────────────────────────────────────────┐
  │                                   │    │                                                  │
  │  Push to main                     │    │  Traefik (TLS termination via Let's Encrypt)     │
  │       │                           │    │    ├─ api.ournigeria.ng (:443)                    │
  │       ▼                           │    │    ├─ ingest.ournigeria.ng (:443)                 │
  │  GitHub Actions                   │    │    └─ socials.ournigeria.ng (:443)                │
  │    ├─ Validate compose + lint     │    │  Traefik (internal blue-green routing)            │
  │    ├─ Build API image             │    │    ├─ dynamic.yml routes to active stack          │
  │    ├─ Build Ingest image          │    │    ├─ BLUE:  api-blue:3000  / ingest-blue:3002   │
  │    └─ Push to GHCR               │    │    └─ GREEN: api-green:3000 / ingest-green:3002  │
  │       │                           │    │                                                  │
  │       ▼                           │    │  Webhook Receiver (:9000)                        │
  │  Trigger deploy webhook ──────────┼───►│    └─ HMAC verify → deploy.sh                   │
  │                                   │    │         ├─ Pull new images                       │
  │  GHCR                             │    │         ├─ Start standby stack                   │
  │    ├─ ournigeria-api:sha-xxx      │    │         ├─ Health check                          │
  │    └─ ournigeria-ingest:sha-xxx   │    │         ├─ Swap Traefik config (atomic)          │
  │                                   │    │         ├─ Drain old stack                       │
  │                                   │    │         └─ Telegram notification                 │
  │                                   │    │                                                  │
  │                                   │    │  PostgreSQL 16 + pgvector (unchanged)            │
  └───────────────────────────────────┘    └──────────────────────────────────────────────────┘
```

---

## Prerequisites

- Docker Engine 24+
- Docker Compose v2 (`docker compose` subcommand)
- `curl`, `jq`, `bash`
- Port `9000` open for webhook receiver (or set `WEBHOOK_PORT` in `.env`)
- Ports `80` and `443` open to the internet (OCI security list); Traefik handles TLS via Let's Encrypt directly (no NPM required)

---

## Initial Setup

### 1. Clone and bootstrap

```bash
# Clone the repo to /opt/ournigeria
sudo git clone https://github.com/LogicalOgbonna/ournigeria.git /opt/ournigeria
cd /opt/ournigeria

# Run the bootstrap script
sudo ./deploy/bootstrap.sh \
  --webhook-secret $WEBHOOK_SECRET \
  --status-token $STATUS_BEARER_TOKEN \
  --ghcr-token $GHCR_TOKEN \
  --ghcr-user $GHCR_OWNER \
  --postgres-password $POSTGRES_PASSWORD \
  --infisical-token $INFISICAL_TOKEN \
  --telegram-bot-token $TELEGRAM_BOT_TOKEN \
  --telegram-chat-id $TELEGRAM_DEPLOY_CHAT_ID
```

All flags except `--telegram-bot-token` and `--telegram-chat-id` are required. The script will abort if any required flag is missing.

The bootstrap script will:
- Create `/var/log/ournigeria-deploy/` for deploy logs
- Write the initial `.env` file with provided secrets
- Log in to GHCR (`docker login ghcr.io`)
- Copy `deploy/traefik/dynamic-blue.yml` to `deploy/traefik/dynamic.yml`
- Start the production stack with `docker compose up -d`

### 2. Traefik TLS configuration

Traefik terminates TLS directly via Let's Encrypt — no NPM required. Ensure ports `80` and `443` are open in the OCI security list. The following hostnames are served:

| Domain | Service |
|--------|---------|
| `api.ournigeria.ng` | API |
| `ingest.ournigeria.ng` | Ingestion pipeline |
| `socials.ournigeria.ng` | Socials service |

Traefik handles both TLS termination and blue-green routing internally. TLS certificates are provisioned automatically on first request via Let's Encrypt.

### 3. GitHub repository setup

Add these secrets in **Settings > Secrets and variables > Actions**:

| Secret | Value |
|--------|-------|
| `WEBHOOK_SECRET` | Same secret passed to `bootstrap.sh --webhook-secret` |
| `DEPLOY_WEBHOOK_URL` | `http://<SERVER_IP>:9000/hooks/deploy` |

The `GITHUB_TOKEN` secret is provided automatically and is used to push images to GHCR.

---

## How a Deploy Works

When code is pushed to `main`, the following happens end-to-end:

1. **GitHub Actions** (`build-push.yml`) runs:
   - Validates `docker-compose.yml` syntax
   - Lints deploy shell scripts with `shellcheck`
   - Builds `ournigeria-api` and `ournigeria-ingest` Docker images (matrix build)
   - Pushes images to GHCR with tags: `latest`, `sha-<short>`, `main`
   - Fires a webhook POST to the production server

2. **Webhook receiver** (port 9000) receives the POST:
   - Verifies the HMAC-SHA256 signature against `WEBHOOK_SECRET`
   - Validates the `X-GitHub-Event: push` header
   - Passes `ref`, `sha`, and `timestamp` to `deploy.sh`

3. **`deploy.sh`** executes:
   - Acquires a deploy lock (prevents concurrent deploys)
   - Checks the timestamp to reject replayed requests
   - Determines the currently active stack (blue or green) and the standby stack
   - Sets `IMAGE_TAG=sha-<short>` and pulls new images for the standby stack
   - Starts the standby API container and waits for it to pass health checks
   - On health check success: copies the corresponding Traefik template (`dynamic-blue.yml` or `dynamic-green.yml`) to `dynamic.yml` -- Traefik detects the file change and hot-reloads routing (no restart needed)
   - Repeats health check + switch for the ingest service
   - Drains the old stack containers (stops them after a grace period)
   - Updates `.env` with the new `IMAGE_TAG` and `ACTIVE_STACK`
   - Appends an entry to `/var/log/ournigeria-deploy/history.json`
   - Sends a Telegram notification (if configured)

4. **On health check failure**: the deploy auto-rolls back:
   - Standby container is stopped
   - Traefik config is left unchanged (still pointing to old stack)
   - Failure is logged and a Telegram alert is sent

---

## Manual Deploy

If the webhook is down or you need to deploy manually via SSH:

```bash
cd /opt/ournigeria

# Determine current active stack
source .env
echo "Active stack: $ACTIVE_STACK"

# Set the desired image tag
export IMAGE_TAG=sha-abc1234

# Determine standby stack
if [ "$ACTIVE_STACK" = "blue" ]; then STANDBY=green; else STANDBY=blue; fi

# Pull and start standby
docker compose pull api-${STANDBY} ingest-${STANDBY}
docker compose up -d api-${STANDBY} ingest-${STANDBY}

# Wait for health checks
docker compose exec api-${STANDBY} curl -sf http://localhost:3000/health

# Swap Traefik routing
cp deploy/traefik/dynamic-${STANDBY}.yml deploy/traefik/dynamic.yml

# Stop old stack
docker compose stop api-${ACTIVE_STACK} ingest-${ACTIVE_STACK}

# Update .env
sed -i "s/^ACTIVE_STACK=.*/ACTIVE_STACK=${STANDBY}/" .env
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/" .env
```

---

## Rollback Procedures

### Automatic rollback (health check failure)

If `deploy.sh` detects that the new container fails its health check, it automatically:
- Stops the standby container
- Leaves Traefik config unchanged (old stack continues serving traffic)
- Logs the failure

No manual intervention is required.

### Webhook rollback

Trigger a rollback remotely by sending a signed request:

```bash
BODY='{"sha":"<previous-sha>"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')

curl -X POST "http://<SERVER_IP>:9000/hooks/rollback" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  --data "$BODY"
```

### Manual SSH rollback

```bash
cd /opt/ournigeria
source .env

# Swap back to the previous stack
if [ "$ACTIVE_STACK" = "blue" ]; then PREVIOUS=green; else PREVIOUS=blue; fi

# The previous stack containers should still exist (stopped)
docker compose start api-${PREVIOUS} ingest-${PREVIOUS}

# Wait for health, then swap Traefik
cp deploy/traefik/dynamic-${PREVIOUS}.yml deploy/traefik/dynamic.yml

# Stop the broken stack
docker compose stop api-${ACTIVE_STACK} ingest-${ACTIVE_STACK}

# Update .env
sed -i "s/^ACTIVE_STACK=.*/ACTIVE_STACK=${PREVIOUS}/" .env
```

### Nuclear rollback (revert to old build-based flow)

If the entire blue-green pipeline needs to be abandoned:

1. Stop all containers: `docker compose down`
2. Check out the last known-good commit
3. Rebuild images locally: `docker compose build`
4. Start directly: `docker compose up -d`

This bypasses GHCR, webhooks, and blue-green entirely.

---

## Deploy Status

Check the current deployment status via the webhook status endpoint:

```bash
curl -H "Authorization: Bearer <STATUS_BEARER_TOKEN>" \
  http://<SERVER_IP>:9000/hooks/deploy-status
```

Returns JSON with:
- Currently active stack (blue or green)
- Current image tag
- Last deploy timestamp
- Last deploy result (success or failure)

---

## Monitoring

### Deploy logs

All deploy output is written to `/var/log/ournigeria-deploy/`:

```
/var/log/ournigeria-deploy/
  deploy.log          # Combined deploy script output
  history.json        # Append-only JSON log of all deploys
```

### Container logs

```bash
# View logs for the active API
docker compose logs -f api-blue    # or api-green

# View webhook receiver logs
docker compose logs -f webhook
```

### Traefik

Traefik runs with `--log.level=WARN`. To debug routing issues, temporarily change to `DEBUG` in `docker-compose.yml` and restart:

```bash
docker compose restart traefik
```

---

## Staging

Pushes to the `staging` branch trigger a simplified deploy:

- Images are built and pushed to GHCR with the `staging` tag
- The webhook fires with `ref: refs/heads/staging`
- `deploy.sh` detects the staging ref and performs a simple restart (no blue-green swap)
- Staging uses the same server but can be pointed at a separate set of containers if needed

---

## Security

| Mechanism | Purpose |
|-----------|---------|
| HMAC-SHA256 | Webhook payload authentication -- every deploy/rollback request must be signed with `WEBHOOK_SECRET` |
| Bearer token | Status endpoint authentication via `STATUS_BEARER_TOKEN` |
| Timestamp validation | Replay protection -- `deploy.sh` rejects payloads with stale timestamps |
| Docker socket | The webhook container mounts `/var/run/docker.sock` (required for `docker compose` commands). Only the webhook container has access. |
| GHCR authentication | Images are pulled from GHCR using a scoped Personal Access Token (PAT) with `read:packages` permission |

---

## Local Development

The deploy pipeline does not affect local development at all. Developers continue to use:

```bash
docker compose -f docker-compose.dev.yml up -d   # PostgreSQL only
pnpm api:dev                                      # NestJS on :3000
pnpm web:dev                                      # Next.js on :3001
pnpm ingest:dev                                   # Ingestion on :3002
```

The `docker-compose.dev.yml` file is completely separate from the production `docker-compose.yml`.

---

## Telegram Alerts

Deploy notifications are sent via Telegram when both environment variables are set in `.env`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_DEPLOY_CHAT_ID=-100123456789
```

Notifications include:
- Deploy start/success/failure status
- Image tag and commit SHA
- Active stack (blue or green)
- Health check results
- Rollback alerts

If the variables are not set, deploys proceed silently (no error).

---

## Secrets Reference

| Secret | Where Set | Purpose |
|--------|-----------|---------|
| `WEBHOOK_SECRET` | Server `.env` + GitHub Actions secret | HMAC-SHA256 signing key for webhook payloads |
| `DEPLOY_WEBHOOK_URL` | GitHub Actions secret | Full URL to the deploy webhook endpoint (`http://<IP>:9000/hooks/deploy`) |
| `STATUS_BEARER_TOKEN` | Server `.env` | Bearer token for the `GET /hooks/deploy-status` endpoint |
| `GHCR_OWNER` | Server `.env` | GitHub username or org for GHCR image paths |
| GHCR PAT | Server Docker login | Personal Access Token with `read:packages` scope for pulling images from GHCR |
| `POSTGRES_PASSWORD` | Server `.env` | PostgreSQL password for the `spending` database user |
| `INFISICAL_TOKEN` | Server `.env` | Infisical service token for runtime secret injection into API and ingest containers |
| `TELEGRAM_BOT_TOKEN` | Server `.env` (optional) | Telegram bot token for deploy notifications |
| `TELEGRAM_DEPLOY_CHAT_ID` | Server `.env` (optional) | Telegram chat ID for deploy notifications |
