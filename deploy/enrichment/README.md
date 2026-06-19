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

## Secrets (Infisical — never a local .env)

The agent's secrets live in Infisical and are injected at `up` time. There is no `.env` file.
Set them once (names are ENRICHMENT_*-namespaced so they never collide with the app's shared
`TELEGRAM_BOT_TOKEN`, which the API uses for Telegram login):

```bash
infisical secrets set \
  ENRICHMENT_TELEGRAM_BOT_TOKEN="..." \
  ENRICHMENT_TELEGRAM_ALLOWED_USERS="573695075" \
  DEEPSEEK_API_KEY="..." \
  ENRICHMENT_AGENT_DATABASE_URL="postgresql://enrichment_agent:<pw>@ournigeria_db:5432/spending" \
  --env dev
```

The compose maps `ENRICHMENT_TELEGRAM_*` → the `TELEGRAM_*` names Hermes reads inside the container.

## Run (local, against the dev DB)

```bash
# dev DB must be up (docker compose -f ../../docker-compose.dev.yml up -d) and the
# enrichment_agent role must have a login password (see the backend plan, Phase 1.3).
infisical run --env dev -- docker compose -f deploy/enrichment/docker-compose.yml up -d --build
infisical run --env dev -- docker compose -f deploy/enrichment/docker-compose.yml logs -f agent
```

Forgetting `infisical run` fails fast — the `${VAR:?}` guards in compose reject empty secrets.

The agent connects Telegram (locked to `TELEGRAM_ALLOWED_USERS`), reaches `ournigeria_db` as
`enrichment_agent`, and browses via `camofox`. DM the bot or run a one-off:

```bash
docker exec enrichment_agent hermes -z "Enrich office_address for official <id> (<name>) — research with the browser, corroborate, submit one proposal." --skills enrichment -t browser,terminal,file
```

## Autonomous structured sweeper

The `sweeper` service (opt-in, `sweeper` compose profile) runs the always-on
control plane: it finds structured-data gaps (`find-structured-gaps.cjs`), and for
each `(official, category)` drives the brain per gap via the `enrichment-structured`
skill, which proposes through `submit-structured-create.cjs`. It enforces pacing, a
hard daily invocation cap, dedup (the `enrichment_attempts` cursor), idle re-poll,
and a kill switch — all deterministic, in `apps/api/src/enrichment/sweeper/`.

Enable it (after validating proposals look good):
```bash
infisical run --env dev -- docker compose -f deploy/enrichment/docker-compose.yml \
  --profile sweeper up -d sweeper
infisical run --env dev -- docker compose -f deploy/enrichment/docker-compose.yml logs -f sweeper
```

Stop it without removing the container: `SWEEPER_KILL=1` (restart) or
`docker exec enrichment_sweeper touch /opt/data/enrichment-sweeper.kill`.

Knobs (env, conservative defaults): `SWEEPER_BATCH`, `SWEEPER_PACE_MS`,
`SWEEPER_IDLE_MS`, `SWEEPER_DAILY_CAP`, `SWEEPER_RECHECK_{FILLED,NOTHING,ERROR}_DAYS`.
Human approval in the dashboard is still required before anything goes live.

`enrichment_agent` is granted INSERT/UPDATE on only the two operational tables
(`enrichment_attempts`, `enrichment_budget`) — never on live domain data.

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
