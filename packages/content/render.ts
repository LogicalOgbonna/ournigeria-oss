#!/usr/bin/env npx tsx
/**
 * OurNigeria Content Renderer
 *
 * Takes JSON input describing an image and renders branded PNGs.
 * Supports data cards and chart cards.
 *
 * Usage:
 *   npx tsx packages/content/render.ts --input card.json --output output.png
 *   echo '{"type":"data-card","title":"TEST","bigNumber":"₦1B","caption":"Test"}' | npx tsx packages/content/render.ts
 *   npx tsx packages/content/render.ts --input card.json --preview
 *
 * Options:
 *   --input    Path to JSON file (reads stdin if omitted)
 *   --output   Output PNG path (default: output/{timestamp}.png)
 *   --preview  Open image after rendering (macOS: open command)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

import { renderDataCard, type DataCardInput } from "./templates/data-card.js";
import { renderChartCard, type ChartCardInput } from "./templates/chart-card.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── CLI args ────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string, fallback?: string): string {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) {
    if (fallback !== undefined) return fallback;
    return "";
  }
  return args[idx + 1];
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const INPUT_PATH = getArg("input");
const OUTPUT_DIR = join(__dirname, "output");
const OUTPUT_PATH = getArg("output") || join(
  OUTPUT_DIR,
  `card-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.png`,
);
const PREVIEW = hasFlag("preview");

// ─── Read input ──────────────────────────────────────────────────

type CardInput = DataCardInput | ChartCardInput;

function readInput(): CardInput {
  let raw: string;

  if (INPUT_PATH) {
    try {
      raw = readFileSync(INPUT_PATH, "utf-8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Cannot read input file "${INPUT_PATH}": ${msg}`);
      process.exit(1);
    }
  } else {
    // Read from stdin
    try {
      raw = readFileSync("/dev/stdin", "utf-8");
    } catch {
      console.error(
        'No input provided. Use --input <file> or pipe JSON via stdin.\n\n' +
          'Example:\n' +
          '  echo \'{"type":"data-card","title":"TEST","bigNumber":"₦1B","caption":"Test"}\' | npx tsx render.ts\n',
      );
      process.exit(1);
    }
  }

  if (!raw.trim()) {
    console.error("Empty input. Provide JSON describing the card.");
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.type) {
      console.error(
        'Missing "type" field. Must be "data-card" or "chart-card".\n\n' +
          "Data card example:\n" +
          '  {"type":"data-card","title":"STATE BUDGET","bigNumber":"₦100B","caption":"Your Pidgin text here"}\n\n' +
          "Chart card example:\n" +
          '  {"type":"chart-card","title":"COMPARISON","chartType":"bar","chartData":{"labels":["A","B"],"datasets":[{"label":"X","data":[100,200]}]},"caption":"Caption"}',
      );
      process.exit(1);
    }
    return parsed as CardInput;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Invalid JSON: ${msg}`);
    process.exit(1);
  }
}

// ─── Validate input ──────────────────────────────────────────────

function validateInput(input: CardInput): void {
  if (input.type === "data-card") {
    const dc = input as DataCardInput;
    if (!dc.title) { console.error('Missing "title" for data-card'); process.exit(1); }
    if (!dc.bigNumber) { console.error('Missing "bigNumber" for data-card'); process.exit(1); }
    if (!dc.caption) { console.error('Missing "caption" for data-card'); process.exit(1); }
  } else if (input.type === "chart-card") {
    const cc = input as ChartCardInput;
    if (!cc.title) { console.error('Missing "title" for chart-card'); process.exit(1); }
    if (!cc.chartType) { console.error('Missing "chartType" for chart-card'); process.exit(1); }
    if (!cc.chartData) { console.error('Missing "chartData" for chart-card'); process.exit(1); }
    if (!cc.caption) { console.error('Missing "caption" for chart-card'); process.exit(1); }
  } else {
    console.error(`Unknown card type: "${(input as { type: string }).type}". Must be "data-card" or "chart-card".`);
    process.exit(1);
  }
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const input = readInput();
  validateInput(input);

  console.log(`Rendering ${input.type}: "${input.title}"`);

  let buffer: Buffer;
  try {
    if (input.type === "data-card") {
      buffer = await renderDataCard(input as DataCardInput);
    } else {
      buffer = await renderChartCard(input as ChartCardInput);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Render error: ${msg}`);
    process.exit(1);
  }

  // Ensure output directory exists
  const outDir = dirname(OUTPUT_PATH);
  mkdirSync(outDir, { recursive: true });

  writeFileSync(OUTPUT_PATH, buffer);
  console.log(`✓ Saved: ${OUTPUT_PATH} (${(buffer.length / 1024).toFixed(1)} KB)`);

  if (PREVIEW) {
    try {
      execSync(`open "${OUTPUT_PATH}"`, { stdio: "ignore" });
      console.log("✓ Opened for preview");
    } catch {
      console.log("⚠ Could not open preview (open command not available)");
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
