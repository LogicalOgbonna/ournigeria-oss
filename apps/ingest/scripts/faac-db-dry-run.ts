#!/usr/bin/env npx tsx
/**
 * FAAC DB Chunk Dry Run
 *
 * Reads the structured FAAC tables from the database, builds chunks with the
 * DB-driven chunk builder, and prints per-type counts + one sample of each
 * type. No embedding, no vector upsert — purely validates chunk richness
 * against real DB data.
 *
 * Usage:
 *   DATABASE_URL=postgresql://spending:spending@127.0.0.1:5432/spending \
 *     npx tsx apps/ingest/scripts/faac-db-dry-run.ts [--type state_monthly] [--full]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { loadFaacDisbursements } from "../src/pipeline/faac-db-loader";
import {
  buildAllFaacChunks,
  type FaacChunk,
} from "../src/pipeline/faac-db-chunk-builder";

const args = process.argv.slice(2);
const typeFilter = args.includes("--type")
  ? args[args.indexOf("--type") + 1]
  : null;
const full = args.includes("--full");

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const disbursements = await loadFaacDisbursements(prisma);
    console.log(`\nLoaded ${disbursements.length} disbursements from DB.`);
    if (disbursements.length === 0) {
      console.log("No FAAC data in DB. Run seed-faac-excel.ts first.");
      return;
    }

    const periods = disbursements
      .map((d) => `${d.monthName} ${d.year}`)
      .join(", ");
    console.log(`Periods: ${periods}\n`);

    const chunks = buildAllFaacChunks(disbursements);

    // Per-type counts.
    const counts = new Map<string, number>();
    for (const c of chunks) {
      const t = c.metadata.chunk_type as string;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    console.log("=== Chunk counts by type ===");
    for (const [t, n] of [...counts.entries()].sort()) {
      console.log(`  ${t.padEnd(18)} ${n}`);
    }
    console.log(`  ${"TOTAL".padEnd(18)} ${chunks.length}\n`);

    // ID uniqueness check.
    const ids = new Set(chunks.map((c) => c.id));
    console.log(
      `=== ID uniqueness: ${ids.size}/${chunks.length} unique ${
        ids.size === chunks.length ? "✓" : "✗ DUPLICATES!"
      } ===\n`,
    );

    // Samples.
    const sampleTypes = typeFilter ? [typeFilter] : [...counts.keys()].sort();
    for (const t of sampleTypes) {
      const sample = chunks.find((c) => c.metadata.chunk_type === t);
      if (!sample) continue;
      console.log(`========== SAMPLE: ${t} ==========`);
      console.log(`id: ${sample.id}`);
      console.log(sample.text);
      if (full) {
        const { text: _t, ...meta } = sample.metadata as Record<string, unknown>;
        console.log(`metadata: ${JSON.stringify(meta)}`);
      }
      console.log("");
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
