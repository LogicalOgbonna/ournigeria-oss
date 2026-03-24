#!/usr/bin/env npx tsx
/**
 * FAAC Extraction Dry Run
 *
 * Reads a local FAAC PDF, extracts text, runs LLM structured extraction,
 * builds chunks, and prints a quality report — no DB, S3, or vector store needed.
 *
 * Usage:
 *   cd apps/ingest
 *   infisical run --env dev -- npx tsx scripts/faac-dry-run.ts [path-to-pdf] [year] [month]
 *
 * Defaults to: packages/source/faac/2025/January/faac_allocation.pdf
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { PDFParse } from "pdf-parse";
import {
  buildLgaMonthlyChunks,
  buildNationalMonthlyChunk,
  buildStateMonthlyChunks,
  buildZoneMonthlyChunks,
} from "../src/pipeline/faac-chunk-builder";
import {
  normalizeStateName,
  OIL_PRODUCING_STATES,
  resolveLgaState,
  STATE_TO_ZONE,
} from "../src/pipeline/faac-constants";
import {
  type FaacExtraction
} from "../src/pipeline/faac-extractor.service";

/* ────── Config ────── */

const ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_PDF = path.join(
  ROOT,
  "packages/source/faac/2025/January/faac_allocation.pdf",
);

const pdfPath = process.argv[2] || DEFAULT_PDF;
const year = parseInt(process.argv[3] || "2025", 10);
const month = process.argv[4] || "January";

/* ────── Helpers ────── */

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function elapsed(start: number): string {
  const ms = Date.now() - start;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function log(msg: string) {
  console.log(`[faac-dry-run] ${msg}`);
}

/* ────── Step 1: Extract text from PDF ────── */

async function extractPdfText(filePath: string): Promise<string> {
  const start = Date.now();
  log(`Reading PDF: ${filePath}`);

  const data = fs.readFileSync(filePath);
  log(`PDF size: ${(data.length / 1024).toFixed(0)} KB`);

  const pdf = new PDFParse({ data: new Uint8Array(data) });

  // Try digital text first
  try {
    const result = await pdf.getText();
    const text = result.text.trim();
    if (text.length > 100) {
      log(`Digital text extraction: ${text.length} chars (${elapsed(start)})`);
      await pdf.destroy();
      return text;
    }
    log(`Digital text too short (${text.length} chars), falling back to vision OCR`);
  } catch {
    log("Digital text extraction failed, falling back to vision OCR");
  }

  // Vision OCR fallback
  const ocrBaseUrl = process.env.OCR_BASE_URL;
  const ocrApiKey = process.env.OCR_API_KEY;
  const ocrModel = process.env.OCR_MODEL;

  if (!ocrBaseUrl || !ocrApiKey || !ocrModel) {
    await pdf.destroy();
    throw new Error(
      "PDF has no digital text and OCR env vars (OCR_BASE_URL, OCR_API_KEY, OCR_MODEL) are not set",
    );
  }

  const provider = createOpenAI({ baseURL: ocrBaseUrl, apiKey: ocrApiKey });
  const info = await pdf.getInfo();
  const totalPages = info.total;
  log(`Vision OCR: ${totalPages} pages`);

  const pageTexts: string[] = [];
  for (let page = 1; page <= totalPages; page++) {
    const screenshots = await pdf.getScreenshot({
      partial: [page],
      imageDataUrl: true,
      scale: 2,
    });
    if (screenshots.pages.length === 0) continue;

    const pageStart = Date.now();
    const { generateText } = await import("ai");
    const { text } = await generateText({
      model: provider.chat(ocrModel),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract ALL text from this document page exactly as written. Preserve tables, numbers, and formatting." },
            { type: "image", image: screenshots.pages[0].dataUrl },
          ],
        },
      ],
    });

    if (text.trim().length > 0) {
      pageTexts.push(text.trim());
      log(`  Page ${page}/${totalPages}: ${text.trim().length} chars (${elapsed(pageStart)})`);
    }
  }

  await pdf.destroy();
  const fullText = pageTexts.join("\n\n--- Page Break ---\n\n");
  log(`Vision OCR complete: ${fullText.length} chars (${elapsed(start)})`);
  return fullText;
}

