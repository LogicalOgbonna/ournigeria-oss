#!/usr/bin/env npx tsx
/**
 * Evaluation runner for Aje RAG pipelines.
 *
 * Usage:
 *   npx tsx packages/evaluation/run-eval.ts --api-url http://localhost:3001 --user-id <UUID>
 *   npx tsx packages/evaluation/run-eval.ts --api-url http://your-server:3000 --user-id <UUID> --file corruption.json
 *   npx tsx packages/evaluation/run-eval.ts --api-url http://your-server:3000 --user-id <UUID> --concurrency 3
 *
 * Options:
 *   --api-url     Base URL of the API (e.g., http://localhost:3001)
 *   --user-id     A valid user ID from the database (used as nb_uid cookie)
 *   --file        Run only a specific eval file (e.g., corruption.json). Omit to run all.
 *   --concurrency Number of parallel requests (default: 1, sequential)
 *   --timeout     Timeout per question in ms (default: 120000 = 2 min)
 *   --output-dir  Directory to write results (default: packages/evaluation/results)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

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
const SINGLE_FILE = args.includes("--file") ? getArg("file") : null;
const CONCURRENCY = parseInt(getArg("concurrency", "1"), 10);
const TIMEOUT = parseInt(getArg("timeout", "120000"), 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EVAL_DIR = __dirname;
const OUTPUT_DIR = getArg("output-dir", join(EVAL_DIR, "results"));

// ─── Types ───────────────────────────────────────────────────────

interface EvalQuestion {
  id: string;
  category: string;
  question: string;
  follow_ups?: string[];
  intent?: string;
  expected_intent?: string;
  difficulty: string;
  why_it_breaks: string;
  expected_behavior: string;
  expected_answer?: string;
  metadata_filters_needed?: string[];
  officials_involved?: string;
  expected_tools?: string[];
  expected_entities?: Record<string, unknown>;
  // Added by runner:
  answer?: string;
  resolved_intent?: string;
  tools_called?: string[];
  sources_count?: number;
  sources_data?: SourceData[];
  citation_alignment_score?: number;
  response_time_ms?: number;
  pass?: boolean;
  evaluation_notes?: string;
  tool_metrics?: ToolMetrics;
}

interface ToolMetrics {
  tools_called: string[];
  tool_call_count: number;
  expected_tools_hit: number;
  expected_tools_total: number;
  tool_efficiency_score: number;
}

interface EvalFile {
  name: string;
  description: string;
  questions: EvalQuestion[];
}

interface EvalSummary {
  file: string;
  total: number;
  passed: number;
  failed: number;
  errors: number;
  pass_rate: string;
  avg_response_time_ms: number;
  avg_tool_calls: number;
  avg_tool_efficiency: number;
  by_difficulty: Record<string, { total: number; passed: number }>;
  by_category: Record<string, { total: number; passed: number }>;
}

interface SourceData {
  title: string;
  fileName: string;
  sourceType: string;
  state?: string;
  year?: number;
  score: number;
  snippet?: string;
}

// Nigerian states for citation alignment checking
const NIGERIAN_STATES = [
  "abia", "adamawa", "akwa ibom", "anambra", "bauchi", "bayelsa", "benue",
  "borno", "cross river", "delta", "ebonyi", "edo", "ekiti", "enugu", "gombe",
  "imo", "jigawa", "kaduna", "kano", "katsina", "kebbi", "kogi", "kwara",
  "lagos", "nasarawa", "niger", "ogun", "ondo", "osun", "oyo", "plateau",
  "rivers", "sokoto", "taraba", "yobe", "zamfara", "fct", "federal",
];

/**
 * Check citation-to-source alignment: for each [N] in the text,
 * extract the nearest state name and verify it matches sources[N-1].state.
 * Returns alignment score (0-1) and descriptive notes.
 */
