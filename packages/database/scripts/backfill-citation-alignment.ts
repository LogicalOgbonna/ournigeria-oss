#!/usr/bin/env npx tsx
/**
 * Backfill script: Re-align citation sources in existing assistant messages.
 *
 * Reads all assistant messages with rich_content.sources, applies the
 * alignSourcesToCitations() logic, and updates the JSONB if the order changed.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx packages/database/scripts/backfill-citation-alignment.ts
 *   infisical run --env dev -- npx tsx packages/database/scripts/backfill-citation-alignment.ts --dry-run
 */

import pg from "pg";

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Nigerian states (same list as apps/api/src/mastra/rag/query-analysis.ts) ───

const NIGERIAN_STATES = [
  "abia", "adamawa", "akwa ibom", "anambra", "bauchi", "bayelsa", "benue",
  "borno", "cross river", "delta", "ebonyi", "edo", "ekiti", "enugu", "gombe",
  "imo", "jigawa", "kaduna", "kano", "katsina", "kebbi", "kogi", "kwara",
  "lagos", "nasarawa", "niger", "ogun", "ondo", "osun", "oyo", "plateau",
  "rivers", "sokoto", "taraba", "yobe", "zamfara", "fct", "federal",
];

// ─── Citation alignment (duplicated from router.ts for standalone use) ───

interface SourceCitation {
  title: string;
  fileName: string;
  location: string;
  sourceType: string;
  state?: string;
  year?: number;
  score: number;
  snippet?: string;
  page?: number;
  [key: string]: unknown;
}

const TITLE_STOP_WORDS = new Set([
  "state", "budget", "approved", "fiscal", "year",
  "2020", "2021", "2022", "2023", "2024", "2025", "2026",
  "expenditure", "capital", "recurrent", "total", "sector",
]);

function extractStateName(text: string): string | null {
  const lower = text.toLowerCase();
  let bestState: string | null = null;
  let bestPos = -1;
  const sorted = [...NIGERIAN_STATES].sort((a, b) => b.length - a.length);
  for (const state of sorted) {
    const pos = lower.lastIndexOf(state);
    if (pos !== -1 && pos > bestPos) {
      bestPos = pos;
      bestState = state;
    }
  }
  return bestState;
}

function extractNairaAmounts(text: string): string[] {
  const matches = text.match(/₦[\d,.]+[BTMK]?/gi) || [];
  return matches.map((m) => m.replace(/₦/g, "").replace(/,/g, ""));
}

function matchCitationToSource(
  citationContext: string,
  candidates: SourceCitation[],
): SourceCitation | null {
  if (candidates.length === 0) return null;

  const state = extractStateName(citationContext);
  if (state) {
    const match = candidates.find((s) => s.state?.toLowerCase() === state);
    if (match) return match;
  }

  for (const src of candidates) {
    const keywords = src.title.split(/\s+/).filter(
      (k) => k.length > 3 && !TITLE_STOP_WORDS.has(k.toLowerCase()),
    );
    if (keywords.length > 0 && keywords.some((k) => citationContext.toLowerCase().includes(k.toLowerCase()))) {
      return src;
    }
  }

  const amounts = extractNairaAmounts(citationContext);
  if (amounts.length > 0) {
    for (const src of candidates) {
      if (src.snippet && amounts.some((a) => src.snippet!.includes(a))) {
        return src;
      }
    }
  }

  return null;
}

function alignSourcesToCitations(
  answerText: string,
  sources: SourceCitation[],
): SourceCitation[] {
  if (sources.length === 0) return sources;

  const citationRegex = /\[(\d+)\]/g;
  const seen = new Set<number>();
  const citationOrder: { num: number; pos: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(answerText)) !== null) {
    const num = parseInt(match[1]);
    if (num >= 1 && num <= sources.length && !seen.has(num)) {
      seen.add(num);
      citationOrder.push({ num, pos: match.index });
    }
  }

  if (citationOrder.length === 0) return sources;

  const aligned: (SourceCitation | null)[] = new Array(sources.length).fill(null);
  const usedSources = new Set<SourceCitation>();

  for (const { num, pos } of citationOrder) {
    const contextStart = Math.max(0, pos - 150);
    const context = answerText.slice(contextStart, pos);
    const candidates = sources.filter((s) => !usedSources.has(s));
    const matched = matchCitationToSource(context, candidates);

    if (matched) {
      aligned[num - 1] = matched;
      usedSources.add(matched);
    }
  }

  for (let i = 0; i < aligned.length; i++) {
    if (aligned[i] === null) {
      const original = sources[i];
      if (original && !usedSources.has(original)) {
        aligned[i] = original;
        usedSources.add(original);
      }
    }
  }

  const remaining = sources.filter((s) => !usedSources.has(s));
  let remainIdx = 0;
  for (let i = 0; i < aligned.length; i++) {
    if (aligned[i] === null && remainIdx < remaining.length) {
      aligned[i] = remaining[remainIdx++];
    }
  }

  return aligned.filter((s): s is SourceCitation => s !== null);
}

// ─── Main ───

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  console.log(DRY_RUN ? "DRY RUN — no updates will be made\n" : "LIVE RUN — updating database\n");

  // Find all assistant messages with rich_content that has sources
  const result = await pool.query(`
    SELECT id, content, rich_content
    FROM messages
    WHERE role = 'assistant'
      AND rich_content IS NOT NULL
      AND rich_content->'sources' IS NOT NULL
      AND jsonb_array_length(rich_content->'sources') > 0
    ORDER BY created_at DESC
  `);

  console.log(`Found ${result.rows.length} messages with sources`);

  let updated = 0;
  let skipped = 0;

  for (const row of result.rows) {
    const rc = row.rich_content;
    const text = rc.text ?? row.content ?? "";
    const sources: SourceCitation[] = rc.sources;

    if (!text || sources.length === 0) {
      skipped++;
      continue;
    }

    const aligned = alignSourcesToCitations(text, sources);

    // Check if order actually changed
    const orderChanged = aligned.some(
      (s, i) => s.fileName !== sources[i]?.fileName,
    );

    if (!orderChanged) {
      skipped++;
      continue;
    }

    console.log(`  Message ${row.id}: reordering ${sources.length} sources`);

    // Show the change for verification
    for (let i = 0; i < Math.min(5, sources.length); i++) {
      const before = sources[i]?.state ?? sources[i]?.fileName;
      const after = aligned[i]?.state ?? aligned[i]?.fileName;
      if (before !== after) {
        console.log(`    [${i + 1}] ${before} → ${after}`);
      }
    }

    if (!DRY_RUN) {
      const updatedRc = { ...rc, sources: aligned };
      await pool.query(
        `UPDATE messages SET rich_content = $1 WHERE id = $2`,
        [JSON.stringify(updatedRc), row.id],
      );
    }

    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (already aligned or no citations)`);
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