/* ────── Step 2: LLM Structured Extraction ────── */

function decrypt(ciphertext: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  const key = crypto.createHash("sha256").update(secret).digest();
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

async function getDbConfig(prefix: "ocr" | "llm"): Promise<{ baseUrl: string; apiKey: string; model: string } | null> {
  try {
    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const res = await client.query(
      `SELECT key, value, encrypted FROM system_settings WHERE key IN ('${prefix}.base_url', '${prefix}.api_key', '${prefix}.model')`,
    );
    await client.end();

    if (res.rows.length >= 2) {
      const get = (k: string) => {
        const row = res.rows.find((r: any) => r.key === k);
        if (!row) return "";
        if (row.encrypted) {
          try { return decrypt(row.value); } catch { return row.value; }
        }
        return row.value;
      };
      const baseUrl = get(`${prefix}.base_url`);
      const apiKey = get(`${prefix}.api_key`);
      const model = get(`${prefix}.model`);
      if (baseUrl && model) {
        log(`${prefix.toUpperCase()} config from DB: ${model} @ ${baseUrl}`);
        return { baseUrl, apiKey: apiKey || "ollama", model };
      }
    }
  } catch (err) {
    log(`DB ${prefix} settings lookup failed: ${err instanceof Error ? err.message : err}`);
  }
  return null;
}

async function getLlmConfig(): Promise<{ baseUrl: string; apiKey: string; model: string }> {
  // Try LLM config first (larger model), then OCR
  const llm = await getDbConfig("llm");
  if (llm) return llm;

  const ocr = await getDbConfig("ocr");
  if (ocr) return ocr;

  // Fall back to env vars
  const baseUrl = process.env.OCR_BASE_URL || process.env.LLM_BASE_URL;
  const apiKey = process.env.OCR_API_KEY || process.env.LLM_API_KEY || "ollama";
  const model = process.env.OCR_MODEL || process.env.LLM_MODEL;
  if (!baseUrl || !model) {
    throw new Error("No LLM/OCR config found in DB or env vars");
  }
  return { baseUrl, apiKey, model };
}

/** Parse JSON from LLM response, stripping markdown fences */
function parseJsonResponse(raw: string): any {
  let s = raw.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  return JSON.parse(s);
}

/** Call local model with a small prompt, return raw text */
async function callLocal(
  model: ReturnType<ReturnType<typeof createOpenAI>["chat"]>,
  prompt: string,
  maxTokens = 4096,
): Promise<string> {
  const res = await generateText({ model, prompt, maxOutputTokens: maxTokens });
  return res.text;
}

/**
 * Multi-pass extraction for local models with limited context.
 * Splits extraction into: national summary, states (in chunks), LGAs (in chunks).
 */
async function runLocalExtraction(
  provider: ReturnType<typeof createOpenAI>,
  modelId: string,
  text: string,
  year: number,
  month: string,
  start: number,
  chunkSize = 4000,
): Promise<FaacExtraction> {
  const model = provider.chat(modelId);
  const CHUNK = chunkSize;

  log(`Deterministic extraction (no LLM needed for structured text)`);

  // --- Pass 1: National summary (deterministic parse from Table I) ---
  log("Pass 1: National summary (deterministic parse)...");

  /** Extract all numbers from a line, handling commas, dashes, and parens */
  function extractNums(line: string): number[] {
    return [...line.matchAll(/[\d,]+\.\d{2}|\d[\d,]*/g)]
      .map((m) => parseFloat(m[0].replace(/,/g, "")))
      .filter((n) => !isNaN(n));
  }

  // Parse dates from the header text
  // Pattern: "Month of {revenue_month}, {revenue_year} Shared in {disbursement_month}, {disbursement_year}"
  const dateMatch = text.match(
    /Month of\s+(\w+),?\s+(\d{4})\s+Shared in\s+(\w+),?\s+(\d{4})/i,
  );
  const summary: any = {
    disbursement_month: dateMatch ? dateMatch[3] : month,
    disbursement_year: dateMatch ? parseInt(dateMatch[4]) : year,
    revenue_month: dateMatch ? dateMatch[1] : "",
    revenue_year: dateMatch ? parseInt(dateMatch[2]) : 0,
    fgn_total: 0, states_total: 0, lgcs_total: 0, derivation_13_pct: 0,
    grand_total: 0, statutory: 0, exchange_gain: 0, emtl: 0, vat: 0,
  };

  const lines = text.split("\n");

  // Parse Table I rows by matching known beneficiary patterns
  for (const line of lines) {
    const nums = extractNums(line);
    if (nums.length < 2) continue;
    const total = nums[nums.length - 1]; // last number is row total
    const lower = line.toLowerCase();

    if (lower.includes("fgn") && lower.includes("table ii")) {
      // "1 FGN (see Table II) statutory exchange_gain emtl vat total"
      summary.fgn_total = total;
    } else if (lower.includes("state") && lower.includes("table iii")) {
      summary.states_total = total;
    } else if (lower.includes("lgc") && lower.includes("table iv")) {
      summary.lgcs_total = total;
    } else if (lower.includes("13% derivation fund") && !lower.includes("refund") && !lower.includes("respect")) {
      summary.derivation_13_pct = total;
    }

    // TOTAL row: has all 4 revenue source columns + grand total
    if (/^TOTAL\s/.test(line.trim()) && nums.length >= 4) {
      summary.statutory = nums[0];
      summary.exchange_gain = nums[1];
      summary.emtl = nums[2];
      summary.vat = nums[3];
      summary.grand_total = nums[4] || total;
    }
  }

  log(`  Period: ${summary.revenue_month} ${summary.revenue_year} → shared ${summary.disbursement_month} ${summary.disbursement_year}`);
  log(`  Grand total: ${summary.grand_total}, FGN: ${summary.fgn_total}, States: ${summary.states_total}, LGCs: ${summary.lgcs_total}`);

  // --- Pass 2: States (deterministic parse — each state is one line with 22 columns) ---
  log("Pass 2: State allocations (deterministic parse)...");
  const states: any[] = [];

  const STATE_NAMES = [
    "ABIA", "ADAMAWA", "AKWA IBOM", "ANAMBRA", "BAUCHI", "BAYELSA", "BENUE", "BORNO",
    "CROSS RIVER", "DELTA", "EBONYI", "EDO", "EKITI", "ENUGU", "FCT-ABUJA", "GOMBE",
    "IMO", "JIGAWA", "KADUNA", "KANO", "KATSINA", "KEBBI", "KOGI", "KWARA", "LAGOS",
    "NASSARAWA", "NASARAWA", "NIGER", "OGUN", "ONDO", "OSUN", "OYO", "PLATEAU",
    "RIVERS", "SOKOTO", "TARABA", "YOBE", "ZAMFARA",
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines like: "1 ABIA 17 2,043,685,532.65 ..."
    // State line pattern: starts with a number, then state name, then numbers
    const stateMatch = STATE_NAMES.find((name) => {
      const pattern = new RegExp(`^\\d+\\s+${name.replace(/[- ]/g, "[- ]?")}\\s+\\d`);
      return pattern.test(trimmed);
    });

    if (!stateMatch) continue;
    if (states.find((s: any) => s.name === stateMatch)) continue;

    // Extract all numbers from the line
    const nums = trimmed
      .replace(new RegExp(`^\\d+\\s+${stateMatch.replace(/[- ]/g, "[- ]?")}\\s+`), "")
      .split(/\s+/)
      .map((v) => {
        if (v === "-") return 0;
        const cleaned = v.replace(/[(),]/g, "");
        const n = parseFloat(cleaned);
        return isNaN(n) ? null : (v.startsWith("(") ? -n : n);
      })
      .filter((n): n is number => n !== null);

    // Column mapping (22 columns):
    // 0=num_lgcs, 1=statutory, 2=13%_derivation, 3=gross_total,
    // 4=external_debt, 5=ispo, 6=other_deductions, 7=net_statutory,
    // 8=exchange_gain_alloc, 9=13%_deriv_exchange_gain, 10=total_exchange_gain,
    // 11=emtl, 12=total_ecology, 13=nddc_transfer, 14=net_ecology,
    // 15=gross_vat, 16=vat_deduction, 17=net_vat,
    // 18=total_gross, 19=total_net, 20=sn_repeat
    if (nums.length >= 18) {
      states.push({
        name: stateMatch,
        num_lgcs: nums[0] || 0,
        gross_statutory: nums[1] || 0,
        derivation_13_pct: nums[2] || 0,
        gross_total: nums[3] || 0,
        deductions: {
          external_debt: nums[4] || 0,
          ispo: nums[5] || 0,
          other: nums[6] || 0,
        },
        net_statutory: nums[7] || 0,
        exchange_gain: (nums[8] || 0) + (nums[9] || 0), // total exchange gain = alloc + 13% deriv
        emtl: nums[11] || 0,
        ecology: nums[14] || 0, // net ecology
        total_gross: nums[18] || 0,
        total_net: nums[19] || 0,
        // Extra fields for reporting
        vat: nums[17] || 0, // net VAT
      });
      log(`  Parsed: ${stateMatch} (${nums.length} columns, LGCs=${nums[0]}, total_net=${nums[19] || nums[nums.length - 2]})`);
    } else {
      log(`  WARN: ${stateMatch} has only ${nums.length} columns, skipping`);
    }
  }
  log(`  Total states extracted: ${states.length}`);

  // --- Pass 3: LGAs (deterministic parse with canonical LGA→State lookup) ---
  // The PDF renders two states' LGAs side-by-side per page. Instead of tracking
  // state pairs from TOTAL lines (which breaks when states repeat), we use the
  // canonical LGA_TO_STATE mapping to assign states deterministically.
  log("Pass 3: LGA allocations (lookup-based parse)...");
  const lgas: any[] = [];

  // Find the LGA table section. The LGA data may start BEFORE the header
  // ("Distribution of Revenue Allocation to Local Government Councils") due to
  // PDF text linearization. Use the entire text but stop before ecology/summary tables.
  // The LGA_TO_STATE lookup naturally filters non-LGA lines.
  const lgaSectionStart = 0;
  const ecologySectionMatch = text.indexOf("Details of Distribution of Ecology");
  const summarySectionMatch = text.indexOf("Summary of Distribution");
  const lgaSectionEnd = Math.min(
    ecologySectionMatch > 0 ? ecologySectionMatch : text.length,
    summarySectionMatch > 0 ? summarySectionMatch : text.length,
  );

  {
    const lgaText = text.substring(lgaSectionStart, lgaSectionEnd);
    const lgaLines = lgaText.split("\n");

    function parseLgaHalf(tokens: string[]): { name: string; nums: number[] } | null {
      let nameEnd = 1;
      while (nameEnd < tokens.length) {
        const cleaned = tokens[nameEnd].replace(/[(),\-]/g, "");
        if (/^\d/.test(cleaned) || tokens[nameEnd] === "-") break;
        nameEnd++;
      }
      if (nameEnd <= 1 || nameEnd >= tokens.length) return null;

      const name = tokens.slice(1, nameEnd).join(" ");
      const nums = tokens.slice(nameEnd).map((v) => {
        if (v === "-") return 0;
        const cleaned = v.replace(/[(),]/g, "");
        const n = parseFloat(cleaned);
        return isNaN(n) ? null : (v.startsWith("(") ? -n : n);
      }).filter((n): n is number => n !== null);

      return { name, nums };
    }

    // Phase A: Parse all LGA data lines, assign state via LGA_TO_STATE lookup
    let leftContext: string | null = null;
    let rightContext: string | null = null;

    for (const line of lgaLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.includes("S/n") ||
          trimmed.includes("Office of") || trimmed.includes("Federation Account") ||
          trimmed.includes("Distribution of") || trimmed.includes("₦") ||
          trimmed.includes("TOTAL") || trimmed.includes("LGCS")) continue;

      // LGA data line: starts with a serial number + uppercase name
      if (!/^\d+\s+[A-Z]/.test(trimmed)) continue;

      const tokens = trimmed.split(/\s+/);

      // Find the split point for side-by-side layout
      let splitIdx = -1;
      let inNumbers = false;
      for (let i = 1; i < tokens.length; i++) {
        const cleaned = tokens[i].replace(/[(),\-]/g, "");
        if (/^\d/.test(cleaned) || tokens[i] === "-") {
          inNumbers = true;
        } else if (inNumbers && /^[A-Z]/.test(tokens[i])) {
          if (i > 0 && /^\d+$/.test(tokens[i - 1]) && parseInt(tokens[i - 1]) < 100) {
            splitIdx = i - 1;
            break;
          }
        }
      }

      // Parse left half
      const leftTokens = splitIdx > 0 ? tokens.slice(0, splitIdx) : tokens;
      const left = parseLgaHalf(leftTokens);

      if (left && left.nums.length >= 7) {
        const totalAlloc = left.nums[left.nums.length - 1] || 0;
        const state = resolveLgaState(left.name, leftContext);

        if (!state) {
          log(`  WARN: Unrecognized LGA "${left.name}", skipping`);
        } else if (left.nums.length > 15) {
          log(`  WARN: Skipping "${left.name}" with ${left.nums.length} columns (state allocation row, not LGA)`);
        } else if (totalAlloc > 3_000_000_000) {
          log(`  WARN: Skipping "${left.name}" with total ${totalAlloc.toLocaleString()} (likely state total row)`);
        } else {
          leftContext = state;
          lgas.push({
            state,
            name: left.name,
            gross_statutory: left.nums[0] || 0,
            deduction: left.nums[1] || 0,
            exchange_gain: left.nums[2] || 0,
            vat: left.nums[left.nums.length - 2] || 0,
            emtl: left.nums[3] || 0,
            ecology: left.nums[6] || 0,
            total_allocation: totalAlloc,
          });
        }
      }

      // Parse right half
      if (splitIdx > 0) {
        const rightTokens = tokens.slice(splitIdx);
        const right = parseLgaHalf(rightTokens);

        if (right && right.nums.length >= 7) {
          const totalAlloc = right.nums[right.nums.length - 1] || 0;
          const state = resolveLgaState(right.name, rightContext);

          if (!state) {
            log(`  WARN: Unrecognized LGA "${right.name}", skipping`);
          } else if (right.nums.length > 15) {
            log(`  WARN: Skipping "${right.name}" with ${right.nums.length} columns (state allocation row, not LGA)`);
          } else if (totalAlloc > 3_000_000_000) {
            log(`  WARN: Skipping "${right.name}" with total ${totalAlloc.toLocaleString()} (likely state total row)`);
          } else {
            rightContext = state;
            lgas.push({
              state,
              name: right.name,
              gross_statutory: right.nums[0] || 0,
              deduction: right.nums[1] || 0,
              exchange_gain: right.nums[2] || 0,
              vat: right.nums[right.nums.length - 2] || 0,
              emtl: right.nums[3] || 0,
              ecology: right.nums[6] || 0,
              total_allocation: totalAlloc,
            });
          }
        }
      }
    }

    // Phase C: Post-parse validation against Pass 2's num_lgcs
    const lgaCountByState: Record<string, number> = {};
    for (const lga of lgas) {
      const norm = normalizeStateName(lga.state);
      lgaCountByState[norm] = (lgaCountByState[norm] ?? 0) + 1;
    }
    for (const state of states) {
      const norm = normalizeStateName(state.name);
      const expected = state.num_lgcs;
      const actual = lgaCountByState[norm] ?? 0;
      if (actual !== expected) {
        log(`  WARN: ${norm} has ${actual} LGAs, expected ${expected}`);
      }
    }
  }
  log(`  Total LGAs extracted: ${lgas.length}`);

  const extraction: FaacExtraction = {
    disbursement_month: summary.disbursement_month || month,
    disbursement_year: summary.disbursement_year || year,
    revenue_month: summary.revenue_month || "",
    revenue_year: summary.revenue_year || 0,
    national_summary: {
      fgn_total: summary.fgn_total || 0,
      states_total: summary.states_total || 0,
      lgcs_total: summary.lgcs_total || 0,
      derivation_13_pct: summary.derivation_13_pct || 0,
      grand_total: summary.grand_total || 0,
      revenue_sources: {
        statutory: summary.statutory || 0,
        good_and_value_consideration: 0,
        additional_funds_nnpc: 0,
        forex_exploitation_fund: 0,
        exchange_gain: summary.exchange_gain || 0,
        vat: summary.vat || 0,
        other: summary.emtl || 0, // EMTL (Electronic Money Transfer Levy)
      },
    },
    states,
    lgas,
  };

  log(`Multi-pass extraction complete (${elapsed(start)})`);
  return extraction;
}