function checkCitationAlignment(
  text: string,
  sources: SourceData[],
): { score: number; total: number; matched: number; notes: string } {
  if (sources.length === 0) return { score: 1, total: 0, matched: 0, notes: "" };

  const citationRegex = /\[(\d+)\]/g;
  const seen = new Set<number>();
  let total = 0;
  let matched = 0;
  const mismatches: string[] = [];

  const sorted = [...NIGERIAN_STATES].sort((a, b) => b.length - a.length);

  let match: RegExpExecArray | null;
  while ((match = citationRegex.exec(text)) !== null) {
    const num = parseInt(match[1]);
    if (num < 1 || num > sources.length || seen.has(num)) continue;
    seen.add(num);
    total++;

    const source = sources[num - 1];
    if (!source?.state) continue;

    // Extract state from 150 chars before citation
    const contextStart = Math.max(0, match.index - 150);
    const context = text.slice(contextStart, match.index).toLowerCase();

    // Find nearest state name
    let bestState: string | null = null;
    let bestPos = -1;
    for (const state of sorted) {
      const pos = context.lastIndexOf(state);
      if (pos !== -1 && pos > bestPos) {
        bestPos = pos;
        bestState = state;
      }
    }

    if (bestState && bestState === source.state.toLowerCase()) {
      matched++;
    } else if (bestState) {
      mismatches.push(`[${num}] text="${bestState}" src="${source.state}"`);
    }
  }

  const score = total > 0 ? matched / total : 1;
  let notes = `Citation alignment: ${matched}/${total} matched.`;
  if (mismatches.length > 0) {
    notes += ` Mismatches: ${mismatches.join(", ")}`;
  }
  return { score, total, matched, notes };
}

// ─── SSE Parser ──────────────────────────────────────────────────

