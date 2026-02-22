import { MDocument } from "@mastra/rag";
import { embedMany, generateText } from "ai";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";
import * as XLSX from "xlsx";
import {
  getDb,
  getPgVector,
  embeddingModelInstance,
  openaiProvider,
  RAG_CONFIG,
} from "./config";

const OCR_MODEL = process.env.OCR_MODEL || "glm-ocr:q8_0";
const MIN_TEXT_THRESHOLD = 100;
const CONCURRENCY = Number.parseInt(process.env.INGEST_CONCURRENCY || "5", 10);

/** Max input size for the recursive chunker to avoid call-stack overflow on huge documents */
const MAX_CHUNK_INPUT_SIZE = 500_000;

/**
 * Strip characters that PostgreSQL cannot store in JSON/text columns.
 * Specifically, \u0000 (null byte) causes: "unsupported Unicode escape sequence".
 */
function sanitizeText(text: string): string {
  // biome-ignore lint: simple regex replace for null bytes
  return text.replace(/\0/g, "");
}

/**
 * Chunk text safely, splitting into segments first if the text is too large
 * for the recursive chunker (which can blow the call stack on 100MB+ inputs).
 */
async function safeChunk(
  text: string,
  maxSize: number,
  overlap: number,
): Promise<string[]> {
  if (text.length <= MAX_CHUNK_INPUT_SIZE) {
    const doc = MDocument.fromText(text);
    const chunks = await doc.chunk({
      strategy: "recursive",
      maxSize,
      overlap,
    });
    return chunks.map((c) => (typeof c === "string" ? c : c.text));
  }

  // Pre-split into segments at newline boundaries to keep each under the limit
  const segments: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + MAX_CHUNK_INPUT_SIZE;
    if (end < text.length) {
      const newlinePos = text.lastIndexOf("\n", end);
      if (newlinePos > start) {
        end = newlinePos + 1;
      }
    } else {
      end = text.length;
    }
    segments.push(text.slice(start, end));
    start = end;
  }

  console.log(
    `    Text too large (${text.length} chars), split into ${segments.length} segments for chunking`,
  );

  const allChunks: string[] = [];
  for (const segment of segments) {
    const doc = MDocument.fromText(segment);
    const chunks = await doc.chunk({
      strategy: "recursive",
      maxSize,
      overlap,
    });
    allChunks.push(
      ...chunks.map((c) => (typeof c === "string" ? c : c.text)),
    );
  }
  return allChunks;
}

const BUDGETS_DIR = path.resolve(__dirname, "../../../../budgets");

