#!/usr/bin/env npx tsx
/**
 * FAAC DB Reindex — build chunks from the database and upsert them to the FAAC
 * vector index. Standalone (no Nest), mirrors VectorService's embedding +
 * upsert path. Idempotent: deterministic chunk IDs mean re-runs replace.
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

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { createOpenAI } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";
import { embedMany } from "ai";
import { loadFaacDisbursements } from "../src/pipeline/faac-db-loader";
import { buildAllFaacChunks } from "../src/pipeline/faac-db-chunk-builder";

const args = process.argv.slice(2);
const limitMonths = args.includes("--limit-months")
  ? parseInt(args[args.indexOf("--limit-months") + 1], 10)
  : null;
const BATCH = 64;

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

// Mirror VectorService's Voyage fetch patching.
const fetchPatched: typeof globalThis.fetch = async (input, init) => {
  if (init?.body && typeof init.body === "string") {
    try {
      const parsed = JSON.parse(init.body);
      if (parsed.encoding_format) {
        delete parsed.encoding_format;
        init = { ...init, body: JSON.stringify(parsed) };
      }
    } catch {}
  }
  const resp = await globalThis.fetch(input, {
    ...init,
    signal: AbortSignal.timeout(120_000),
  });
  if (resp.ok && String(input).includes("/embeddings")) {
    const body = await resp.json();
    if (body.usage && body.usage.prompt_tokens === undefined) {
      body.usage.prompt_tokens = body.usage.total_tokens ?? 0;
    }
    return new Response(JSON.stringify(body), {
      status: resp.status,
      headers: resp.headers,
    });
  }
  return resp;
};

async function main() {
  const indexName = env("VECTOR_INDEX_FAAC");
  const dimension = Number(env("EMBEDDING_DIMENSION"));

  const pool = new pg.Pool({ connectionString: env("DATABASE_URL") });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const pgVector = new PgVector({
    id: "faac-reindex",
    connectionString: env("DATABASE_URL"),
  });
  const provider = createOpenAI({
    baseURL: env("EMBEDDING_BASE_URL"),
    apiKey: env("EMBEDDING_API_KEY"),
    fetch: fetchPatched,
  });
  const embeddingModel = provider.embedding(env("EMBEDDING_MODEL"));

  try {
    let disbursements = await loadFaacDisbursements(prisma);
    disbursements.sort((a, b) => a.year - b.year || a.month - b.month);
    if (limitMonths && limitMonths > 0) {
      disbursements = disbursements.slice(-limitMonths);
      console.log(
        `Limiting to last ${limitMonths} month(s): ${disbursements
          .map((d) => `${d.monthName} ${d.year}`)
          .join(", ")}`,
      );
    }
    if (disbursements.length === 0) {
      console.log("No FAAC disbursements in DB. Nothing to index.");
      return;
    }

    const chunks = buildAllFaacChunks(disbursements);
    console.log(
      `Built ${chunks.length} chunks from ${disbursements.length} disbursement(s). Index="${indexName}" dim=${dimension}`,
    );

    // ensureIndex
    try {
      await pgVector.createIndex({
        indexName,
        dimension,
        metric: "cosine",
        vectorType: "halfvec",
        indexConfig: { type: "hnsw", hnsw: { m: 16, efConstruction: 128 } },
      });
      console.log(`Index "${indexName}" created.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) console.log(`Index "${indexName}" exists, continuing.`);
      else throw err;
    }

    let done = 0;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: batch.map((c) => c.text),
      });
      const vectors = embeddings.map((e) =>
        e.length > dimension ? e.slice(0, dimension) : e,
      );
      await pgVector.upsert({
        indexName,
        vectors,
        metadata: batch.map((c) => c.metadata),
        ids: batch.map((c) => c.id),
      });
      done += batch.length;
      if ((i / BATCH) % 5 === 0 || done === chunks.length) {
        console.log(`  upserted ${done}/${chunks.length}`);
      }
    }

    console.log(`\nDone. Upserted ${done} chunks to "${indexName}".`);
  } finally {
    await pgVector.disconnect();
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
