# Neo4j Operations Guide

## Connection Details

| Environment | URI | Browser |
|---|---|---|
| Dev | `bolt://localhost:7687` | `http://localhost:7474` |
| Prod | `bolt://neo4j:7687` (internal) | Not exposed |

Default credentials: `neo4j` / `$NEO4J_PASSWORD`

## Backup

### Automated Backup

Run the backup script (requires `S3_BUCKET` env var):

```bash
./packages/database/scripts/backup-neo4j.sh
```

The script:
1. Dumps the database via `neo4j-admin database dump`
2. Uploads to `s3://$S3_BUCKET/backups/neo4j/daily/`
3. On Sundays, also uploads to `.../weekly/`
4. Prunes old backups (keeps 7 daily + 4 weekly)

### Manual Backup

```bash
# Dump inside container
docker exec ournigeria_neo4j neo4j-admin database dump neo4j --to-path=/backups/ --overwrite-destination

# Copy out
docker cp ournigeria_neo4j:/backups/neo4j.dump ./neo4j-backup.dump
```

## Restore

```bash
# Stop the container
docker compose stop neo4j

# Copy dump into container
docker cp ./neo4j-backup.dump ournigeria_neo4j:/backups/neo4j.dump

# Restore (container must be stopped but existing)
docker exec ournigeria_neo4j neo4j-admin database load neo4j --from-path=/backups/ --overwrite-destination

# Start
docker compose start neo4j
```

## Graph Schema

The schema (constraints, indexes) is initialized automatically at API startup via `GraphSchemaService`. It is idempotent — safe to re-run.

To verify schema manually:

```cypher
SHOW CONSTRAINTS;
SHOW INDEXES;
```

## Monitoring

The `/health` endpoint includes Neo4j status:

```json
{
  "checks": {
    "neo4j": { "status": "ok", "latency": 3 }
  }
}
```

Possible statuses:
- `ok` — connected and responding
- `down` — connection failed
- `disabled` — Neo4j env vars not configured

## Circuit Breaker

Neo4j queries are wrapped in an `opossum` circuit breaker:
- **Opens** after 5 failures within 60 seconds (50% error threshold)
- **Half-open probe** after 30 seconds
- When open, all queries fail immediately without hitting Neo4j

Check API logs for circuit breaker state changes.

## Clearing the Graph

To wipe all graph data (e.g., before re-running backfill):

```cypher
// Delete all nodes and relationships
MATCH (n) DETACH DELETE n;
```

This does NOT delete schema (constraints/indexes). Those persist.

---

## Graph Pipeline API

All endpoints require admin authentication via the `on_admin_session` cookie.

### Authentication

```bash
# Login and save cookie
curl -X POST https://spending-api.arinze.online/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email","password":"yourpass"}' \
  -c admin-cookies.txt
```

All subsequent requests use `-b admin-cookies.txt`.

---

### Backfill (Graph Extraction)

**Pass 1** extracts nodes/relationships from chunk metadata (fast, no LLM cost).
**Pass 2** uses LLM to extract deeper relationships from chunk text (slower, costs money). Auto-pauses at cost ceiling (default $500, configurable via `graph.extraction_cost_limit_usd`).

#### Start backfill — all domains, Pass 1

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/backfill \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"pass": 1}'
```

#### Start backfill — single domain, Pass 1

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/backfill \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"pass": 1, "domain": "budget"}'
```

#### Start backfill — all domains, Pass 2

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/backfill \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"pass": 2}'
```

#### Start backfill — single domain, Pass 2

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/backfill \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"pass": 2, "domain": "corruption"}'
```

Valid domains: `budget`, `corruption`, `govspend`, `faac`

---

### Monitoring

#### Check backfill status (all jobs)

```bash
curl https://spending-api.arinze.online/api/admin/graph/backfill/status \
  -b admin-cookies.txt
```

Returns: job ID, domain, pass, status (`running` | `paused` | `completed` | `error`), chunks processed/total, cost USD, timestamps.

#### Graph health (node/edge counts, orphans, flagged entities)

```bash
curl https://spending-api.arinze.online/api/admin/graph/health \
  -b admin-cookies.txt
```

---

### Pause / Resume

#### Pause all running jobs

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/backfill/pause \
  -b admin-cookies.txt
```

#### Resume — all domains

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/backfill/resume \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"pass": 1}'
```

#### Resume — single domain

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/backfill/resume \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"pass": 2, "domain": "govspend"}'
```

---

### Community Detection (post-ingestion)

Run these after backfill is complete.

#### Detect communities (Leiden algorithm via GDS)

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/communities/detect \
  -b admin-cookies.txt
```

#### Generate community summaries — default (up to 100)

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/communities/summarize \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{}'
```

#### Generate community summaries — custom limit

```bash
curl -X POST https://spending-api.arinze.online/api/admin/graph/communities/summarize \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"limit": 50}'
```

---

### Recommended Order

1. **Pass 1 — all domains** (fast, deterministic, no cost)
2. **Check health** — verify nodes/edges were created
3. **Pass 2 — one domain at a time** (LLM cost, monitor via status)
4. **Detect communities** — after Pass 2 completes
5. **Summarize communities** — generates human-readable summaries