async function askQuestion(
  question: string,
  tool?: string,
): Promise<{ text: string; resolvedTool: string; toolsCalled: string[]; sourcesCount: number; sources: SourceData[]; timeMs: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const body: Record<string, string> = { message: question };
    if (tool) body.tool = tool;

    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `nb_uid=${USER_ID}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    // Parse SSE stream
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";
    let resolvedTool = "unknown";
    let toolsCalled: string[] = [];
    let sourcesCount = 0;
    let sources: SourceData[] = [];
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "text" && event.content) {
            fullText += event.content;
          }
          if (event.type === "done" && event.richContent) {
            if (event.richContent.text) {
              // Use the full text from richContent if available
              fullText = event.richContent.text;
            }
            resolvedTool = event.resolvedTool ?? resolvedTool;
            if (Array.isArray(event.toolsCalled)) {
              toolsCalled = event.toolsCalled;
            }
            if (Array.isArray(event.richContent?.sources)) {
              sourcesCount = event.richContent.sources.length;
              sources = event.richContent.sources;
            }
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    return { text: fullText, resolvedTool, toolsCalled, sourcesCount, sources, timeMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Tool Metrics ────────────────────────────────────────────────

function computeToolMetrics(q: EvalQuestion): ToolMetrics {
  const toolsCalled = q.tools_called ?? [];
  const expectedTools = q.expected_tools ?? [];

  let expectedHit = 0;
  if (expectedTools.length > 0) {
    expectedHit = expectedTools.filter((t) => toolsCalled.includes(t)).length;
  }

  // Efficiency: ratio of expected tools hit vs total tools called.
  // If no expected tools defined, efficiency = 1.0 (no penalty).
  // If agent called exactly the right tools, efficiency = 1.0.
  // Penalty for missing expected tools or calling unnecessary tools.
  let efficiency = 1.0;
  if (expectedTools.length > 0) {
    const coverage = expectedTools.length > 0 ? expectedHit / expectedTools.length : 1;
    const waste = toolsCalled.length > 0
      ? Math.max(0, toolsCalled.length - expectedTools.length) / toolsCalled.length
      : 0;
    efficiency = Math.max(0, coverage - waste * 0.5);
  }

  return {
    tools_called: toolsCalled,
    tool_call_count: toolsCalled.length,
    expected_tools_hit: expectedHit,
    expected_tools_total: expectedTools.length,
    tool_efficiency_score: Math.round(efficiency * 100) / 100,
  };
}

// ─── Evaluator ───────────────────────────────────────────────────

function evaluateAnswer(q: EvalQuestion): { pass: boolean; notes: string } {
  const answer = (q.answer ?? "").toLowerCase();

  // No answer = fail
  if (!answer || answer.length < 10) {
    return { pass: false, notes: "Empty or extremely short answer." };
  }

  const notes: string[] = [];
  let score = 0;
  let checks = 0;

  // Check 1: Did it say "no data found" when it shouldn't have?
  const noDataPhrases = [
    "i don't have",
    "no data",
    "no relevant",
    "don't have.*data",
    "no.*case data",
    "no.*matches",
    "couldn't find",
    "no information",
    "no records found",
    "no payment.*found",
    "no.*allocation.*found",
    "no.*budget.*found",
  ];
  const saidNoData = noDataPhrases.some((phrase) =>
    new RegExp(phrase, "i").test(answer),
  );

  // For aggregation/listing questions, saying "no data" is always a fail
  const isAggregation = [
    "list",
    "how many",
    "which",
    "rank",
    "top",
    "compare",
    "all",
  ].some((kw) => q.question.toLowerCase().includes(kw));

  if (saidNoData && isAggregation) {
    notes.push("FAIL: Said 'no data' for an aggregation query.");
    return { pass: false, notes: notes.join(" ") };
  }

  // Check 2: For corruption queries, did it mention specific officials?
  if (q.intent === "corruption" || q.expected_intent === "corruption") {
    const officialNames = [
      "ibori",
      "diezani",
      "dariye",
      "nyame",
      "fayose",
      "kalu",
      "dasuki",
      "bello",
      "abacha",
      "okorocha",
      "saraki",
      "lamido",
    ];
    const mentionedOfficials = officialNames.filter((name) =>
      answer.includes(name),
    );
    checks++;
    if (
      q.officials_involved === "all" &&
      mentionedOfficials.length >= 3
    ) {
      score++;
      notes.push(`Mentioned ${mentionedOfficials.length} officials.`);
    } else if (q.officials_involved !== "all" && mentionedOfficials.length >= 1) {
      score++;
    } else if (q.officials_involved === "all" && mentionedOfficials.length < 3) {
      notes.push(
        `Only mentioned ${mentionedOfficials.length} officials (expected 3+).`,
      );
    }
  }

  // Check 3: For budget queries, did it mention Naira amounts?
  if (q.intent === "budget") {
    checks++;
    if (/[₦N]\s*[\d,.]+|naira|billion|million|trillion/i.test(answer)) {
      score++;
    } else {
      notes.push("No monetary amounts found in budget answer.");
    }
  }

  // Check 4: For FAAC queries, did it mention allocation components?
  if (q.intent === "faac") {
    checks++;
    const components = [
      "statutory",
      "vat",
      "derivation",
      "exchange",
      "allocation",
      "disbursement",
    ];
    const mentioned = components.filter((c) => answer.includes(c));
    if (mentioned.length >= 1) {
      score++;
    } else {
      notes.push("No FAAC components mentioned.");
    }
  }

  // Check 5: For govspend queries, did it mention payments/amounts?
  if (q.intent === "govspend") {
    checks++;
    if (/payment|paid|₦|naira|amount|disburs/i.test(answer)) {
      score++;
    } else {
      notes.push("No payment information in govspend answer.");
    }
  }

  // Check 6: Answer length — very short answers for complex questions are suspicious
  checks++;
  if (q.difficulty === "very_hard" && answer.length < 200) {
    notes.push("Answer too short for a very_hard question.");
  } else if (q.difficulty === "hard" && answer.length < 100) {
    notes.push("Answer too short for a hard question.");
  } else {
    score++;
  }

  // Check 7: For routing tests, check if correct intent was resolved
  if (q.expected_intent && q.resolved_intent) {
    checks++;
    if (q.resolved_intent === q.expected_intent) {
      score++;
      notes.push(`Correct intent: ${q.resolved_intent}`);
    } else {
      notes.push(
        `Wrong intent: got '${q.resolved_intent}', expected '${q.expected_intent}'.`,
      );
    }
  }

  // Check 8: Did the answer reference correct data context?
  if (!saidNoData && answer.length > 50) {
    checks++;
    score++; // At least it tried to answer with some content
  }

  // Check 9: Compare with expected_answer keywords if available
  if (q.expected_answer) {
    checks++;
    // Extract key terms from expected answer (words 5+ chars)
    const expectedTerms = q.expected_answer
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !/should|would|could|must|that|with|from|their|about|which|these|those|response|answer|include|mention|present|provide|return/i.test(w));
    const uniqueTerms = [...new Set(expectedTerms)];
    const matchedTerms = uniqueTerms.filter((term) => answer.includes(term));
    const matchRatio =
      uniqueTerms.length > 0 ? matchedTerms.length / uniqueTerms.length : 0;
    if (matchRatio >= 0.2) {
      score++;
      notes.push(
        `Matched ${matchedTerms.length}/${uniqueTerms.length} expected terms.`,
      );
    } else {
      notes.push(
        `Low term match: ${matchedTerms.length}/${uniqueTerms.length} expected terms.`,
      );
    }
  }

  // Check 10: Tool usage — did the agent call expected tools?
  if (q.expected_tools && q.expected_tools.length > 0 && q.tools_called) {
    checks++;
    const metrics = computeToolMetrics(q);
    if (metrics.expected_tools_hit === metrics.expected_tools_total) {
      score++;
      notes.push(`All expected tools called (${metrics.tools_called.join(", ")}).`);
    } else {
      notes.push(
        `Missing tools: called [${metrics.tools_called.join(", ")}], expected [${q.expected_tools.join(", ")}] (${metrics.expected_tools_hit}/${metrics.expected_tools_total} hit).`,
      );
    }
  }

  // Check 11: Citation quality — are [N] markers present and valid?
  const sourcesCount = q.sources_count ?? 0;
  if (sourcesCount > 0) {
    checks++;
    const citationMatches = (q.answer ?? "").match(/\[(\d+)\]/g) || [];
    const citationCount = citationMatches.length;
    const citationNumbers = citationMatches.map((m) => parseInt(m.slice(1, -1)));
    const orphans = citationNumbers.filter((n) => n < 1 || n > sourcesCount);

    if (citationCount > 0 && orphans.length === 0) {
      score++;
      notes.push(`Citations: ${citationCount} valid inline citations.`);
    } else if (citationCount > 0) {
      // Partial credit — has citations but some are orphaned
      score += 0.5;
      notes.push(
        `Citations: ${citationCount} inline (${orphans.length} orphaned, sources=${sourcesCount}).`,
      );
    } else {
      notes.push(`No inline citations found (${sourcesCount} sources available).`);
    }
  }

  // Check 12: Citation alignment — does [N] point to the correct source?
  if (sourcesCount > 0 && q.sources_data && q.sources_data.length > 0) {
    const citationMatches2 = (q.answer ?? "").match(/\[(\d+)\]/g) || [];
    if (citationMatches2.length > 0) {
      checks++;
      const alignment = checkCitationAlignment(q.answer ?? "", q.sources_data);
      q.citation_alignment_score = Math.round(alignment.score * 100) / 100;
      if (alignment.score >= 0.8) {
        score++;
        notes.push(alignment.notes);
      } else if (alignment.score > 0) {
        score += 0.5;
        notes.push(alignment.notes);
      } else {
        notes.push(alignment.notes);
      }
    }
  }

  const passThreshold = checks > 0 ? score / checks : 0;
  const pass = passThreshold >= 0.5;

  if (notes.length === 0) {
    notes.push(pass ? "Answer appears adequate." : "Answer did not meet criteria.");
  }

  return { pass, notes: notes.join(" ") };
}

// ─── Runner ──────────────────────────────────────────────────────

async function runEvalFile(filePath: string): Promise<EvalSummary> {
  const raw = readFileSync(filePath, "utf-8");
  const evalFile: EvalFile = JSON.parse(raw);
  const fileName = basename(filePath);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${evalFile.name} (${evalFile.questions.length} questions)`);
  console.log(`${"=".repeat(60)}\n`);

  const results: EvalQuestion[] = [];
  let passed = 0;
  let failed = 0;
  let errors = 0;
  let totalTime = 0;
  const byDifficulty: Record<string, { total: number; passed: number }> = {};
  const byCategory: Record<string, { total: number; passed: number }> = {};

  // Process questions with concurrency control
  const questions = [...evalFile.questions];

  async function processQuestion(q: EvalQuestion): Promise<EvalQuestion> {
    const qNum = `[${q.id}]`;
    const shortQ =
      q.question.length > 60 ? q.question.slice(0, 60) + "..." : q.question;
    console.log(`  ${qNum} Asking: "${shortQ}"`);

    try {
      const { text, resolvedTool, toolsCalled, sourcesCount, sources, timeMs } = await askQuestion(q.question);
      q.answer = text;
      q.resolved_intent = resolvedTool;
      q.tools_called = toolsCalled;
      q.sources_count = sourcesCount;
      q.sources_data = sources;
      q.response_time_ms = timeMs;
      q.tool_metrics = computeToolMetrics(q);

      const { pass, notes } = evaluateAnswer(q);
      q.pass = pass;
      q.evaluation_notes = notes;

      const status = pass ? "PASS" : "FAIL";
      const icon = pass ? "✓" : "✗";
      console.log(
        `  ${qNum} ${icon} ${status} (${(timeMs / 1000).toFixed(1)}s) — ${notes.slice(0, 80)}`,
      );
    } catch (err: any) {
      q.answer = `ERROR: ${err.message}`;
      q.pass = false;
      q.evaluation_notes = `Error: ${err.message}`;
      console.log(`  ${qNum} ✗ ERROR — ${err.message}`);
      errors++;
    }

    return q;
  }

  // Run with concurrency limit
  for (let i = 0; i < questions.length; i += CONCURRENCY) {
    const batch = questions.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(processQuestion));

    for (const q of batchResults) {
      results.push(q);

      if (q.answer?.startsWith("ERROR:")) {
        // Already counted in errors
      } else if (q.pass) {
        passed++;
      } else {
        failed++;
      }

      totalTime += q.response_time_ms ?? 0;

      // Track by difficulty
      const diff = q.difficulty;
      if (!byDifficulty[diff]) byDifficulty[diff] = { total: 0, passed: 0 };
      byDifficulty[diff].total++;
      if (q.pass) byDifficulty[diff].passed++;

      // Track by category
      const cat = q.category;
      if (!byCategory[cat]) byCategory[cat] = { total: 0, passed: 0 };
      byCategory[cat].total++;
      if (q.pass) byCategory[cat].passed++;
    }
  }

  // Write results
  const outputFile = join(OUTPUT_DIR, fileName);
  evalFile.questions = results;
  writeFileSync(outputFile, JSON.stringify(evalFile, null, 2) + "\n");
  console.log(`\n  Results written to: ${outputFile}`);

  const total = results.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";
  const avgTime = total > 0 ? Math.round(totalTime / total) : 0;

  // Compute aggregate tool metrics
  const toolMetrics = results
    .filter((q) => q.tool_metrics)
    .map((q) => q.tool_metrics!);
  const avgToolCalls = toolMetrics.length > 0
    ? Math.round((toolMetrics.reduce((s, m) => s + m.tool_call_count, 0) / toolMetrics.length) * 10) / 10
    : 0;
  const metricsWithExpected = toolMetrics.filter((m) => m.expected_tools_total > 0);
  const avgToolEfficiency = metricsWithExpected.length > 0
    ? Math.round((metricsWithExpected.reduce((s, m) => s + m.tool_efficiency_score, 0) / metricsWithExpected.length) * 100) / 100
    : 1.0;

  const summary: EvalSummary = {
    file: fileName,
    total,
    passed,
    failed,
    errors,
    pass_rate: `${passRate}%`,
    avg_response_time_ms: avgTime,
    avg_tool_calls: avgToolCalls,
    avg_tool_efficiency: avgToolEfficiency,
    by_difficulty: byDifficulty,
    by_category: byCategory,
  };

  // Print summary
  console.log(`\n  Summary: ${passed}/${total} passed (${passRate}%)`);
  console.log(`  Failed: ${failed}, Errors: ${errors}`);
  console.log(`  Avg response time: ${(avgTime / 1000).toFixed(1)}s`);
  console.log(`  Avg tool calls: ${avgToolCalls}, Avg tool efficiency: ${avgToolEfficiency}`);

  return summary;
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("Aje Evaluation Runner");
  console.log(`API: ${API_URL}`);
  console.log(`User: ${USER_ID}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Timeout: ${TIMEOUT}ms`);

  // Verify API is reachable
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
    console.log("API health check: OK\n");
  } catch (err: any) {
    console.error(`Cannot reach API at ${API_URL}: ${err.message}`);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Find eval files
  let evalFiles: string[];
  if (SINGLE_FILE) {
    evalFiles = [join(EVAL_DIR, SINGLE_FILE)];
  } else {
    evalFiles = readdirSync(EVAL_DIR)
      .filter((f) => f.endsWith(".json") && f !== "package.json")
      .map((f) => join(EVAL_DIR, f));
  }

  const allSummaries: EvalSummary[] = [];

  for (const file of evalFiles) {
    try {
      const summary = await runEvalFile(file);
      allSummaries.push(summary);
    } catch (err: any) {
      console.error(`\nFailed to run ${file}: ${err.message}`);
    }
  }

  // Write combined summary
  const summaryFile = join(OUTPUT_DIR, "_summary.json");
  const totalQuestions = allSummaries.reduce((s, r) => s + r.total, 0);
  const totalPassed = allSummaries.reduce((s, r) => s + r.passed, 0);
  const totalFailed = allSummaries.reduce((s, r) => s + r.failed, 0);
  const totalErrors = allSummaries.reduce((s, r) => s + r.errors, 0);

  const combinedSummary = {
    run_date: new Date().toISOString(),
    api_url: API_URL,
    total_questions: totalQuestions,
    total_passed: totalPassed,
    total_failed: totalFailed,
    total_errors: totalErrors,
    overall_pass_rate: `${totalQuestions > 0 ? ((totalPassed / totalQuestions) * 100).toFixed(1) : "0.0"}%`,
    files: allSummaries,
  };

  writeFileSync(summaryFile, JSON.stringify(combinedSummary, null, 2) + "\n");

  // Print final report
  console.log(`\n${"=".repeat(60)}`);
  console.log("FINAL REPORT");
  console.log(`${"=".repeat(60)}`);
  console.log(`Total: ${totalQuestions} questions`);
  console.log(`Passed: ${totalPassed} (${combinedSummary.overall_pass_rate})`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`\nPer file:`);
  for (const s of allSummaries) {
    console.log(`  ${s.file.padEnd(20)} ${s.passed}/${s.total} (${s.pass_rate})`);
  }
  console.log(`\nFull results: ${OUTPUT_DIR}`);
  console.log(`Summary: ${summaryFile}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