function elapsed(startMs: number): string {
  const ms = Date.now() - startMs;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fileLabel(file: BudgetFile): string {
  return `${file.state} ${file.year} - ${file.filename}`;
}

type IngestionStatus = "processing" | "done" | "error";

async function ensureIngestionTable(): Promise<void> {
  await getDb().query(`
    CREATE TABLE IF NOT EXISTS ingested_documents (
      id SERIAL PRIMARY KEY,
      state TEXT NOT NULL,
      year INTEGER NOT NULL,
      filename TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      chunks INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(state, year, filename)
    )
  `);
}

async function getIngestionRecord(
  file: BudgetFile,
): Promise<{ file_hash: string; status: IngestionStatus } | null> {
  const { rows } = await getDb().query(
    `SELECT file_hash, status FROM ingested_documents WHERE state = $1 AND year = $2 AND filename = $3`,
    [file.state, file.year, file.filename],
  );
  return rows[0] ?? null;
}

async function upsertIngestionRecord(
  file: BudgetFile,
  hash: string,
  status: IngestionStatus,
  chunks: number,
): Promise<void> {
  await getDb().query(
    `INSERT INTO ingested_documents (state, year, filename, file_hash, chunks, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (state, year, filename)
     DO UPDATE SET file_hash = $4, chunks = $5, status = $6, updated_at = NOW()`,
    [file.state, file.year, file.filename, hash, chunks, status],
  );
}

function fileHash(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

interface BudgetFile {
  filePath: string;
  state: string;
  year: number;
  filename: string;
  sourceType: "pdf" | "xlsx" | "json" | "docx";
}

function discoverBudgetFiles(): BudgetFile[] {
  const files: BudgetFile[] = [];

  if (!fs.existsSync(BUDGETS_DIR)) {
    console.error(`Budgets directory not found: ${BUDGETS_DIR}`);
    process.exit(1);
  }

  console.log(`  Scanning: ${BUDGETS_DIR}`);
  const states = fs.readdirSync(BUDGETS_DIR).filter((entry) => {
    const entryPath = path.join(BUDGETS_DIR, entry);
    return fs.statSync(entryPath).isDirectory();
  });
  console.log(`  Found ${states.length} state directories`);

  for (const state of states) {
    const statePath = path.join(BUDGETS_DIR, state);
    const years = fs.readdirSync(statePath).filter((entry) => {
      const entryPath = path.join(statePath, entry);
      return fs.statSync(entryPath).isDirectory() && /^\d{4}$/.test(entry);
    });

    for (const year of years) {
      const yearPath = path.join(statePath, year);
      const entries = fs.readdirSync(yearPath);

      for (const filename of entries) {
        const ext = path.extname(filename).toLowerCase();
        if (ext === ".pdf") {
          files.push({
            filePath: path.join(yearPath, filename),
            state: state.replaceAll("_", " "),
            year: Number.parseInt(year, 10),
            filename,
            sourceType: "pdf",
          });
        } else if (ext === ".xlsx" || ext === ".xls") {
          files.push({
            filePath: path.join(yearPath, filename),
            state: state.replaceAll("_", " "),
            year: Number.parseInt(year, 10),
            filename,
            sourceType: "xlsx",
          });
        } else if (ext === ".docx" || ext === ".doc") {
          files.push({
            filePath: path.join(yearPath, filename),
            state: state.replaceAll("_", " "),
            year: Number.parseInt(year, 10),
            filename,
            sourceType: "docx",
          });
        } else if (ext === ".json" && filename !== "download_manifest.json") {
          files.push({
            filePath: path.join(yearPath, filename),
            state: state.replaceAll("_", " "),
            year: Number.parseInt(year, 10),
            filename,
            sourceType: "json",
          });
        }
      }
    }
  }

  return files;
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  const pdfStart = Date.now();
  const data = fs.readFileSync(filePath);
  console.log(`    PDF loaded (${(data.length / 1024).toFixed(0)} KB)`);
  const pdf = new PDFParse({ data: new Uint8Array(data) });

  // --- Tier 1: Try digital text extraction (instant) ---
  try {
    const result = await pdf.getText();
    const text = result.text.trim();
    if (text.length > MIN_TEXT_THRESHOLD) {
      console.log(
        `    getText() extracted ${text.length} chars (${elapsed(pdfStart)}) — using digital text`,
      );
      await pdf.destroy();
      return text;
    }
    console.log(
      `    getText() returned only ${text.length} chars, falling back to OCR`,
    );
  } catch {
    console.log(`    getText() failed, falling back to OCR`);
  }

  // --- Tier 2 & 3: Page-by-page OCR (Tesseract -> Vision model) ---
  const info = await pdf.getInfo();
  const totalPages = info.total;
  console.log(`    Total pages: ${totalPages}, starting page-by-page OCR`);

  const worker = await Tesseract.createWorker("eng");
  const pageTexts: string[] = [];

  for (let page = 1; page <= totalPages; page++) {
    const screenshots = await pdf.getScreenshot({
      partial: [page],
      imageDataUrl: true,
      imageBuffer: true,
      scale: 2,
    });

    if (screenshots.pages.length === 0) {
      console.warn(
        `    Page ${page}/${totalPages} - no screenshot produced, skipping`,
      );
      continue;
    }

    const pageData = screenshots.pages[0];

    // Tier 2: Tesseract.js (fast, CPU-friendly)
    try {
      const ocrStart = Date.now();
      const {
        data: { text },
      } = await worker.recognize(Buffer.from(pageData.data));
      if (text.trim().length > 20) {
        pageTexts.push(text.trim());
        console.log(
          `    Page ${page}/${totalPages} Tesseract OK (${elapsed(ocrStart)}, ${text.trim().length} chars)`,
        );
        continue;
      }
      console.log(
        `    Page ${page}/${totalPages} Tesseract returned too little text, trying vision model`,
      );
    } catch {
      console.log(
        `    Page ${page}/${totalPages} Tesseract failed, trying vision model`,
      );
    }

    // Tier 3: Vision model (slowest, most accurate)
    try {
      const ocrStart = Date.now();
      const { text } = await generateText({
        model: openaiProvider.chat(OCR_MODEL),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this document page exactly as written. Preserve the structure including headers, tables, line items, and numbers. Return only the extracted text, no commentary.",
              },
              {
                type: "image",
                image: pageData.dataUrl,
              },
            ],
          },
        ],
      });
      if (text.trim().length > 0) {
        pageTexts.push(text.trim());
        console.log(
          `    Page ${page}/${totalPages} Vision OK (${elapsed(ocrStart)}, ${text.trim().length} chars)`,
        );
        continue;
      }
    } catch (err) {
      console.warn(
        `    Page ${page}/${totalPages} Vision failed: ${err instanceof Error ? err.message : err}`,
      );
    }

    console.warn(`    Page ${page}/${totalPages} all methods failed, skipping`);
  }

  await worker.terminate();
  await pdf.destroy();
  const fullText = pageTexts.join("\n\n--- Page Break ---\n\n");
  console.log(
    `    PDF extraction done (${elapsed(pdfStart)}, ${fullText.length} total chars)`,
  );
  return fullText;
}

