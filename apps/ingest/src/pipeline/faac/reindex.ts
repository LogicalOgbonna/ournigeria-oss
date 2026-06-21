/**
 * FAAC reindex core — reusable, year-scoped. Builds chunks from the database and
 * upserts them to the FAAC vector index. Standalone (no Nest), mirrors
 * VectorService's embedding + upsert path. Idempotent: deterministic chunk IDs
 * mean re-runs replace.
 *
 * Callable from a cron service (built docker image has no tsx) as a plain
 * function. The `onlyYear` filter re-embeds only the affected year's chunks
 * (cheap, correct) — chunks are always built from the FULL disbursement list
 * first so cross-month / year-over-year / annual aggregates compute correctly,
 * THEN filtered to `onlyYear` before embedding/upserting.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { createOpenAI } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";
import { embedMany } from "ai";
import { loadFaacDisbursements } from "../faac-db-loader";
import { buildAllFaacChunks } from "../faac-db-chunk-builder";

const BATCH = 64;

export interface ReindexFaacOptions {
  databaseUrl: string;
  indexName: string;
  dimension: number;
  embeddingBaseUrl: string;
  embeddingApiKey: string;
  embeddingModel: string;
  /** When set, only chunks whose metadata.year === onlyYear are upserted. */
  onlyYear?: number;
  /** When set, only the last N months are loaded (smoke testing). */
  limitMonths?: number;
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

export async function reindexFaac(
  opts: ReindexFaacOptions,
): Promise<{ upserted: number }> {
  const { indexName, dimension } = opts;

  const pool = new pg.Pool({ connectionString: opts.databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const pgVector = new PgVector({
    id: "faac-reindex",
    connectionString: opts.databaseUrl,
  });
  const provider = createOpenAI({
    baseURL: opts.embeddingBaseUrl,
    apiKey: opts.embeddingApiKey,
    fetch: fetchPatched,
  });
  const embeddingModel = provider.embedding(opts.embeddingModel);

  try {
    let disbursements = await loadFaacDisbursements(prisma);
    disbursements.sort((a, b) => a.year - b.year || a.month - b.month);
    if (opts.limitMonths && opts.limitMonths > 0) {
      disbursements = disbursements.slice(-opts.limitMonths);
      console.log(
        `Limiting to last ${opts.limitMonths} month(s): ${disbursements
          .map((d) => `${d.monthName} ${d.year}`)
          .join(", ")}`,
      );
    }
    if (disbursements.length === 0) {
      console.log("No FAAC disbursements in DB. Nothing to index.");
      return { upserted: 0 };
    }

    // Build chunks from the FULL disbursement list first so cross-month
    // month-over-month / year-over-year / annual aggregates compute correctly,
    // THEN filter to onlyYear before embedding/upserting.
    let chunks = buildAllFaacChunks(disbursements);
    if (opts.onlyYear) {
      chunks = chunks.filter(
        (c) => (c.metadata as { year?: number }).year === opts.onlyYear,
      );
    }
    console.log(
      `Built ${chunks.length} chunks from ${disbursements.length} disbursement(s)${
        opts.onlyYear ? ` (filtered to year ${opts.onlyYear})` : ""
      }. Index="${indexName}" dim=${dimension}`,
    );
    if (chunks.length === 0) {
      console.log("No chunks to index after filtering. Nothing to do.");
      return { upserted: 0 };
    }

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
      if (msg.includes("already exists"))
        console.log(`Index "${indexName}" exists, continuing.`);
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
    return { upserted: done };
  } finally {
    await pgVector.disconnect();
    await prisma.$disconnect();
    await pool.end();
  }
}
