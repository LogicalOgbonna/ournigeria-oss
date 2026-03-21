#!/usr/bin/env npx tsx
/**
 * Content Engine — Recipe Executor
 *
 * Executes content recipes by:
 * 1. Loading recipe config
 * 2. Fetching data (DB chunks + filesystem for corruption .md files)
 * 3. Building prompt from assembled data
 * 4. Calling LLM for Pidgin content generation
 * 5. Running format adapters (twitter/instagram/video/whatsapp)
 * 6. Writing output files + updating content index
 *
 * ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
 * │  Recipe   │───▶│  Fetch   │───▶│  LLM      │───▶│  Format  │
 * │  Config   │    │  Data    │    │  Generate  │    │  Adapt   │
 * └──────────┘    └──────────┘    └───────────┘    └──────────┘
 *                  │        │                        │
 *                  ▼        ▼                        ▼
 *               DB chunks  .md files              twitter/
 *              (query.ts)  (filesystem)           instagram/
 *                                                 video/whatsapp
 *
 * Usage:
 *   npx tsx engine.ts --recipe budget-expose --state Lagos --year 2024
 *   npx tsx engine.ts --recipe corruption-impact --official James_Ibori --state Delta
 *   npx tsx engine.ts --recipe state-comparison --state Lagos --state2 Kano --year 2024
 *   npx tsx engine.ts --recipe faac-allocation --state Bayelsa --year 2024
 *   npx tsx engine.ts --recipe budget-expose --state Lagos --formats twitter-thread,whatsapp
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

import type { Recipe, RecipeParams, ContentPiece, FormattedOutput, FormatType, DataSourceConfig } from "./recipes/types.js";
import { budgetExposeRecipe } from "./recipes/budget-expose.js";
import { corruptionImpactRecipe } from "./recipes/corruption-impact.js";
import { stateComparisonRecipe } from "./recipes/state-comparison.js";
import { faacAllocationRecipe } from "./recipes/faac-allocation.js";
import { getLLMClient, getLLMModel, withRetry } from "./lib/llm.js";
import { loadIndex, addEntry } from "./lib/index-manager.js";
import { formatTwitterThread, parseTweets, buildShortenPrompt, buildThreadMarkdown } from "./formats/twitter-thread.js";
import { formatInstagramCarousel } from "./formats/instagram-carousel.js";
import { formatVideoScript } from "./formats/video-script.js";
import { formatWhatsApp } from "./formats/whatsapp-forward.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE_DIR = join(__dirname, "..", "source");
const OUTPUT_DIR = join(__dirname, "output");

// ─── Recipe Registry ────────────────────────────────────────────

const RECIPES: Record<string, Recipe> = {
  "budget-expose": budgetExposeRecipe,
  "corruption-impact": corruptionImpactRecipe,
  "state-comparison": stateComparisonRecipe,
  "faac-allocation": faacAllocationRecipe,
};

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES[id];
}

export function listRecipes(): Recipe[] {
  return Object.values(RECIPES);
}

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

// ─── Data Fetching ──────────────────────────────────────────────

function createPool(): pg.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Missing DATABASE_URL. Run with: infisical run --env dev -- npx tsx engine.ts ...");
    process.exit(1);
  }
  return new pg.Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

async function fetchDbData(
  pool: pg.Pool,
  source: DataSourceConfig & { type: "db" },
  params: RecipeParams,
): Promise<string> {
  const indexEnvMap: Record<string, string> = {
    budget: "VECTOR_INDEX_BUDGET",
    corruption: "VECTOR_INDEX_CORRUPTION",
    faac: "VECTOR_INDEX_FAAC",
    govspend: "VECTOR_INDEX_GOVSPEND",
  };

  const indexName = process.env[indexEnvMap[source.domain]];
  if (!indexName) {
    return `[No vector index configured for ${source.domain}]`;
  }

  const state = params.state
    ? params.state.charAt(0).toUpperCase() + params.state.slice(1).toLowerCase()
    : undefined;

  // Build query based on domain
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramIdx = 0;

  if (state) {
    paramIdx++;
    conditions.push(`metadata->>'state' = $${paramIdx}`);
    values.push(state);
  }

  if (params.year) {
    paramIdx++;
    conditions.push(`(metadata->>'year')::int = $${paramIdx}`);
    values.push(params.year);
  }

  // For state comparison, also fetch second state
  let secondStateData = "";
  if (params.state2 && source.domain === "budget") {
    const state2 = params.state2.charAt(0).toUpperCase() + params.state2.slice(1).toLowerCase();
    const s2Conditions = [`metadata->>'state' = $1`];
    const s2Values: (string | number)[] = [state2];
    if (params.year) {
      s2Conditions.push(`(metadata->>'year')::int = $2`);
      s2Values.push(params.year);
    }

    try {
      const s2Result = await pool.query(
        `SELECT metadata->>'text' as text, metadata->>'sector' as sector,
                metadata->>'budget_category' as category
         FROM "${indexName}"
         WHERE ${s2Conditions.join(" AND ")}
         ORDER BY metadata->>'sector'
         LIMIT 20`,
        s2Values,
      );
      secondStateData = s2Result.rows
        .map((r: Record<string, string>) => {
          const tags = [r.sector, r.category].filter(Boolean).join(" | ");
          return tags ? `[${tags}] ${r.text}` : r.text;
        })
        .join("\n\n");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  Warning: Could not fetch data for ${state2}: ${msg}`);
    }
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  paramIdx++;
  const limitParam = `$${paramIdx}`;
  values.push(20);

  try {
    const result = await pool.query(
      `SELECT metadata->>'text' as text, metadata->>'sector' as sector,
              metadata->>'budget_category' as category, metadata->>'state' as state,
              metadata->>'year' as year
       FROM "${indexName}"
       ${whereClause}
       ORDER BY metadata->>'sector'
       LIMIT ${limitParam}`,
      values,
    );

    if (result.rows.length === 0) {
      return `[No ${source.domain} data found for ${state ?? "any state"}${params.year ? ` in ${params.year}` : ""}]`;
    }

    let data = result.rows
      .map((r: Record<string, string>) => {
        const tags = [r.state, r.year, r.sector, r.category].filter(Boolean).join(" | ");
        return tags ? `[${tags}] ${r.text}` : r.text;
      })
      .join("\n\n");

    if (secondStateData) {
      data += `\n\n--- ${params.state2} DATA ---\n\n${secondStateData}`;
    }

    // Also fetch budget summaries if available
    if (source.domain === "budget" && state) {
      try {
        const summaryQuery = params.year
          ? `SELECT total_budget, allocations, population_estimate FROM budget_summaries WHERE state_code = $1 AND fiscal_year = $2`
          : `SELECT fiscal_year, total_budget, allocations, population_estimate FROM budget_summaries WHERE state_code = $1 ORDER BY fiscal_year DESC LIMIT 3`;
        const summaryParams = params.year ? [state, params.year] : [state];
        const summaries = await pool.query(summaryQuery, summaryParams);

        if (summaries.rows.length > 0) {
          const summaryText = summaries.rows.map((row: Record<string, unknown>) => {
            const year = (row as Record<string, unknown>).fiscal_year ?? params.year;
            const total = row.total_budget;
            const pop = row.population_estimate;
            let line = `SUMMARY ${year}: Total Budget ₦${Number(total).toLocaleString()}`;
            if (pop) line += `, Population: ${Number(pop).toLocaleString()}`;
            if (row.allocations && typeof row.allocations === "object") {
              const allocs = row.allocations as Record<string, unknown>;
              const topSectors = Object.entries(allocs)
                .filter(([, v]) => typeof v === "number")
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([k, v]) => `${k}: ₦${Number(v).toLocaleString()}`)
                .join(", ");
              if (topSectors) line += `\n  Top sectors: ${topSectors}`;
            }
            return line;
          }).join("\n");
          data = `${summaryText}\n\n${data}`;
        }
      } catch {
        // Budget summaries table may not exist, skip silently
      }
    }

    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `[Error querying ${source.domain}: ${msg}]`;
  }
}

function fetchFilesystemData(
  source: DataSourceConfig & { type: "filesystem" },
  params: RecipeParams,
): string {
  // Replace placeholders in path pattern
  let path = source.pathPattern;
  if (params.official) {
    path = path.replace("{official}", params.official.replace(/\s+/g, "_"));
  }
  if (params.state) {
    path = path.replace("{state}", params.state.replace(/\s+/g, "_"));
  }

  const fullPath = join(SOURCE_DIR, path);

  if (!existsSync(fullPath)) {
    console.warn(`  Warning: Source path not found: ${fullPath}`);
    return `[Source directory not found: ${path}]`;
  }

  const sections = source.sections ?? [
    "overview",
    "charges",
    "case_outcome",
    "timeline",
    "court_proceedings",
    "key_players",
  ];

  const parts: string[] = [];

  for (const section of sections) {
    const filePath = join(fullPath, `${section}.md`);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf-8");
        parts.push(`## ${section.replace(/_/g, " ").toUpperCase()}\n\n${content}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  Warning: Could not read ${filePath}: ${msg}`);
      }
    }
  }

  if (parts.length === 0) {
    // Try reading all .md files in directory
    try {
      const files = readdirSync(fullPath).filter((f) => f.endsWith(".md"));
      for (const file of files.slice(0, 10)) {
        const content = readFileSync(join(fullPath, file), "utf-8");
        const sectionName = file.replace(".md", "").replace(/_/g, " ").toUpperCase();
        parts.push(`## ${sectionName}\n\n${content}`);
      }
    } catch {
      return `[Could not read files from ${path}]`;
    }
  }

  return parts.join("\n\n---\n\n");
}

async function fetchData(
  pool: pg.Pool,
  recipe: Recipe,
  params: RecipeParams,
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  for (const source of recipe.dataSources) {
    console.log(`  Fetching ${source.domain} data (${source.type})...`);

    if (source.type === "db") {
      data[source.domain] = await fetchDbData(pool, source, params);
    } else if (source.type === "filesystem") {
      data[source.domain] = fetchFilesystemData(source, params);
    }
  }

  return data;
}

// ─── Format Execution ───────────────────────────────────────────

function runFormat(
  formatType: FormatType,
  llmOutput: string,
  params: RecipeParams,
  recipeId: string,
): FormattedOutput {
  switch (formatType) {
    case "twitter-thread":
      return formatTwitterThread(llmOutput, params, recipeId);
    case "instagram-carousel":
      return formatInstagramCarousel(llmOutput, params, recipeId);
    case "video-script":
      return formatVideoScript(llmOutput, params, recipeId);
    case "whatsapp":
      return formatWhatsApp(llmOutput, params, recipeId);
    default:
      return { type: formatType, content: llmOutput };
  }
}

// ─── Engine Core ────────────────────────────────────────────────

export async function executeRecipe(
  recipe: Recipe,
  params: RecipeParams,
  pool: pg.Pool,
  formats?: FormatType[],
): Promise<ContentPiece> {
  const activeFormats = formats ?? recipe.formats;

  console.log(`\nExecuting recipe: ${recipe.name}`);
  console.log(`  Params: ${JSON.stringify(params)}`);
  console.log(`  Formats: ${activeFormats.join(", ")}`);

  // 1. Validate required params
  for (const req of recipe.requiredParams) {
    if (!params[req]) {
      throw new Error(
        `Missing required parameter '${req}' for recipe '${recipe.id}'`,
      );
    }
  }

  // 2. Fetch data
  const data = await fetchData(pool, recipe, params);

  // 3. Build prompt and call LLM
  const { system, user } = recipe.promptBuilder(data, params);

  console.log(`  Calling LLM (${getLLMModel()})...`);
  const llmClient = getLLMClient();

  const completion = await withRetry(
    () =>
      llmClient.chat.completions.create({
        model: getLLMModel(),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        max_completion_tokens: 3000,
      }),
    `engine:${recipe.id}`,
  );

  let rawContent = completion.choices[0]?.message?.content ?? "";

  // 3b. Retry oversized tweets if twitter format is active
  if (activeFormats.includes("twitter-thread")) {
    const tweets = parseTweets(rawContent);
    const oversized = tweets.filter((t) => t.length > 280);
    if (oversized.length > 0 && tweets.length > 0) {
      console.log(`  Retrying ${oversized.length} oversized tweet(s)...`);
      try {
        const retryCompletion = await withRetry(
          () =>
            llmClient.chat.completions.create({
              model: getLLMModel(),
              messages: [
                { role: "system", content: system },
                { role: "user", content: buildShortenPrompt(tweets) },
              ],
              temperature: 0.7,
              max_completion_tokens: 2000,
            }),
          `engine:${recipe.id}:shorten`,
        );
        const retryContent = retryCompletion.choices[0]?.message?.content ?? "";
        const retryTweets = parseTweets(retryContent);
        if (retryTweets.length > 0) {
          rawContent = retryContent;
        }
      } catch {
        console.log("  Could not shorten tweets, using original");
      }
    }
  }

  console.log(`  LLM response: ${rawContent.length} chars`);

  // 4. Run format adapters
  const formatted: Partial<Record<FormatType, FormattedOutput>> = {};
  for (const fmt of activeFormats) {
    formatted[fmt] = runFormat(fmt, rawContent, params, recipe.id);
  }

  const piece: ContentPiece = {
    recipeId: recipe.id,
    params,
    generatedAt: new Date().toISOString(),
    rawContent,
    formatted,
  };

  return piece;
}

// ─── Output Writing ─────────────────────────────────────────────

function writeOutput(piece: ContentPiece): string[] {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputFiles: string[] = [];
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const state = (piece.params.state ?? "national").toLowerCase().replace(/\s+/g, "-");

  // Write twitter thread as markdown
  const twitterOutput = piece.formatted["twitter-thread"];
  if (twitterOutput && Array.isArray(twitterOutput.content) && twitterOutput.content.length > 0) {
    const md = buildThreadMarkdown(
      twitterOutput.content,
      piece.params,
      piece.recipeId,
    );
    const fileName = `${piece.recipeId}-${state}-${piece.params.year ?? "latest"}-${ts}.md`;
    writeFileSync(join(OUTPUT_DIR, fileName), md);
    outputFiles.push(fileName);
    console.log(`  Saved thread: ${fileName}`);
  }

  // Write instagram carousel JSON
  const instaOutput = piece.formatted["instagram-carousel"];
  if (instaOutput && typeof instaOutput.content === "string") {
    const fileName = `${piece.recipeId}-${state}-instagram-${ts}.json`;
    writeFileSync(join(OUTPUT_DIR, fileName), instaOutput.content);
    outputFiles.push(fileName);
    console.log(`  Saved carousel: ${fileName}`);
  }

  // Write video script JSON
  const videoOutput = piece.formatted["video-script"];
  if (videoOutput && typeof videoOutput.content === "string") {
    const fileName = `${piece.recipeId}-${state}-video-${ts}.json`;
    writeFileSync(join(OUTPUT_DIR, fileName), videoOutput.content);
    outputFiles.push(fileName);
    console.log(`  Saved video script: ${fileName}`);
  }

  // Write WhatsApp message
  const waOutput = piece.formatted["whatsapp"];
  if (waOutput && typeof waOutput.content === "string") {
    const fileName = `${piece.recipeId}-${state}-whatsapp-${ts}.txt`;
    writeFileSync(join(OUTPUT_DIR, fileName), waOutput.content);
    outputFiles.push(fileName);
    console.log(`  Saved WhatsApp: ${fileName}`);
  }

  // Write raw LLM output
  const rawFileName = `${piece.recipeId}-${state}-raw-${ts}.txt`;
  writeFileSync(join(OUTPUT_DIR, rawFileName), piece.rawContent);
  outputFiles.push(rawFileName);

  return outputFiles;
}

// ─── Main CLI ───────────────────────────────────────────────────

async function main() {
  if (hasFlag("list")) {
    console.log("Available recipes:\n");
    for (const recipe of listRecipes()) {
      console.log(`  ${recipe.id}`);
      console.log(`    ${recipe.description}`);
      console.log(`    Required: ${recipe.requiredParams.join(", ")}`);
      console.log(`    Optional: ${recipe.optionalParams.join(", ") || "none"}`);
      console.log(`    Formats: ${recipe.formats.join(", ")}`);
      console.log();
    }
    return;
  }

  const recipeId = getArg("recipe");
  const recipe = getRecipe(recipeId);
  if (!recipe) {
    console.error(
      `Unknown recipe: "${recipeId}". Available: ${Object.keys(RECIPES).join(", ")}`,
    );
    process.exit(1);
  }

  const params: RecipeParams = {
    state: args.includes("--state") ? getArg("state") : undefined,
    state2: args.includes("--state2") ? getArg("state2") : undefined,
    year: args.includes("--year") ? parseInt(getArg("year"), 10) : undefined,
    official: args.includes("--official") ? getArg("official") : undefined,
    sector: args.includes("--sector") ? getArg("sector") : undefined,
    metric: args.includes("--metric") ? getArg("metric") : undefined,
  };

  const formatArg = args.includes("--formats") ? getArg("formats") : undefined;
  const formats = formatArg
    ? (formatArg.split(",") as FormatType[])
    : undefined;

  const pool = createPool();

  try {
    await pool.query("SELECT 1");
    console.log("Database connected.");

    const piece = await executeRecipe(recipe, params, pool, formats);
    const outputFiles = writeOutput(piece);

    // Update content index
    const index = loadIndex();
    addEntry(index, {
      recipeId: piece.recipeId,
      params: piece.params,
      generatedAt: piece.generatedAt,
      outputFiles,
      status: "draft",
    });

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("GENERATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Recipe: ${recipe.name}`);
    console.log(`Files: ${outputFiles.length}`);

    for (const [fmt, output] of Object.entries(piece.formatted)) {
      if (output?.warnings?.length) {
        console.log(`\nWarnings (${fmt}):`);
        for (const w of output.warnings) {
          console.log(`  - ${w}`);
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${msg}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Only run main if this is the entry point
if (process.argv[1]?.endsWith("engine.ts")) {
  main().catch((err) => {
    console.error("Fatal error:", err.message ?? err);
    process.exit(1);
  });
}