function extractTextFromExcel(filePath: string): string {
  const workbook = XLSX.readFile(filePath);
  const textParts: string[] = [];
  console.log(
    `    Excel loaded: ${workbook.SheetNames.length} sheet(s) [${workbook.SheetNames.join(", ")}]`,
  );

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    console.log(`    Sheet "${sheetName}": ${csv.length} chars`);
    textParts.push(`Sheet: ${sheetName}\n${csv}`);
  }

  const fullText = textParts.join("\n\n");
  console.log(`    Excel extraction done (${fullText.length} total chars)`);
  return fullText;
}

function extractTextFromDocx(filePath: string): string {
  const docxStart = Date.now();
  const stat = fs.statSync(filePath);
  console.log(`    DOCX file (${(stat.size / 1024).toFixed(0)} KB)`);

  // A .docx is a zip containing word/document*.xml files.
  // The XML can be hundreds of MBs for large documents (303 MB for 1998 pages).
  // We use a shell pipeline: unzip streams XML -> sed strips tags -> temp file.
  // Node only reads the final stripped text, never the raw XML.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { execSync } = require("node:child_process");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("node:os");
  const tmpFile = path.join(os.tmpdir(), `docx_extract_${Date.now()}.txt`);

  const textParts: string[] = [];
  try {
    // List document XML parts inside the zip
    const fileList = execSync(
      String.raw`unzip -l "${filePath}" | grep "word/.*\.xml"`,
      {
        encoding: "utf-8",
        maxBuffer: 1024 * 1024,
      },
    );

    const xmlFiles = fileList
      .split("\n")
      .map((line: string) => line.trim().split(/\s+/).pop() ?? "")
      .filter(
        (name: string) =>
          name.startsWith("word/document") && name.endsWith(".xml"),
      );

    if (xmlFiles.length === 0) {
      xmlFiles.push("word/document.xml");
    }

    console.log(`    Found XML parts: ${xmlFiles.join(", ")}`);

    for (const xmlFile of xmlFiles) {
      try {
        // Fully streaming pipeline: unzip pipes XML -> sed strips tags -> temp file.
        // Neither unzip nor sed hold the full file in memory, and Node never sees the raw XML.
        execSync(
          String.raw`unzip -p "${filePath}" "${xmlFile}" | sed -e 's/<\/w:p>/\n/g' -e 's/<w:tab\/>/\t/g' -e 's/<[^>]*>//g' -e 's/&amp;/\&/g' -e 's/&lt;/</g' -e 's/&gt;/>/g' > "${tmpFile}"`,
          { shell: "/bin/sh" },
        );

        const text = fs.readFileSync(tmpFile, "utf-8").trim();

        if (text.length > 0) {
          textParts.push(text);
          console.log(`    ${xmlFile}: ${text.length} chars extracted`);
        }
      } catch (err) {
        console.warn(
          `    Failed to extract ${xmlFile}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  } catch (err) {
    console.warn(
      `    unzip listing failed: ${err instanceof Error ? err.message : err}`,
    );
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {}
  }

  const fullText = textParts.join("\n\n");
  console.log(
    `    DOCX extraction done (${elapsed(docxStart)}, ${fullText.length} chars)`,
  );
  return fullText;
}

function extractTextFromJson(
  filePath: string,
  state: string,
  year: number,
): string {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const lines: string[] = [`${state} State ${year} Budget Metadata`];

  function flatten(obj: Record<string, unknown>, prefix = ""): void {
    for (const [key, value] of Object.entries(obj)) {
      const label = prefix
        ? `${prefix} - ${key.replaceAll("_", " ")}`
        : key.replaceAll("_", " ");
      if (value === null || value === undefined) continue;
      if (typeof value === "object" && !Array.isArray(value)) {
        flatten(value as Record<string, unknown>, label);
      } else if (Array.isArray(value)) {
        lines.push(`${label}: ${value.join(", ")}`);
      } else if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        lines.push(`${label}: ${value}`);
      } else {
        lines.push(`${label}: ${JSON.stringify(value)}`);
      }
    }
  }

  flatten(data);
  const fullText = lines.join("\n");
  console.log(`    JSON extraction done (${fullText.length} total chars)`);
  return fullText;
}

async function ingestFile(file: BudgetFile): Promise<number> {
  const fileStart = Date.now();
  const label = fileLabel(file);
  console.log(`  Processing [${file.sourceType}]: ${label}`);

  let text: string;
  try {
    if (file.sourceType === "pdf") {
      text = await extractTextFromPdf(file.filePath);
    } else if (file.sourceType === "docx") {
      text = extractTextFromDocx(file.filePath);
    } else if (file.sourceType === "json") {
      text = extractTextFromJson(file.filePath, file.state, file.year);
    } else {
      text = extractTextFromExcel(file.filePath);
    }
  } catch (err) {
    console.error(`  Error extracting text from ${label}:`, err);
    return 0;
  }

  // Strip null bytes and other characters that PostgreSQL cannot store
  text = sanitizeText(text);

  if (!text || text.trim().length === 0) {
    console.warn(`  Skipping empty file: ${label}`);
    return 0;
  }

  console.log(
    `    Extracted ${text.length} chars, chunking (size=${RAG_CONFIG.chunkSize}, overlap=${RAG_CONFIG.chunkOverlap})...`,
  );
  const chunkStart = Date.now();
  const chunkTexts = await safeChunk(
    text,
    RAG_CONFIG.chunkSize,
    RAG_CONFIG.chunkOverlap,
  );

  if (!chunkTexts || chunkTexts.length === 0) {
    console.warn(`  No chunks produced for: ${label}`);
    return 0;
  }
  console.log(
    `    Produced ${chunkTexts.length} chunks (${elapsed(chunkStart)})`,
  );

  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(chunkTexts.length / BATCH_SIZE);
  let totalUpserted = 0;

  for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = chunkTexts.slice(i, i + BATCH_SIZE);
    const batchStart = Date.now();

    const { embeddings: rawEmbeddings } = await embedMany({
      model: embeddingModelInstance,
      values: batch,
    });

    const embeddings = rawEmbeddings.map((e) =>
      e.length > RAG_CONFIG.embeddingDimension
        ? e.slice(0, RAG_CONFIG.embeddingDimension)
        : e,
    );

    const metadata = batch.map((chunkText, j) => ({
      text: chunkText,
      state: file.state,
      year: file.year,
      filename: file.filename,
      source_type: file.sourceType,
      chunk_index: i + j,
    }));

    await getPgVector().upsert({
      indexName: RAG_CONFIG.indexName,
      vectors: embeddings,
      metadata,
    });

    totalUpserted += batch.length;
    console.log(
      `    Batch ${batchNum}/${totalBatches}: embedded + upserted ${batch.length} chunks (${elapsed(batchStart)})`,
    );
  }

  console.log(
    `  Done: ${label} -> ${totalUpserted} chunks (${elapsed(fileStart)})`,
  );
  return totalUpserted;
}

async function main() {
  const pipelineStart = Date.now();
  console.log("=== Budget Document Ingestion Pipeline ===\n");

  // Discover files
  const files = discoverBudgetFiles();
  const pdfCount = files.filter((f) => f.sourceType === "pdf").length;
  const xlsxCount = files.filter((f) => f.sourceType === "xlsx").length;
  const docxCount = files.filter((f) => f.sourceType === "docx").length;
  const jsonCount = files.filter((f) => f.sourceType === "json").length;
  console.log(
    `Found ${files.length} budget files across ${new Set(files.map((f) => f.state)).size} states (${pdfCount} PDFs, ${xlsxCount} Excel, ${docxCount} DOCX, ${jsonCount} JSON)\n`,
  );

  if (files.length === 0) {
    console.error("No budget files found. Check the budgets directory.");
    process.exit(1);
  }

  // Create pgvector index
  console.log("Creating pgvector index...");
  try {
    await getPgVector().createIndex({
      indexName: RAG_CONFIG.indexName,
      dimension: RAG_CONFIG.embeddingDimension,
      metric: "cosine",
      vectorType: "halfvec",
      indexConfig: { type: "hnsw" },
    });
    console.log(`Index "${RAG_CONFIG.indexName}" created.\n`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already exists")) {
      console.log(
        `Index "${RAG_CONFIG.indexName}" already exists, continuing.\n`,
      );
    } else {
      throw err;
    }
  }

  // Ensure ingestion tracking table exists
  await ensureIngestionTable();

  // Build work queue — filter out already-ingested files
  const queue: Array<{ file: BudgetFile; hash: string; fileNum: number }> = [];
  let skippedFiles = 0;

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const label = fileLabel(file);
    const hash = fileHash(file.filePath);
    const existing = await getIngestionRecord(file);

    if (existing?.status === "done" && existing.file_hash === hash) {
      console.log(`  Skipping (already ingested): ${label}`);
      skippedFiles++;
      continue;
    }

    if (existing?.file_hash !== undefined && existing.file_hash !== hash) {
      console.log(`  Queued (file changed): ${label}`);
    } else if (existing?.status === "error") {
      console.log(`  Queued (retrying failed): ${label}`);
    } else {
      console.log(`  Queued: ${label}`);
    }

    queue.push({ file, hash, fileNum: idx + 1 });
  }

  const totalToProcess = queue.length;
  const workerCount = Math.min(CONCURRENCY, totalToProcess);

  console.log(`\nSkipped ${skippedFiles} already-ingested files.`);
  console.log(
    `Processing ${totalToProcess} files with ${workerCount} workers...\n`,
  );

  // Shared counters (safe in single-threaded Node.js — mutations happen synchronously between awaits)
  let totalChunks = 0;
  let processedFiles = 0;
  let errorFiles = 0;

  async function worker(workerId: number): Promise<void> {
    while (queue.length > 0) {
      // shift() removes from front — guarantees no other worker picks the same file
      const item = queue.shift()!;
      const { file, hash, fileNum } = item;
      const tag = `[W${workerId}][${fileNum}/${files.length}]`;
      const label = fileLabel(file);

      await upsertIngestionRecord(file, hash, "processing", 0);

      try {
        const count = await ingestFile(file);
        totalChunks += count;
        processedFiles++;
        await upsertIngestionRecord(file, hash, "done", count);
        console.log(`${tag} DONE: ${label} (${count} chunks)\n`);
      } catch (err) {
        console.error(`${tag} FAILED: ${label}`, err);
        await upsertIngestionRecord(file, hash, "error", 0);
        errorFiles++;
      }
    }
  }

  // Launch workers concurrently
  if (workerCount > 0) {
    await Promise.all(
      Array.from({ length: workerCount }, (_, i) => worker(i + 1)),
    );
  }

  console.log("\n=== Ingestion Complete ===");
  console.log(`Total time:    ${elapsed(pipelineStart)}`);
  console.log(`Processed:     ${processedFiles}`);
  console.log(`Skipped:       ${skippedFiles}`);
  console.log(`Errors:        ${errorFiles}`);
  console.log(`Total chunks:  ${totalChunks}`);

  await getPgVector().disconnect();
  await getDb().end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
