#!/usr/bin/env npx tsx
/**
 * OurNigeria Video Generation CLI
 *
 * Queries database for real data, validates with Zod, and renders
 * Remotion compositions as MP4 videos for TikTok/social media.
 *
 * Usage:
 *   npx tsx scripts/generate.ts --recipe state-budget --state Lagos --year 2024
 *   npx tsx scripts/generate.ts --recipe corruption --state Lagos
 *   npx tsx scripts/generate.ts --recipe state-comparison --state Lagos --state2 Kano --year 2024
 *   npx tsx scripts/generate.ts --recipe faac --state Lagos --year 2024
 *   npx tsx scripts/generate.ts --recipe money-could-buy --state Lagos --year 2024
 *   npx tsx scripts/generate.ts --recipe state-budget --state Lagos --year 2024 --thumbnail
 *
 * Options:
 *   --recipe     Video type: state-budget|corruption|state-comparison|faac|money-could-buy
 *   --state      Nigerian state name (e.g., Lagos, Kano, FCT)
 *   --state2     Second state (for state-comparison recipe only)
 *   --year       Fiscal year (e.g., 2024)
 *   --thumbnail  Also render hero frame as PNG
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import pg from "pg";
import { RECIPES, schemas, type Recipe } from "./schemas";
import {
  queryStateBudget,
  queryCorruptionCase,
  queryStateComparison,
  queryFaacAllocation,
  queryMoneyCouldBuy,
} from "./queries";

const { Pool } = pg;

// ─── CLI Argument Parsing ────────────────────────────────────

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

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

// ─── Composition ID Map ──────────────────────────────────────

const COMPOSITION_MAP: Record<Recipe, { id: string; durationInFrames: number }> = {
  "state-budget": { id: "StateBudget", durationInFrames: 900 },
  corruption: { id: "CorruptionCase", durationInFrames: 900 },
  "state-comparison": { id: "StateComparison", durationInFrames: 1050 },
  faac: { id: "FAACAllocation", durationInFrames: 900 },
  "money-could-buy": { id: "MoneyCouldBuy", durationInFrames: 750 },
};

// Hero frame for thumbnail (the "big reveal" moment)
const HERO_FRAME: Record<Recipe, number> = {
  "state-budget": 80, // Big budget number visible
  corruption: 80, // Amount visible
  "state-comparison": 700, // Winner reveal
  faac: 80, // Total allocation visible
  "money-could-buy": 300, // Impact grid fully visible
};

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const recipe = getArg("recipe") as Recipe;
  if (!RECIPES.includes(recipe)) {
    console.error(
      `Invalid --recipe: "${recipe}". Must be one of: ${RECIPES.join(", ")}`,
    );
    process.exit(1);
  }

  const state = hasFlag("state") ? getArg("state") : undefined;
  const state2 = hasFlag("state2") ? getArg("state2") : undefined;
  const year = hasFlag("year") ? parseInt(getArg("year"), 10) : undefined;
  const thumbnail = hasFlag("thumbnail");

  // Validate required args per recipe
  if (recipe !== "corruption" && !state) {
    console.error(`--state is required for recipe "${recipe}"`);
    process.exit(1);
  }
  if (recipe !== "corruption" && !year) {
    console.error(`--year is required for recipe "${recipe}"`);
    process.exit(1);
  }
  if (recipe === "state-comparison" && !state2) {
    console.error(`--state2 is required for recipe "state-comparison"`);
    process.exit(1);
  }

  // Database connection
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(
      "Missing DATABASE_URL. Run with: infisical run --env dev -- npx tsx scripts/generate.ts ...",
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  try {
    // Verify connection
    await pool.query("SELECT 1");
    console.log("✓ Database connected");

    // Query data based on recipe
    console.log(`\nQuerying data for recipe: ${recipe}...`);
    let rawData: unknown;

    switch (recipe) {
      case "state-budget":
        rawData = await queryStateBudget(pool, state!, year!);
        break;
      case "corruption":
        rawData = await queryCorruptionCase(pool, state);
        break;
      case "state-comparison":
        rawData = await queryStateComparison(pool, state!, state2!, year!);
        break;
      case "faac":
        rawData = await queryFaacAllocation(pool, state!, year!);
        break;
      case "money-could-buy":
        rawData = await queryMoneyCouldBuy(pool, state!, year!);
        break;
    }

    if (!rawData) {
      console.error(`\n✗ No data found for ${recipe} (state=${state}, year=${year}). Skipping.`);
      process.exit(1);
    }

    // Validate with Zod
    const schema = schemas[recipe];
    const parseResult = schema.safeParse(rawData);
    if (!parseResult.success) {
      console.error("\n✗ Data validation failed:");
      for (const issue of parseResult.error.issues) {
        console.error(`  ${issue.path.join(".")}: ${issue.message}`);
      }
      process.exit(1);
    }

    const props = parseResult.data;
    console.log("✓ Data validated");
    console.log(`  ${JSON.stringify(props).slice(0, 200)}...`);

    // Prepare output directory
    const comp = COMPOSITION_MAP[recipe];
    const slugParts: string[] = [recipe];
    if (state) slugParts.push(state.toLowerCase().replace(/\s+/g, "-"));
    if (state2) slugParts.push("vs", state2.toLowerCase().replace(/\s+/g, "-"));
    if (year) slugParts.push(String(year));
    const slug = slugParts.join("-");

    const outDir = path.resolve(__dirname, "..", "out", recipe);
    fs.mkdirSync(outDir, { recursive: true });

    const outFile = path.join(outDir, `${slug}.mp4`);
    const propsJson = JSON.stringify(props);

    // Render video
    console.log(`\nRendering ${comp.id} (${comp.durationInFrames} frames)...`);
    const startTime = Date.now();

    const renderCmd = [
      "npx remotion render",
      comp.id,
      `"${outFile}"`,
      `--props='${propsJson.replace(/'/g, "\\'")}'`,
    ].join(" ");

    try {
      execSync(renderCmd, {
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit",
        timeout: 600_000, // 10 minutes max
      });
    } catch (renderError) {
      console.error(`\n✗ Render failed for ${slug}`);
      throw renderError;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Video rendered: ${outFile} (${elapsed}s)`);

    // Thumbnail
    if (thumbnail) {
      const thumbFile = path.join(outDir, `${slug}-thumb.png`);
      const heroFrame = HERO_FRAME[recipe];
      console.log(`\nRendering thumbnail (frame ${heroFrame})...`);

      const thumbCmd = [
        "npx remotion still",
        comp.id,
        `"${thumbFile}"`,
        `--frame=${heroFrame}`,
        `--props='${propsJson.replace(/'/g, "\\'")}'`,
      ].join(" ");

      try {
        execSync(thumbCmd, {
          cwd: path.resolve(__dirname, ".."),
          stdio: "inherit",
          timeout: 60_000,
        });
        console.log(`✓ Thumbnail: ${thumbFile}`);
      } catch (thumbError) {
        console.error(`⚠ Thumbnail render failed (non-fatal)`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\nFatal error: ${msg}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
