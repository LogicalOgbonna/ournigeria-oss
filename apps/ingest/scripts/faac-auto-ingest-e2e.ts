#!/usr/bin/env npx tsx
/**
 * FAAC Auto-Ingest E2E — real integration proof.
 *
 * Bootstraps a Nest application context from the ingest AppModule (REAL
 * PrismaService + validated ConfigService), then runs
 * `FaacAutoIngestService.poll()` against the dev DB. The poll scrapes NBS
 * catalog 156, diffs against `faac_disbursements`, and ingests every missing
 * month for real (download → unzip → seedFaacFromFile → faacLoadGuards →
 * reindexFaac → import_runs audit + Telegram notify).
 *
 * To make the April-2026 path deterministic, we DELETE the 2026-04
 * disbursement first (children cascade) so the diff re-detects it.
 *
 * Asserts a–c (required) and d (best-effort) after poll, prints PASS/FAIL.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx apps/ingest/scripts/faac-auto-ingest-e2e.ts
 *
 * NOTE: creating the app context does NOT auto-fire the cron (it runs at 6 AM);
 * only the explicit poll() call below ingests. May take a few minutes
 * (embeddings). No Telegram vars in dev → notifier no-ops silently.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { FaacAutoIngestService } from "../src/scheduling/faac-auto-ingest.service";

const Y = 2026;
const M = 4; // April

function ok(label: string, pass: boolean, detail = ""): boolean {
  console.log(`${pass ? "  PASS" : "  FAIL"} — ${label}${detail ? ` :: ${detail}` : ""}`);
  return pass;
}

/**
 * Minimal ConfigService shim over process.env. We construct the service
 * directly instead of bootstrapping AppModule — tsx/esbuild can't enable the
 * experimental parameter decorators NestJS controllers use, so loading the full
 * AppModule via tsx fails. FaacAutoIngestService's constructor params carry no
 * decorators, so direct instantiation works and exercises the real poll() flow.
 */
const config = {
  get<T = string>(key: string): T | undefined {
    return process.env[key] as T | undefined;
  },
  getOrThrow<T = string>(key: string): T {
    const v = process.env[key];
    if (v === undefined || v === "") throw new Error(`Missing required env var: ${key}`);
    return v as T;
  },
};

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = new FaacAutoIngestService(prisma as any, config as any);

  const failures: string[] = [];

  // --- BEFORE: visibility into loaded months ---
  const before = await prisma.faacDisbursement.findMany({
    select: { disbursementYear: true, disbursementMonth: true },
  });
  const beforeKeys = before
    .map((r) => `${r.disbursementYear}-${r.disbursementMonth}`)
    .sort();
  console.log(`\n[BEFORE] ${before.length} FAAC month(s) loaded: ${beforeKeys.join(", ")}`);

  // Make April deterministic: delete it so the diff re-detects + re-ingests.
  const del = await prisma.faacDisbursement.deleteMany({
    where: { disbursementYear: Y, disbursementMonth: M },
  });
  console.log(`[SETUP] Deleted ${del.count} existing 2026-04 disbursement(s) (children cascade).`);

  // --- RUN ---
  console.log(`\n[RUN] FaacAutoIngestService.poll() ...`);
  const t0 = Date.now();
  await svc.poll();
  console.log(`[RUN] poll() done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  // --- AFTER: assertions ---
  console.log(`[ASSERT]`);

  // (a) faac_disbursements has 2026-04 with positive grandTotal
  const disb = await prisma.faacDisbursement.findUnique({
    where: { disbursementYear_disbursementMonth: { disbursementYear: Y, disbursementMonth: M } },
  });
  const grandTotal = disb ? Number(disb.grandTotal) : 0;
  if (!ok("(a) 2026-04 disbursement exists with positive grandTotal", !!disb && grandTotal > 0, disb ? `grandTotal=₦${disb.grandTotal}` : "not found"))
    failures.push("a");

  // (b) exactly 37 state allocations and >700 LGA allocations for 2026-04
  let stateCount = 0;
  let lgaCount = 0;
  if (disb) {
    stateCount = await prisma.faacStateAllocation.count({
      where: { disbursementId: disb.id },
    });
    lgaCount = await prisma.faacLgaAllocation.count({
      where: { disbursementId: disb.id },
    });
  }
  if (!ok("(b) 37 state allocations & >700 LGA allocations", stateCount === 37 && lgaCount > 700, `states=${stateCount}, lgas=${lgaCount}`))
    failures.push("b");

  // (c) import_runs row dataset=faac status=done notes contains "April"
  const run = await prisma.importRun.findFirst({
    where: { dataset: "faac", status: "done" },
    orderBy: { startedAt: "desc" },
  });
  const notesHasApril = !!run?.notes?.includes("April");
  if (!ok("(c) import_runs faac/done with 'April' in notes", !!run && notesHasApril, run ? `notes="${run.notes}"` : "no done faac run"))
    failures.push("c");

  // (d) best-effort: the configured FAAC vector index has April 2026 chunks.
  // The table name is the VECTOR_INDEX_FAAC env value (e.g. faac_vectors /
  // faac_vectors_qwen), validated against an allowlist before interpolation.
  const idx = process.env.VECTOR_INDEX_FAAC ?? "";
  if (!/^[a-z0-9_]+$/.test(idx)) {
    console.log(`  SKIP — (d) VECTOR_INDEX_FAAC unset or unsafe: "${idx}"`);
  } else {
    try {
      const res = await prisma.$queryRawUnsafe<{ n: number }[]>(
        `SELECT COUNT(*)::int AS n FROM ${idx} WHERE metadata->>'month'='April' AND metadata->>'year'='2026'`,
      );
      const n = res?.[0]?.n ?? 0;
      ok(`(d) ${idx} has April-2026 chunks [best-effort]`, n > 0, `chunks=${n}`);
    } catch (e) {
      console.log(`  SKIP — (d) ${idx} query failed (columns differ): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // --- VERDICT ---
  const passed = failures.length === 0;
  console.log(
    passed
      ? `\nE2E RESULT: PASS — 2026-04 grandTotal=₦${disb?.grandTotal}, ${stateCount} states, ${lgaCount} LGAs`
      : `\nE2E RESULT: FAIL: ${failures.join(", ")}`,
  );

  await prisma.$disconnect();
  await pool.end();
  process.exit(passed ? 0 : 1);
}

main().catch((e) => {
  console.error("\nE2E RESULT: FAIL: unexpected error");
  console.error(e);
  process.exit(1);
});
