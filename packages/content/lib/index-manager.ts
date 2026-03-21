/**
 * Content History Index Manager
 *
 * Tracks generated content to prevent duplicates and enable
 * coverage-aware batch generation.
 *
 * Index is stored as JSON at packages/content/content-index.json.
 * If the file is corrupted, it rebuilds from the output/ directory.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import type { ContentIndex, ContentIndexEntry, RecipeParams } from "../recipes/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INDEX_PATH = join(__dirname, "..", "content-index.json");
const OUTPUT_DIR = join(__dirname, "..", "output");

function emptyIndex(): ContentIndex {
  return { version: 1, entries: [] };
}

/**
 * Load the content index from disk.
 * Returns empty index if file doesn't exist.
 * Rebuilds from output/ if JSON is corrupt.
 */
export function loadIndex(): ContentIndex {
  if (!existsSync(INDEX_PATH)) {
    return emptyIndex();
  }

  try {
    const raw = readFileSync(INDEX_PATH, "utf-8");
    const parsed = JSON.parse(raw) as ContentIndex;
    if (!parsed.version || !Array.isArray(parsed.entries)) {
      console.warn("[index] Invalid index structure, rebuilding...");
      return rebuildFromOutput();
    }
    return parsed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[index] Corrupt index (${msg}), rebuilding from output/`);
    return rebuildFromOutput();
  }
}

/**
 * Save the content index to disk.
 */
export function saveIndex(index: ContentIndex): void {
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

/**
 * Add a new entry to the index and persist.
 */
export function addEntry(
  index: ContentIndex,
  entry: Omit<ContentIndexEntry, "id">,
): ContentIndexEntry {
  const full: ContentIndexEntry = {
    id: randomUUID(),
    ...entry,
  };
  index.entries.push(full);
  saveIndex(index);
  return full;
}

/**
 * Check if content for this recipe + params was generated recently.
 * "Recently" means within the last `daysThreshold` days.
 */
export function hasRecentContent(
  index: ContentIndex,
  recipeId: string,
  params: RecipeParams,
  daysThreshold = 14,
): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysThreshold);
  const cutoffISO = cutoff.toISOString();

  return index.entries.some(
    (e) =>
      e.recipeId === recipeId &&
      e.generatedAt > cutoffISO &&
      matchParams(e.params, params),
  );
}

function matchParams(a: RecipeParams, b: RecipeParams): boolean {
  return (
    normalize(a.state) === normalize(b.state) &&
    a.year === b.year &&
    normalize(a.official) === normalize(b.official)
  );
}

function normalize(s: string | undefined): string | undefined {
  return s?.toLowerCase().trim();
}

/**
 * Get states that haven't been covered by a recipe in the last N days.
 */
export function getUncoveredStates(
  index: ContentIndex,
  recipeId: string,
  allStates: string[],
  daysThreshold = 14,
): string[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysThreshold);
  const cutoffISO = cutoff.toISOString();

  const coveredStates = new Set(
    index.entries
      .filter((e) => e.recipeId === recipeId && e.generatedAt > cutoffISO)
      .map((e) => e.params.state?.toLowerCase())
      .filter(Boolean),
  );

  return allStates.filter((s) => !coveredStates.has(s.toLowerCase()));
}

/**
 * Rebuild index from output/ directory filenames.
 * Extracts recipe type, state, year from filename pattern:
 *   {type}-{state}-{year}-{timestamp}.md
 */
function rebuildFromOutput(): ContentIndex {
  const index = emptyIndex();

  if (!existsSync(OUTPUT_DIR)) {
    return index;
  }

  try {
    const files = readdirSync(OUTPUT_DIR).filter(
      (f) => f.endsWith(".md") || f.endsWith(".json"),
    );

    for (const file of files) {
      // Pattern: budget-expose-lagos-2024-2026-03-17T04-35-11.md
      const match = file.match(
        /^([a-z-]+)-([a-z-]+)-(\d+|unknown)-(\d{4}-\d{2}-\d{2})/,
      );
      if (match) {
        index.entries.push({
          id: randomUUID(),
          recipeId: match[1],
          params: {
            state: match[2].replace(/-/g, " "),
            year: match[3] !== "unknown" ? parseInt(match[3], 10) : undefined,
          },
          generatedAt: match[4] + "T00:00:00.000Z",
          outputFiles: [file],
          status: "draft",
        });
      }
    }

    console.log(
      `[index] Rebuilt ${index.entries.length} entries from output/`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[index] Could not rebuild from output/: ${msg}`);
  }

  saveIndex(index);
  return index;
}