async function runLlmExtraction(
  text: string,
  year: number,
  month: string,
): Promise<FaacExtraction> {
  const start = Date.now();

  const { baseUrl, apiKey, model } = await getLlmConfig();
  log(`LLM extraction with ${model} @ ${baseUrl}`);

  const isLocal = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
  const chunkSize = isLocal ? 4000 : 20000;
  const provider = createOpenAI({ baseURL: baseUrl, apiKey });

  return runLocalExtraction(provider, model, text, year, month, start, chunkSize);
}

/* ────── Build JSON Report ────── */

function buildReport(extraction: FaacExtraction, durationMs: number, llmModel: string, pdfChars: number) {
  const { national_summary, states, lgas } = extraction;
  const sourceFile = `faac/${year}/${month}/faac_allocation.pdf`;

  // Quality checks
  const stateTotal = states.reduce((sum, s) => sum + s.total_net, 0);
  const lgaTotal = lgas.reduce((sum, l) => sum + l.total_allocation, 0);
  const extractedStates = new Set(states.map((s) => normalizeStateName(s.name)));
  const expectedStates = Object.keys(STATE_TO_ZONE);
  const missingStates = expectedStates.filter((s) => !extractedStates.has(s));

  const componentSum = national_summary.fgn_total + national_summary.states_total +
    national_summary.lgcs_total + national_summary.derivation_13_pct;
  const grandTotalDiffPct = national_summary.grand_total > 0
    ? Math.abs(national_summary.grand_total - componentSum) / national_summary.grand_total * 100 : 0;
  const statesTotalDiffPct = national_summary.states_total > 0
    ? Math.abs(national_summary.states_total - stateTotal) / national_summary.states_total * 100 : 0;
  const lgaTotalDiffPct = national_summary.lgcs_total > 0
    ? Math.abs(national_summary.lgcs_total - lgaTotal) / national_summary.lgcs_total * 100 : 0;

  const oilStates = states.filter((s) => OIL_PRODUCING_STATES.has(normalizeStateName(s.name)));
  const sortedStates = [...states].sort((a, b) => b.total_net - a.total_net);

  // LGAs per state
  const lgasByState: Record<string, number> = {};
  for (const lga of lgas) {
    const state = normalizeStateName(lga.state);
    lgasByState[state] = (lgasByState[state] ?? 0) + 1;
  }

  // Chunks
  const lgaChunks = buildLgaMonthlyChunks(extraction, sourceFile);
  const stateChunks = buildStateMonthlyChunks(extraction, sourceFile);
  const nationalChunk = buildNationalMonthlyChunk(extraction, sourceFile);
  const zoneChunks = buildZoneMonthlyChunks(extraction, sourceFile);

  return {
    meta: {
      pdf_path: pdfPath,
      pdf_chars_extracted: pdfChars,
      llm_model: llmModel,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    },
    period: {
      disbursement_month: extraction.disbursement_month,
      disbursement_year: extraction.disbursement_year,
      revenue_month: extraction.revenue_month || null,
      revenue_year: extraction.revenue_year || null,
    },
    extraction: extraction,
    quality: {
      states_extracted: states.length,
      states_expected: 37,
      missing_states: missingStates,
      lgas_extracted: lgas.length,
      lgas_expected: 774,
      lgas_per_state: lgasByState,
      oil_producing_states_with_derivation: oilStates.filter((s) => s.derivation_13_pct > 0).length,
      oil_producing_states_total: oilStates.length,
      zero_value_states: states.filter((s) => s.total_net === 0).map((s) => s.name),
      zero_value_lgas: lgas.filter((l) => l.total_allocation === 0).length,
      checks: {
        grand_total_vs_components: {
          status: grandTotalDiffPct < 5 ? "PASS" : "WARN",
          diff_pct: +grandTotalDiffPct.toFixed(1),
        },
        states_total_vs_sum: {
          status: statesTotalDiffPct < 10 ? "PASS" : "WARN",
          diff_pct: +statesTotalDiffPct.toFixed(1),
        },
        lga_total_vs_sum: {
          status: lgaTotalDiffPct < 10 ? "PASS" : "WARN",
          diff_pct: +lgaTotalDiffPct.toFixed(1),
        },
      },
      top_5_states: sortedStates.slice(0, 5).map((s) => ({
        name: normalizeStateName(s.name),
        total_net: s.total_net,
      })),
      bottom_5_states: sortedStates.slice(-5).map((s) => ({
        name: normalizeStateName(s.name),
        total_net: s.total_net,
      })),
    },
    chunks: {
      lga_monthly: lgaChunks.length,
      state_monthly: stateChunks.length,
      national_monthly: 1,
      zone_monthly: zoneChunks.length,
      total: lgaChunks.length + stateChunks.length + 1 + zoneChunks.length,
      samples: {
        national: nationalChunk.text,
        state: stateChunks[0]?.text || null,
        lga: lgaChunks[0]?.text || null,
        zone: zoneChunks[0]?.text || null,
      },
    },
  };
}

/* ────── Main ────── */

async function main() {
  const totalStart = Date.now();

  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }

  log(`Dry run: ${month} ${year}`);
  log(`PDF: ${pdfPath}`);

  // Step 1: Extract text
  const text = await extractPdfText(pdfPath);
  const pdfChars = text.length;

  // Step 2: LLM extraction
  const extraction = await runLlmExtraction(text, year, month);

  const durationMs = Date.now() - totalStart;

  // Step 3: Build and save JSON report
  const { baseUrl, model: llmModel } = await getLlmConfig();
  const report = buildReport(extraction, durationMs, `${llmModel} @ ${baseUrl}`, pdfChars);

  const reportPath = path.join(ROOT, `packages/evaluation/results/faac-dry-run-${year}-${month}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`Report saved to: ${reportPath}`);
  log(`Total dry run time: ${elapsed(totalStart)}`);
  log(`States: ${extraction.states.length}/37, LGAs: ${extraction.lgas.length}/~774`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
