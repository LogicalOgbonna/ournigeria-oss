import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  getDb,
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
} from "./config";

const CONCURRENCY = Number.parseInt(process.env.INGEST_CONCURRENCY || "5", 10);
const CORRUPTION_DIR = path.resolve(__dirname, "../../../../../packages/source/corruption");
const INDEX_NAME = "corruption_chunks";

function elapsed(startMs: number): string {
  const ms = Date.now() - startMs;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type IngestionStatus = "processing" | "done" | "error";

interface CorruptionFile {
  filePath: string;
  official: string;
  section: string;
  filename: string;
  fileHash: string;
}

function fileLabel(file: CorruptionFile): string {
  return `${file.official} / ${file.section}`;
}

function computeHash(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function ensureCorruptionTable(): Promise<void> {
  await getDb().query(`
    CREATE TABLE IF NOT EXISTS ingested_corruption_documents (
      id SERIAL PRIMARY KEY,
      official TEXT NOT NULL,
      section TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      chunks INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(official, section, filename)
    )
  `);
}

async function getIngestionRecord(
  file: CorruptionFile,
): Promise<{ file_hash: string; status: IngestionStatus } | null> {
  const { rows } = await getDb().query(
    `SELECT file_hash, status FROM ingested_corruption_documents WHERE official = $1 AND section = $2 AND filename = $3`,
    [file.official, file.section, file.filename],
  );
  return rows[0] ?? null;
}

async function upsertIngestionRecord(
  file: CorruptionFile,
  status: IngestionStatus,
  chunks: number,
): Promise<void> {
  await getDb().query(
    `INSERT INTO ingested_corruption_documents (official, section, filename, file_hash, chunks, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (official, section, filename)
     DO UPDATE SET file_hash = $4, chunks = $5, status = $6, updated_at = NOW()`,
    [file.official, file.section, file.filename, file.fileHash, chunks, status],
  );
}

function discoverCorruptionFiles(): CorruptionFile[] {
  const files: CorruptionFile[] = [];

  if (!fs.existsSync(CORRUPTION_DIR)) {
    console.error(`Corruption directory not found: ${CORRUPTION_DIR}`);
    process.exit(1);
  }

  console.log(`  Scanning: ${CORRUPTION_DIR}`);
  const entries = fs.readdirSync(CORRUPTION_DIR).filter((entry) => {
    const entryPath = path.join(CORRUPTION_DIR, entry);
    return fs.statSync(entryPath).isDirectory();
  });
  console.log(`  Found ${entries.length} official directories`);

  for (const officialDir of entries) {
    const officialPath = path.join(CORRUPTION_DIR, officialDir);
    const mdFiles = fs
      .readdirSync(officialPath)
      .filter((f) => f.endsWith(".md"));

    for (const filename of mdFiles) {
      const filePath = path.join(officialPath, filename);
      const stat = fs.statSync(filePath);

      if (stat.size === 0) {
        console.log(`  Skipping empty file: ${officialDir}/${filename}`);
        continue;
      }

      const section = path.basename(filename, ".md");
      files.push({
        filePath,
        official: officialDir.replaceAll("_", " "),
        section,
        filename,
        fileHash: computeHash(filePath),
      });
    }
  }

  // Also pick up the top-level INDEX.md
  const indexPath = path.join(CORRUPTION_DIR, "INDEX.md");
  if (fs.existsSync(indexPath) && fs.statSync(indexPath).size > 0) {
    files.push({
      filePath: indexPath,
      official: "_index",
      section: "index",
      filename: "INDEX.md",
      fileHash: computeHash(indexPath),
    });
  }

  return files;
}

async function ingestFile(file: CorruptionFile): Promise<number> {
  const fileStart = Date.now();
  const label = fileLabel(file);
  console.log(`  Processing [md]: ${label}`);

  const text = fs.readFileSync(file.filePath, "utf-8").trim();

  if (!text || text.length === 0) {
    console.warn(`  Skipping empty content: ${label}`);
    return 0;
  }

  console.log(
    `    Read ${text.length} chars, chunking (size=${RAG_CONFIG.chunkSize}, overlap=${RAG_CONFIG.chunkOverlap})...`,
  );
  const chunkStart = Date.now();
  const doc = MDocument.fromText(text);
  const chunks = await doc.chunk({
    strategy: "recursive",
    maxSize: RAG_CONFIG.chunkSize,
    overlap: RAG_CONFIG.chunkOverlap,
  });

  if (!chunks || chunks.length === 0) {
    console.warn(`  No chunks produced for: ${label}`);
    return 0;
  }

  const chunkTexts = chunks.map((c) => (typeof c === "string" ? c : c.text));
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
      official: file.official,
      section: file.section,
      filename: file.filename,
      file_hash: file.fileHash,
      source_type: "md",
      urd: file.filePath,
      chunk_index: i + j,
    }));

    await getPgVector().upsert({
      indexName: INDEX_NAME,
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
  console.log("=== Corruption Document Ingestion Pipeline ===\n");

  // Discover files
  const files = discoverCorruptionFiles();
  const officials = new Set(files.map((f) => f.official));
  console.log(
    `Found ${files.length} markdown files across ${officials.size} officials\n`,
  );

  // Print file hashes
  console.log("File hashes (SHA-256):");
  for (const file of files) {
    console.log(`  ${file.fileHash}  ${file.official}/${file.filename}`);
  }
  console.log();

  if (files.length === 0) {
    console.error("No corruption files found. Check the corruption directory.");
    process.exit(1);
  }

  // Create pgvector index for corruption chunks
  console.log("Creating pgvector index...");
  try {
    await getPgVector().createIndex({
      indexName: INDEX_NAME,
      dimension: RAG_CONFIG.embeddingDimension,
      metric: "cosine",
      vectorType: "halfvec",
      indexConfig: { type: "hnsw" },
    });
    console.log(`Index "${INDEX_NAME}" created.\n`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already exists")) {
      console.log(`Index "${INDEX_NAME}" already exists, continuing.\n`);
    } else {
      throw err;
    }
  }

  // Ensure ingestion tracking table exists
  await ensureCorruptionTable();

  // Build work queue — filter out already-ingested files
  const queue: Array<{ file: CorruptionFile; fileNum: number }> = [];
  let skippedFiles = 0;

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const label = fileLabel(file);
    const existing = await getIngestionRecord(file);

    if (existing?.status === "done" && existing.file_hash === file.fileHash) {
      console.log(`  Skipping (already ingested): ${label}`);
      skippedFiles++;
      continue;
    }

    if (existing?.file_hash !== undefined && existing.file_hash !== file.fileHash) {
      console.log(`  Queued (file changed): ${label}`);
    } else if (existing?.status === "error") {
      console.log(`  Queued (retrying failed): ${label}`);
    } else {
      console.log(`  Queued: ${label}`);
    }

    queue.push({ file, fileNum: idx + 1 });
  }

  const totalToProcess = queue.length;
  const workerCount = Math.min(CONCURRENCY, totalToProcess);

  console.log(`\nSkipped ${skippedFiles} already-ingested files.`);
  console.log(
    `Processing ${totalToProcess} files with ${workerCount} workers...\n`,
  );

  // Shared counters
  let totalChunks = 0;
  let processedFiles = 0;
  let errorFiles = 0;

  async function worker(workerId: number): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift()!;
      const { file, fileNum } = item;
      const tag = `[W${workerId}][${fileNum}/${files.length}]`;
      const label = fileLabel(file);

      await upsertIngestionRecord(file, "processing", 0);

      try {
        const count = await ingestFile(file);
        totalChunks += count;
        processedFiles++;
        await upsertIngestionRecord(file, "done", count);
        console.log(`${tag} DONE: ${label} (${count} chunks)\n`);
      } catch (err) {
        console.error(`${tag} FAILED: ${label}`, err);
        await upsertIngestionRecord(file, "error", 0);
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

  console.log("\n=== Corruption Ingestion Complete ===");
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
