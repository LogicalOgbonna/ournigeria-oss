#!/usr/bin/env npx tsx
/**
 * Smoke test: renders frame 0 of each social media composition.
 * Verifies compositions don't crash without needing real data.
 * Uses default props defined in Root.tsx.
 *
 * Usage:
 *   cd apps/videos && npx tsx scripts/smoke-test.ts
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const COMPOSITIONS = [
  "StateBudget",
  "CorruptionCase",
  "StateComparison",
  "FAACAllocation",
  "MoneyCouldBuy",
];

const outDir = path.resolve(__dirname, "..", "out", "smoke-test");
fs.mkdirSync(outDir, { recursive: true });

let passed = 0;
let failed = 0;

for (const comp of COMPOSITIONS) {
  const outFile = path.join(outDir, `${comp}-frame0.png`);
  console.log(`\nRendering ${comp} frame 0...`);

  try {
    execSync(
      `npx remotion still ${comp} "${outFile}" --frame=0`,
      {
        cwd: path.resolve(__dirname, ".."),
        stdio: "pipe",
        timeout: 60_000,
      },
    );

    // Verify file exists and has content
    const stats = fs.statSync(outFile);
    if (stats.size > 0) {
      console.log(`  ✓ ${comp} — OK (${(stats.size / 1024).toFixed(0)}KB)`);
      passed++;
    } else {
      console.log(`  ✗ ${comp} — Empty file`);
      failed++;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ${comp} — FAILED: ${msg.slice(0, 200)}`);
    failed++;
  }
}

console.log(`\n${"─".repeat(40)}`);
console.log(`Smoke test: ${passed} passed, ${failed} failed out of ${COMPOSITIONS.length}`);

if (failed > 0) {
  process.exit(1);
}
