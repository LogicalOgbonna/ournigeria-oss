#!/usr/bin/env npx tsx
/**
 * FAAC DB Reindex CLI — thin wrapper around `reindexFaac` (the reusable core in
 * src/pipeline/faac/reindex.ts). Builds chunks from the database and upserts
 * them to the FAAC vector index. Idempotent: deterministic chunk IDs mean
 * re-runs replace.
 *
 * Reads config from env (use Infisical for embedding creds). Override
 * DATABASE_URL / VECTOR_INDEX_FAAC to target a specific environment.
 *
 * Usage:
 *   # Full reindex against local DB, embedding creds from Infisical dev:
 *   infisical run --env dev -- env \
 *     DATABASE_URL=postgresql://spending:spending@127.0.0.1:5432/spending \
 *     VECTOR_INDEX_FAAC=faac_vectors \
 *     npx tsx apps/ingest/scripts/faac-db-reindex.ts
 *
 *   # Smoke test: only the most recent N months
 *   ... npx tsx apps/ingest/scripts/faac-db-reindex.ts --limit-months 1
 */

import { reindexFaac } from "../src/pipeline/faac/reindex";

const args = process.argv.slice(2);
const limitMonths = args.includes("--limit-months")
  ? parseInt(args[args.indexOf("--limit-months") + 1], 10)
  : null;

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

async function main() {
  const result = await reindexFaac({
    databaseUrl: env("DATABASE_URL"),
    indexName: env("VECTOR_INDEX_FAAC"),
    dimension: Number(env("EMBEDDING_DIMENSION")),
    embeddingBaseUrl: env("EMBEDDING_BASE_URL"),
    embeddingApiKey: env("EMBEDDING_API_KEY"),
    embeddingModel: env("EMBEDDING_MODEL"),
    limitMonths: limitMonths && limitMonths > 0 ? limitMonths : undefined,
  });
  console.log(`Reindex complete. upserted=${result.upserted}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
