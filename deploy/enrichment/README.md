# Sandboxed Enrichment Agent (Docker)

The Hermes enrichment agent and its Camofox browser run as **containers** — never natively on
a host. The agent's `terminal`/`browser` toolsets are confined to the container; it has **no host
filesystem access** and only the least-privileged `enrichment_agent` DB credential.

## Components

| Service | What | Network |
|---|---|---|
| `agent` | Official `nousresearch/hermes-agent` image + bundled enrichment CLIs + a single-purpose home (DeepSeek model, officials SOUL, enrichment skill). | `enrichment` (private) + the DB network |
| `camofox` | `jo-inc/camofox-browser`, headless (patched). Reachable only over the private `enrichment` network. | `enrichment` |

The agent's home (`/opt/data`) is a **named volume**, not a host path. Secrets come from `.env`
(gitignored) → written into the home at boot; rotation = restart.

## Run (local, against the dev DB)

```bash
cp .env.example .env        # fill in DeepSeek key, agent DB url, bot token, allowed user id
# dev DB must be up (docker compose -f ../../docker-compose.dev.yml up -d) and the
# enrichment_agent role must have a login password (see the backend plan, Phase 1.3).
docker compose up -d --build
docker compose logs -f agent
```

The agent connects Telegram (locked to `TELEGRAM_ALLOWED_USERS`), reaches `ournigeria_db` as
`enrichment_agent`, and browses via `camofox`. DM the bot or run a one-off:

```bash
docker exec enrichment_agent hermes -z "Enrich office_address for official <id> (<name>) — research with the browser, corroborate, submit one proposal." --skills enrichment -t browser,terminal,file
```

## Files

- `Dockerfile.agent` (+ `.dockerignore`) — agent image. `Dockerfile.camofox` — headless patch.
- `docker-compose.yml` — the two services + networks + named volume.
- `config.yaml` — Hermes config (DeepSeek model, minimal toolsets). `skill/SKILL.md` — the agent skill (container paths). SOUL = `../../docs/enrichment/officials-agent-profile.md`.
- `seed-and-run.sh` — seeds the home + writes `.env` from container env, then hands off to s6 `/init`.
- `tools/` — `build-tools.sh` regenerates the committed `*.cjs` bundles (only depend on `pg`/`xlsx`/`pdf-parse`, installed in the image).

## Prod

Swap the external `devdb` network for the production stack's `internal` network + DB host, set
the role passwords + secrets via the prod secret store, and build the Camofox base in CI (see
`docs/superpowers/plans/2026-06-05-enrichment-prod-deployment.md`). The safety model is identical
local↔prod: the agent can only file human-reviewed proposals; only admin approval writes live data.
