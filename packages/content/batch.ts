#!/usr/bin/env npx tsx
/**
 * Content Batch Generator + Calendar
 *
 * Generates a week's worth of content by:
 * 1. Loading all recipes
 * 2. Checking content index for recent coverage
 * 3. Selecting states/topics for balanced coverage
 * 4. Executing recipes in sequence
 * 5. Outputting a content calendar
 *
 * Usage:
 *   npx tsx batch.ts --days 7 --per-day 2
 *   npx tsx batch.ts --days 7 --per-day 2 --recipes budget-expose,corruption-impact
 *   npx tsx batch.ts --coverage    # Show coverage report only
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

import type { Recipe, RecipeParams, ContentCalendar, CalendarDay, CalendarSlot, FormatType } from "./recipes/types.js";
import { executeRecipe, listRecipes, getRecipe } from "./engine.js";
import { loadIndex, addEntry, getUncoveredStates, hasRecentContent } from "./lib/index-manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, "output");

// ─── Nigerian States ────────────────────────────────────────────

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT",
];

// ─── CLI ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string, fallback?: string): string {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) {
    if (fallback !== undefined) return fallback;
    console.error(`Missing required argument: --${name}`);
    process.exit(1);
  }
  return args[idx + 1];
}
const hasFlag = (name: string) => args.includes(`--${name}`);

// ─── Coverage Report ────────────────────────────────────────────

function showCoverageReport(): void {
  const index = loadIndex();
  const recipes = listRecipes();

  console.log("\n" + "=".repeat(60));
  console.log("CONTENT COVERAGE REPORT (last 14 days)");
  console.log("=".repeat(60));

  for (const recipe of recipes) {
    const uncovered = getUncoveredStates(index, recipe.id, NIGERIAN_STATES);
    const covered = NIGERIAN_STATES.length - uncovered.length;
    const pct = ((covered / NIGERIAN_STATES.length) * 100).toFixed(0);

    console.log(`\n${recipe.name} (${recipe.id})`);
    console.log(`  Coverage: ${covered}/${NIGERIAN_STATES.length} states (${pct}%)`);

    if (uncovered.length > 0 && uncovered.length <= 10) {
      console.log(`  Uncovered: ${uncovered.join(", ")}`);
    } else if (uncovered.length > 10) {
      console.log(`  Uncovered: ${uncovered.slice(0, 10).join(", ")} +${uncovered.length - 10} more`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Total index entries: ${index.entries.length}`);
}

// ─── Batch Planning ─────────────────────────────────────────────

interface BatchSlot {
  recipe: Recipe;
  params: RecipeParams;
}

function planBatch(
  days: number,
  perDay: number,
  recipeIds?: string[],
): BatchSlot[] {
  const index = loadIndex();
  const slots: BatchSlot[] = [];
  const totalSlots = days * perDay;

  // Filter recipes
  const recipes = recipeIds
    ? recipeIds.map((id) => getRecipe(id)).filter(Boolean) as Recipe[]
    : listRecipes().filter((r) =>
        // Skip cross-domain recipes for auto-batch (require specific params)
        r.requiredParams.every((p) => p === "state" || p === "year"),
      );

  if (recipes.length === 0) {
    console.error("No suitable recipes for batch generation.");
    process.exit(1);
  }

  // Build pool of uncovered state/recipe combinations
  const pool: BatchSlot[] = [];
  for (const recipe of recipes) {
    const uncovered = getUncoveredStates(index, recipe.id, NIGERIAN_STATES);
    // Prioritize uncovered states but include covered ones at lower priority
    const statesToUse = uncovered.length > 0
      ? uncovered
      : NIGERIAN_STATES;

    for (const state of statesToUse) {
      const params: RecipeParams = {
        state,
        year: new Date().getFullYear(),
      };

      if (!hasRecentContent(index, recipe.id, params)) {
        pool.push({ recipe, params });
      }
    }
  }

  // Shuffle pool for variety
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Select slots, balancing recipes
  const recipeCounts = new Map<string, number>();
  for (const slot of pool) {
    if (slots.length >= totalSlots) break;

    const count = recipeCounts.get(slot.recipe.id) ?? 0;
    const maxPerRecipe = Math.ceil(totalSlots / recipes.length);

    if (count < maxPerRecipe) {
      slots.push(slot);
      recipeCounts.set(slot.recipe.id, count + 1);
    }
  }

  // Fill remaining with any available
  if (slots.length < totalSlots) {
    for (const slot of pool) {
      if (slots.length >= totalSlots) break;
      if (!slots.some((s) =>
        s.recipe.id === slot.recipe.id &&
        s.params.state === slot.params.state,
      )) {
        slots.push(slot);
      }
    }
  }

  return slots;
}

// ─── Batch Execution ────────────────────────────────────────────

async function executeBatch(
  slots: BatchSlot[],
  days: number,
  perDay: number,
): Promise<ContentCalendar> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  const startDate = new Date();
  const calendar: ContentCalendar = {
    generatedAt: startDate.toISOString(),
    startDate: startDate.toISOString().slice(0, 10),
    endDate: new Date(
      startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000,
    ).toISOString().slice(0, 10),
    days: [],
  };

  let slotIdx = 0;
  let successCount = 0;
  let failCount = 0;

  try {
    await pool.query("SELECT 1");
    console.log("Database connected.\n");

    for (let day = 0; day < days; day++) {
      const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

      console.log(`\n${"=".repeat(60)}`);
      console.log(`DAY ${day + 1}: ${dayName} (${dateStr})`);
      console.log("=".repeat(60));

      const calendarDay: CalendarDay = { date: dateStr, slots: [] };

      for (let s = 0; s < perDay; s++) {
        if (slotIdx >= slots.length) {
          console.log("  No more content to generate.");
          break;
        }

        const slot = slots[slotIdx++];
        console.log(
          `\n  Slot ${s + 1}/${perDay}: ${slot.recipe.id} — ${slot.params.state}`,
        );

        try {
          const piece = await executeRecipe(
            slot.recipe,
            slot.params,
            pool,
            ["twitter-thread", "whatsapp"],
          );

          // Write outputs
          mkdirSync(OUTPUT_DIR, { recursive: true });
          const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          const state = (slot.params.state ?? "national").toLowerCase().replace(/\s+/g, "-");
          const outputFiles: string[] = [];

          // Write thread markdown
          const twitterOutput = piece.formatted["twitter-thread"];
          if (twitterOutput && Array.isArray(twitterOutput.content) && twitterOutput.content.length > 0) {
            const { buildThreadMarkdown } = await import("./formats/twitter-thread.js");
            const md = buildThreadMarkdown(twitterOutput.content, piece.params, piece.recipeId);
            const fileName = `${piece.recipeId}-${state}-${piece.params.year ?? "latest"}-${ts}.md`;
            writeFileSync(join(OUTPUT_DIR, fileName), md);
            outputFiles.push(fileName);
          }

          // Write WhatsApp
          const waOutput = piece.formatted["whatsapp"];
          if (waOutput && typeof waOutput.content === "string") {
            const fileName = `${piece.recipeId}-${state}-whatsapp-${ts}.txt`;
            writeFileSync(join(OUTPUT_DIR, fileName), waOutput.content);
            outputFiles.push(fileName);
          }

          // Update index
          const index = loadIndex();
          const entry = addEntry(index, {
            recipeId: piece.recipeId,
            params: piece.params,
            generatedAt: piece.generatedAt,
            outputFiles,
            status: "draft",
          });

          calendarDay.slots.push({
            recipeId: slot.recipe.id,
            params: slot.params,
            indexEntryId: entry.id,
          });

          successCount++;
          console.log(`  Done. ${outputFiles.length} files generated.`);
        } catch (err) {
          failCount++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  FAILED: ${msg}`);
          // Continue with next slot
        }

        // Brief delay between generations
        if (slotIdx < slots.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      calendar.days.push(calendarDay);
    }
  } finally {
    await pool.end();
  }

  return calendar;
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("OurNigeria Content Batch Generator\n");

  if (hasFlag("coverage")) {
    showCoverageReport();
    return;
  }

  const days = parseInt(getArg("days", "7"), 10);
  const perDay = parseInt(getArg("per-day", "2"), 10);
  const recipeArg = args.includes("--recipes") ? getArg("recipes") : undefined;
  const recipeIds = recipeArg ? recipeArg.split(",") : undefined;

  console.log(`Planning ${days} days, ${perDay} per day...`);

  const slots = planBatch(days, perDay, recipeIds);
  console.log(`Planned ${slots.length} content pieces:\n`);

  for (const slot of slots) {
    console.log(
      `  ${slot.recipe.id}: ${slot.params.state}${slot.params.year ? ` (${slot.params.year})` : ""}`,
    );
  }

  if (slots.length === 0) {
    console.log(
      "\nAll state/recipe combinations have recent content. Nothing to generate.",
    );
    return;
  }

  console.log(`\nExecuting ${slots.length} recipes...`);

  const calendar = await executeBatch(slots, days, perDay);

  // Write calendar
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const calendarPath = join(OUTPUT_DIR, `calendar-${calendar.startDate}.json`);
  writeFileSync(calendarPath, JSON.stringify(calendar, null, 2));
  console.log(`\nCalendar saved: ${calendarPath}`);

  // Summary
  const totalSlots = calendar.days.reduce((sum, d) => sum + d.slots.length, 0);
  console.log(`\n${"=".repeat(60)}`);
  console.log("BATCH COMPLETE");
  console.log("=".repeat(60));
  console.log(`Days: ${calendar.days.length}`);
  console.log(`Content pieces: ${totalSlots}`);
  console.log(`Calendar: ${calendarPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
