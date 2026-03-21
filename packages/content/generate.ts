#!/usr/bin/env npx tsx
/**
 * OurNigeria Content Generator — Twitter Thread Generator
 *
 * Generates emotionally resonant Pidgin English Twitter threads from
 * OurNigeria's budget/corruption/FAAC/govspend data.
 *
 * Two-step process:
 *   1. Query the live API for analytical data via SSE
 *   2. Direct LLM call to transform into Pidgin storytelling threads
 *
 * Usage:
 *   npx tsx packages/content/generate.ts --api-url https://spending-api.arinze.online --user-id <UUID>
 *   npx tsx packages/content/generate.ts --api-url https://spending-api.arinze.online --user-id <UUID> --type budget
 *   npx tsx packages/content/generate.ts --api-url https://spending-api.arinze.online --user-id <UUID> --concurrency 2 --delay 3000
 *
 * Options:
 *   --api-url     Base URL of the API (e.g., https://spending-api.arinze.online)
 *   --user-id     A valid user ID from the database (used as nb_uid cookie)
 *   --type        Content type filter: budget|corruption|comparison|faac|all (default: all)
 *   --concurrency Number of parallel API requests (default: 1)
 *   --timeout     Timeout per API question in ms (default: 120000 = 2 min)
 *   --delay       Delay between questions in ms (default: 2000)
 *   --output-dir  Directory to write results (default: packages/content/output)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

import {
  buildBudgetExposePrompt,
  type BudgetExposeMeta,
} from "./prompts/budget-expose.js";
import {
  buildCorruptionSpotlightPrompt,
  type CorruptionSpotlightMeta,
} from "./prompts/corruption-spotlight.js";
import {
  buildStateComparisonPrompt,
  type StateComparisonMeta,
} from "./prompts/state-comparison.js";
import {
  buildFaacAllocationPrompt,
  type FaacAllocationMeta,
} from "./prompts/faac-allocation.js";

// ─── CLI args ────────────────────────────────────────────────────

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

const API_URL = getArg("api-url");
const USER_ID = getArg("user-id");
const CONTENT_TYPE = getArg("type", "all");
const CONCURRENCY = parseInt(getArg("concurrency", "1"), 10);
const TIMEOUT = parseInt(getArg("timeout", "120000"), 10);
const DELAY = parseInt(getArg("delay", "2000"), 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = getArg("output-dir", join(__dirname, "output"));

// ─── Types ───────────────────────────────────────────────────────

interface SeedQuestion {
  id: string;
  type: string;
  question: string;
  state?: string;
  year?: number;
  tags?: string[];
  official?: string;
  stateA?: string;
  stateB?: string;
  metric?: string;
}

interface SeedFile {
  name: string;
  description: string;
  questions: SeedQuestion[];
}

interface GenerationResult {
  question: SeedQuestion;
  rawResponse: string;
  thread: string | null;
  tweets: string[];
  outputFile: string | null;
  error: string | null;
  apiTimeMs: number;
  llmTimeMs: number;
  oversizedTweets: number;
}

// ─── Content type → file mapping ─────────────────────────────────

const TYPE_TO_FILE: Record<string, string> = {
  budget: "budget.json",
  corruption: "corruption.json",
  comparison: "state-comparison.json",
  faac: "faac.json",
};

// ─── LLM Client ──────────────────────────────────────────────────

function createLLMClient(): OpenAI {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL;

  if (!apiKey) {
    console.error(
      "Missing LLM_API_KEY environment variable. Run with infisical or set it manually.",
    );
    process.exit(1);
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });
}

// ─── Retry helper ────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3,
): Promise<T> {
  const backoffMs = [2000, 4000, 8000];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status =
        err instanceof OpenAI.APIError ? err.status : undefined;
      const isRetryable = status === 429 || status === 500 || status === 503;

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      const delay = backoffMs[attempt - 1] ?? 8000;
      console.log(
        `  ⚠ ${label}: ${status} error, retrying in ${delay / 1000}s (attempt ${attempt}/${maxAttempts})`,
      );
      await sleep(delay);
    }
  }
  throw new Error(`${label}: exhausted retries`);
}

// ─── SSE Client (adapted from packages/evaluation/run-eval.ts) ──

async function askQuestion(
  question: string,
): Promise<{ text: string; timeMs: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `nb_uid=${USER_ID}`,
      },
      body: JSON.stringify({ message: question }),
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      console.error(
        `Authentication failed (HTTP ${res.status}) — check your --user-id value.`,
      );
      process.exit(1);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "text" && event.content) {
            fullText += event.content;
          }
          if (event.type === "done" && event.richContent?.text) {
            fullText = event.richContent.text;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    return { text: fullText, timeMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

// ─── LLM Transform ──────────────────────────────────────────────

function getPrompt(
  rawResponse: string,
  question: SeedQuestion,
): { system: string; user: string } {
  switch (question.type) {
    case "budget_expose":
      return buildBudgetExposePrompt(rawResponse, {
        state: question.state,
        year: question.year,
        tags: question.tags,
      } as BudgetExposeMeta);

    case "corruption_spotlight":
      return buildCorruptionSpotlightPrompt(rawResponse, {
        official: question.official,
        state: question.state,
        tags: question.tags,
      } as CorruptionSpotlightMeta);

    case "state_comparison":
      return buildStateComparisonPrompt(rawResponse, {
        stateA: question.stateA,
        stateB: question.stateB,
        metric: question.metric,
        year: question.year,
        tags: question.tags,
      } as StateComparisonMeta);

    case "faac_allocation":
      return buildFaacAllocationPrompt(rawResponse, {
        state: question.state,
        year: question.year,
        tags: question.tags,
      } as FaacAllocationMeta);

    default:
      return buildBudgetExposePrompt(rawResponse, {
        state: question.state,
        year: question.year,
      });
  }
}

function parseTweets(llmOutput: string): string[] {
  const lines = llmOutput.split("\n");
  const tweets: string[] = [];
  let currentTweet = "";

  for (const line of lines) {
    const tweetMatch = line.match(/^Tweet\s*\d+:\s*(.*)/i);
    if (tweetMatch) {
      if (currentTweet.trim()) {
        tweets.push(currentTweet.trim());
      }
      currentTweet = tweetMatch[1];
    } else if (currentTweet && line.trim()) {
      currentTweet += " " + line.trim();
    }
  }
  if (currentTweet.trim()) {
    tweets.push(currentTweet.trim());
  }

  return tweets;
}

async function transformToThread(
  llmClient: OpenAI,
  rawResponse: string,
  question: SeedQuestion,
): Promise<{ tweets: string[]; raw: string }> {
  const model = process.env.LLM_MODEL ?? "gpt-4o";
  const { system, user } = getPrompt(rawResponse, question);

  const completion = await withRetry(
    () =>
      llmClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        max_completion_tokens: 2000,
      }),
    `LLM transform [${question.id}]`,
  );

  const raw = completion.choices[0]?.message?.content ?? "";
  let tweets = parseTweets(raw);

  // Check for oversized tweets and retry once
  const oversized = tweets.filter((t) => t.length > 280);
  if (oversized.length > 0 && tweets.length > 0) {
    const retryPrompt = `Some tweets are over 280 characters. Please shorten ONLY the oversized ones while keeping the Pidgin tone and ₦ amounts. Return the FULL thread with all tweets.

Current thread:
${tweets.map((t, i) => `Tweet ${i + 1}: ${t}`).join("\n")}

Oversized tweets (indices): ${tweets.map((t, i) => (t.length > 280 ? i + 1 : null)).filter(Boolean).join(", ")}`;

    try {
      const retry = await withRetry(
        () =>
          llmClient.chat.completions.create({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: retryPrompt },
            ],
            temperature: 0.7,
            max_completion_tokens: 2000,
          }),
        `LLM shorten [${question.id}]`,
      );

      const retryRaw = retry.choices[0]?.message?.content ?? "";
      const retryTweets = parseTweets(retryRaw);
      if (retryTweets.length > 0) {
        tweets = retryTweets;
      }
    } catch (err) {
      console.log(
        `  ⚠ [${question.id}] Failed to shorten oversized tweets, using original`,
      );
    }
  }

  return { tweets, raw };
}

// ─── Markdown Output ─────────────────────────────────────────────

function buildMarkdown(
  question: SeedQuestion,
  tweets: string[],
  oversizedCount: number,
): string {
  const now = new Date().toISOString();
  const state =
    question.state ?? question.stateA ?? "national";
  const year = question.year ?? "";
  const title = buildTitle(question);

  let frontmatter = `---
type: ${question.type}
state: ${state}
year: ${year}
generated: ${now}
question: "${question.question.replace(/"/g, '\\"')}"
status: draft`;

  if (oversizedCount > 0) {
    frontmatter += `\nwarning: "${oversizedCount} tweet(s) exceed 280 characters — review before posting"`;
  }

  frontmatter += "\n---";

  const tweetBlocks = tweets
    .map(
      (tweet, i) =>
        `### Tweet ${i + 1}\n${tweet}\n`,
    )
    .join("\n");

  return `${frontmatter}

## Thread: ${title}

${tweetBlocks}`;
}

function buildTitle(question: SeedQuestion): string {
  const parts: string[] = [];
  if (question.state) parts.push(question.state);
  if (question.stateA && question.stateB)
    parts.push(`${question.stateA} vs ${question.stateB}`);
  if (question.official) parts.push(question.official);
  if (question.year) parts.push(String(question.year));
  if (question.tags?.[0]) parts.push(question.tags[0]);
  return parts.join(" — ") || question.id;
}

function buildFileName(question: SeedQuestion): string {
  const state = (
    question.state ??
    question.stateA ??
    "national"
  ).toLowerCase().replace(/\s+/g, "-");
  const year = question.year ?? "unknown";
  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  return `${question.type.replace(/_/g, "-")}-${state}-${year}-${ts}.md`;
}

// ─── Sleep helper ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Process a single question ───────────────────────────────────

async function processQuestion(
  question: SeedQuestion,
  llmClient: OpenAI,
): Promise<GenerationResult> {
  const result: GenerationResult = {
    question,
    rawResponse: "",
    thread: null,
    tweets: [],
    outputFile: null,
    error: null,
    apiTimeMs: 0,
    llmTimeMs: 0,
    oversizedTweets: 0,
  };

  const shortQ =
    question.question.length > 55
      ? question.question.slice(0, 55) + "..."
      : question.question;

  // Step 1: Query API
  console.log(`  [${question.id}] 📡 Querying API: "${shortQ}"`);
  try {
    const { text, timeMs } = await askQuestion(question.question);
    result.rawResponse = text;
    result.apiTimeMs = timeMs;

    if (!text || text.length < 50) {
      result.error = "API returned empty or very short response";
      console.log(
        `  [${question.id}] ⚠ Skipping — ${result.error}`,
      );
      return result;
    }

    console.log(
      `  [${question.id}] ✓ API response (${(timeMs / 1000).toFixed(1)}s, ${text.length} chars)`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    result.error = `API error: ${message}`;
    console.log(`  [${question.id}] ✗ ${result.error}`);
    return result;
  }

  // Step 2: LLM Transform
  console.log(`  [${question.id}] 🤖 Transforming to Pidgin thread...`);
  const llmStart = Date.now();
  try {
    const { tweets, raw } = await transformToThread(
      llmClient,
      result.rawResponse,
      question,
    );
    result.llmTimeMs = Date.now() - llmStart;
    result.tweets = tweets;
    result.thread = raw;
    result.oversizedTweets = tweets.filter((t) => t.length > 280).length;

    if (tweets.length === 0) {
      result.error = "LLM returned no parseable tweets";
      console.log(
        `  [${question.id}] ⚠ LLM output could not be parsed into tweets — saving raw`,
      );
    } else {
      console.log(
        `  [${question.id}] ✓ ${tweets.length} tweets generated (${(result.llmTimeMs / 1000).toFixed(1)}s)${result.oversizedTweets > 0 ? ` ⚠ ${result.oversizedTweets} oversized` : ""}`,
      );
    }
  } catch (err: unknown) {
    result.llmTimeMs = Date.now() - llmStart;
    const message = err instanceof Error ? err.message : String(err);
    result.error = `LLM error: ${message}`;
    console.log(
      `  [${question.id}] ⚠ LLM transform failed — saving raw response as fallback`,
    );
  }

  // Step 3: Write output
  try {
    const fileName = buildFileName(question);
    const filePath = join(OUTPUT_DIR, fileName);

    let content: string;
    if (result.tweets.length > 0) {
      content = buildMarkdown(question, result.tweets, result.oversizedTweets);
    } else {
      // Fallback: save raw response
      content = `---
type: ${question.type}
state: ${question.state ?? "unknown"}
year: ${question.year ?? ""}
generated: ${new Date().toISOString()}
question: "${question.question.replace(/"/g, '\\"')}"
status: raw_fallback
warning: "LLM transform failed — raw API response below"
---

## Raw API Response

${result.rawResponse}
`;
    }

    writeFileSync(filePath, content);
    result.outputFile = fileName;
    console.log(`  [${question.id}] 📄 Saved: ${fileName}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      `  [${question.id}] ✗ File write error: ${message}`,
    );
    if (!result.error) result.error = `File write error: ${message}`;
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("OurNigeria Content Generator");
  console.log(`API: ${API_URL}`);
  console.log(`User: ${USER_ID}`);
  console.log(`Type: ${CONTENT_TYPE}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Delay: ${DELAY}ms`);
  console.log(`Timeout: ${TIMEOUT}ms`);
  console.log();

  // Health check
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    if (!healthRes.ok)
      throw new Error(`Health check failed: ${healthRes.status}`);
    console.log("API health check: OK\n");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`API at ${API_URL} is not reachable: ${message}`);
    process.exit(1);
  }

  // Init LLM client
  const llmClient = createLLMClient();

  // Create output dir
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load seed questions
  const questionsDir = join(__dirname, "questions");
  let questionFiles: string[];

  if (CONTENT_TYPE === "all") {
    questionFiles = readdirSync(questionsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(questionsDir, f));
  } else {
    const fileName = TYPE_TO_FILE[CONTENT_TYPE];
    if (!fileName) {
      console.error(
        `Unknown content type: ${CONTENT_TYPE}. Valid: budget, corruption, comparison, faac, all`,
      );
      process.exit(1);
    }
    questionFiles = [join(questionsDir, fileName)];
  }

  const allQuestions: SeedQuestion[] = [];
  for (const file of questionFiles) {
    try {
      const raw = readFileSync(file, "utf-8");
      const seedFile: SeedFile = JSON.parse(raw);
      console.log(
        `Loaded: ${seedFile.name} (${seedFile.questions.length} questions)`,
      );
      allQuestions.push(...seedFile.questions);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to load ${file}: ${message}`);
    }
  }

  if (allQuestions.length === 0) {
    console.error("No questions loaded. Check your --type filter and question files.");
    process.exit(1);
  }

  console.log(`\nTotal questions: ${allQuestions.length}\n`);
  console.log("=".repeat(60));

  // Process questions
  const results: GenerationResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < allQuestions.length; i += CONCURRENCY) {
    const batch = allQuestions.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((q) => processQuestion(q, llmClient)),
    );
    results.push(...batchResults);

    // Delay between batches (not after the last one)
    if (i + CONCURRENCY < allQuestions.length && DELAY > 0) {
      await sleep(DELAY);
    }
  }

  // Summary
  const totalTime = Date.now() - startTime;
  const successful = results.filter(
    (r) => r.tweets.length > 0 && !r.error,
  ).length;
  const fallbacks = results.filter(
    (r) => r.outputFile && r.tweets.length === 0,
  ).length;
  const failed = results.filter((r) => !r.outputFile).length;
  const totalOversized = results.reduce(
    (sum, r) => sum + r.oversizedTweets,
    0,
  );
  const avgApiTime =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.apiTimeMs, 0) /
            results.length,
        )
      : 0;

  console.log(`\n${"=".repeat(60)}`);
  console.log("GENERATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total questions:    ${allQuestions.length}`);
  console.log(`Successful threads: ${successful}`);
  console.log(`Raw fallbacks:      ${fallbacks}`);
  console.log(`Failed:             ${failed}`);
  console.log(`Oversized tweets:   ${totalOversized}`);
  console.log(`Total time:         ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`Avg API time:       ${(avgApiTime / 1000).toFixed(1)}s`);
  console.log(`Output directory:   ${OUTPUT_DIR}`);

  if (failed > 0) {
    console.log(`\nFailed questions:`);
    for (const r of results.filter((r) => !r.outputFile)) {
      console.log(`  ${r.question.id}: ${r.error}`);
    }
  }

  if (totalOversized > 0) {
    console.log(
      `\n⚠ ${totalOversized} tweet(s) exceed 280 chars — review output files marked with "warning" in frontmatter`,
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
