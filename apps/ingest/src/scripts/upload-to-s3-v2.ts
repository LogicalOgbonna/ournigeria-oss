#!/usr/bin/env npx tsx

/**
 * upload-to-s3-v2.ts
 *
 * Like upload-to-s3.ts but checks the local DB (ingestion_records) instead of
 * listing existing S3 objects.  A file is skipped when an ingestion_records row
 * already exists for (pipeline, filePath) with status = 'done'.
 *
 * Usage is identical to v1:
 *   npx tsx apps/ingest/src/scripts/upload-to-s3-v2.ts --budgets [--dry-run]
 */

import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env from apps/ingest/ regardless of cwd
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import pLimit from "p-limit";
import mime from "mime-types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UploadConfig {
  sourceRoot: string;
  bucket: string;
  region: string;
  folders: string[];
  concurrency: number;
  dryRun: boolean;
  verifyOnly: boolean;
}

interface FileEntry {
  localPath: string;
  s3Key: string;
  size: number;
}

interface FolderSummary {
  folder: string;
  total: number;
  uploaded: number;
  skipped: number;
  failed: number;
  durationMs: number;
}

interface UploadFailure {
  s3Key: string;
  localPath: string;
  error: string;
}

// ─── Folder → pipeline mapping ──────────────────────────────────────────────

const FOLDER_TO_PIPELINE: Record<string, string> = {
  budgets: "budget",
  corruption: "corruption",
  corruption_discarded: "corruption",
  govspend: "govspend",
};

// ─── MIME Map ───────────────────────────────────────────────────────────────

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".json": "application/json",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".html": "text/html",
  ".htm": "text/html",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

// Files to skip at the root of each folder
const SKIP_FILES = new Set([
  "package.json",
  "project.json",
  "tsconfig.json",
  ".gitignore",
  ".gitkeep",
]);

// ─── Arg Parsing ────────────────────────────────────────────────────────────

function parseArgs(): UploadConfig {
  const sourceRoot = path.resolve(process.cwd(), "packages/source");

  if (!fs.existsSync(sourceRoot)) {
    console.error(`Source directory not found: ${sourceRoot}`);
    console.error("Run this script from the repository root.");
    process.exit(1);
  }

  const allFolders = fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const args = process.argv.slice(2);

  // Parse reserved flags
  let concurrency = 10;
  let dryRun = false;
  let verifyOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--concurrency" && args[i + 1]) {
      concurrency = parseInt(args[i + 1], 10);
      if (isNaN(concurrency) || concurrency < 1) {
        console.error(
          "Invalid --concurrency value. Must be a positive integer.",
        );
        process.exit(1);
      }
      i++; // skip next arg
    }
    if (args[i] === "--dry-run") dryRun = true;
    if (args[i] === "--verify-only") verifyOnly = true;
  }

  // Parse folder flags
  const requestedFolders = args
    .filter(
      (arg) =>
        arg.startsWith("--") &&
        arg !== "--dry-run" &&
        arg !== "--verify-only" &&
        arg !== "--concurrency",
    )
    .map((arg) => arg.slice(2))
    .filter((name) => {
      // Skip the value after --concurrency
      if (/^\d+$/.test(name)) return false;
      return true;
    });

  // Validate folders
  const invalidFolders = requestedFolders.filter(
    (f) => !allFolders.includes(f),
  );
  if (invalidFolders.length > 0) {
    console.error(`Unknown folder(s): ${invalidFolders.join(", ")}`);
    console.error(`Available folders:`);
    allFolders.forEach((f) => console.error(`  --${f}`));
    process.exit(1);
  }

  if (requestedFolders.length === 0) {
    console.log(
      "Usage: npx tsx apps/ingest/src/scripts/upload-to-s3-v2.ts --<folder> [--<folder>...] [options]",
    );
    console.log("");
    console.log("Folder flags (pass one or more):");
    allFolders.forEach((f) =>
      console.log(`  --${f.padEnd(25)} Upload the ${f}/ folder`),
    );
    console.log("");
    console.log("Options:");
    console.log(
      "  --concurrency <n>       Parallel upload limit (default: 10)",
    );
    console.log("  --dry-run               Preview what would be uploaded");
    console.log(
      "  --verify-only           Compare DB ingestion records vs local files",
    );
    console.log("");
    console.log("Examples:");
    console.log(
      "  npx tsx apps/ingest/src/scripts/upload-to-s3-v2.ts --budgets --dry-run",
    );
    console.log(
      "  npx tsx apps/ingest/src/scripts/upload-to-s3-v2.ts --corruption",
    );
    console.log(
      "  npx tsx apps/ingest/src/scripts/upload-to-s3-v2.ts --govspend --concurrency 50",
    );
    process.exit(1);
  }

  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;

  if (!dryRun) {
    if (!bucket) {
      console.error("Missing S3_BUCKET environment variable.");
      process.exit(1);
    }
    if (!region) {
      console.error("Missing AWS_REGION environment variable.");
      process.exit(1);
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.error("Missing AWS_ACCESS_KEY_ID environment variable.");
      process.exit(1);
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("Missing AWS_SECRET_ACCESS_KEY environment variable.");
      process.exit(1);
    }
  }

  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL environment variable.");
    process.exit(1);
  }

  return {
    sourceRoot,
    bucket: bucket || "ournigeria-documents",
    region: region || "eu-west-1",
    folders: requestedFolders,
    concurrency,
    dryRun,
    verifyOnly,
  };
}

// ─── File Discovery ─────────────────────────────────────────────────────────

function discoverFiles(sourceRoot: string, folder: string): FileEntry[] {
  const folderPath = path.join(sourceRoot, folder);
  const entries: FileEntry[] = [];

  function walk(dir: string, depth: number) {
    const items = fs.readdirSync(dir, {
      withFileTypes: true,
    });
    for (const item of items) {
      // Skip hidden files/dirs
      if (item.name.startsWith(".")) continue;

      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (item.isFile()) {
        // Skip root-level config files
        if (depth === 0 && SKIP_FILES.has(item.name)) continue;

        const relativePath = path.relative(sourceRoot, fullPath);
        const stat = fs.statSync(fullPath);

        entries.push({
          localPath: fullPath,
          s3Key: relativePath,
          size: stat.size,
        });
      }
    }
  }

  walk(folderPath, 0);
  return entries;
}

// ─── Metadata Extraction ────────────────────────────────────────────────────

function extractMetadata(s3Key: string): Record<string, string> {
  const parts = s3Key.split("/");
  const folder = parts[0];
  const ext = path.extname(s3Key).slice(1) || "unknown";
  const metadata: Record<string, string> = {
    "source-type": ext,
  };

  switch (folder) {
    case "budgets": {
      metadata["pipeline"] = "budget";
      if (parts[1]) metadata["state"] = parts[1];
      if (parts[2]) metadata["year"] = parts[2];
      break;
    }
    case "corruption": {
      metadata["pipeline"] = "corruption";
      if (parts[1]) metadata["official"] = parts[1];
      break;
    }
    case "corruption_discarded": {
      metadata["pipeline"] = "corruption-discarded";
      if (parts[1]) metadata["official"] = parts[1];
      break;
    }
    case "govspend": {
      metadata["pipeline"] = "govspend";
      if (parts[1]) metadata["year"] = parts[1];
      break;
    }
    default: {
      metadata["pipeline"] = folder;
      break;
    }
  }

  return metadata;
}

// ─── Content Type ───────────────────────────────────────────────────────────

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_MAP[ext] || mime.lookup(filename) || "application/octet-stream";
}

// ─── Build Ingested Keys Set from DB ────────────────────────────────────────

async function buildIngestedKeysSet(
  prisma: PrismaClient,
  pipeline: string,
): Promise<Set<string>> {
  const ingestedKeys = new Set<string>();

  console.log(
    `  Querying DB for ingested files (pipeline="${pipeline}", status="done")...`,
  );

  const records = await prisma.ingestionRecord.findMany({
    where: {
      pipeline,
      status: "done",
    },
    select: {
      filePath: true,
    },
  });

  for (const record of records) {
    ingestedKeys.add(record.filePath);
  }

  console.log(
    `  Found ${ingestedKeys.size} ingested files for pipeline "${pipeline}"`,
  );
  return ingestedKeys;
}

// ─── Upload Folder ──────────────────────────────────────────────────────────

async function uploadFolder(
  s3: S3Client,
  prisma: PrismaClient,
  config: UploadConfig,
  folder: string,
): Promise<FolderSummary> {
  const startTime = Date.now();
  const pipeline = FOLDER_TO_PIPELINE[folder] || folder;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Folder: ${folder}/  (pipeline: ${pipeline})`);
  console.log("=".repeat(60));

  // 1. Discover files
  console.log("  Discovering files...");
  const files = discoverFiles(config.sourceRoot, folder);
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  console.log(`  Found ${files.length} files (${formatBytes(totalSize)})`);

  if (files.length === 0) {
    return {
      folder,
      total: 0,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // 2. Build ingested keys set from DB
  const ingestedKeys = await buildIngestedKeysSet(prisma, pipeline);

  // 3. Partition files into needs-upload vs already-ingested
  const toUpload: FileEntry[] = [];
  let alreadyIngested = 0;

  for (const file of files) {
    if (ingestedKeys.has(file.s3Key)) {
      alreadyIngested++;
    } else {
      toUpload.push(file);
    }
  }

  console.log(`  Already ingested (skipping): ${alreadyIngested}`);
  console.log(`  Not yet ingested (to upload): ${toUpload.length}`);

  // 4. Dry-run mode
  if (config.dryRun) {
    console.log("\n  [DRY RUN] Would upload:");
    const preview = toUpload.slice(0, 20);
    for (const file of preview) {
      const ct = getContentType(file.localPath);
      const meta = extractMetadata(file.s3Key);
      console.log(`    ${file.s3Key} (${formatBytes(file.size)}, ${ct})`);
      console.log(`      metadata: ${JSON.stringify(meta)}`);
    }
    if (toUpload.length > 20) {
      console.log(`    ... and ${toUpload.length - 20} more files`);
    }

    // Show breakdown by extension
    const extCounts = new Map<string, number>();
    for (const f of toUpload) {
      const ext = path.extname(f.localPath).toLowerCase() || "(none)";
      extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
    }
    if (extCounts.size > 0) {
      console.log("\n  File type breakdown (to upload):");
      for (const [ext, count] of [...extCounts.entries()].sort(
        (a, b) => b[1] - a[1],
      )) {
        console.log(`    ${ext.padEnd(10)} ${count} files`);
      }
    }

    return {
      folder,
      total: files.length,
      uploaded: 0,
      skipped: files.length,
      failed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // 5. Verify-only mode
  if (config.verifyOnly) {
    console.log(
      `\n  Verification: local=${files.length}, ingested=${ingestedKeys.size}`,
    );

    if (toUpload.length === 0) {
      console.log("  All local files have been ingested");
    } else {
      console.log(`  Not yet ingested: ${toUpload.length} files`);
      toUpload.slice(0, 10).forEach((f) => console.log(`    - ${f.s3Key}`));
      if (toUpload.length > 10)
        console.log(`    ... and ${toUpload.length - 10} more`);
    }

    return {
      folder,
      total: files.length,
      uploaded: 0,
      skipped: alreadyIngested,
      failed: toUpload.length,
      durationMs: Date.now() - startTime,
    };
  }

  // 6. Nothing to upload
  if (toUpload.length === 0) {
    console.log("  Nothing to upload — all files already ingested.");
    return {
      folder,
      total: files.length,
      uploaded: 0,
      skipped: alreadyIngested,
      failed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // 7. Upload with concurrency
  const limit = pLimit(config.concurrency);
  let uploaded = 0;
  let failed = 0;
  const failures: UploadFailure[] = [];
  let processed = 0;

  const progressInterval = toUpload.length > 5000 ? 1000 : 100;

  const tasks = toUpload.map((file) =>
    limit(async () => {
      try {
        const body = fs.createReadStream(file.localPath);
        const contentType = getContentType(file.localPath);
        const metadata = extractMetadata(file.s3Key);

        await s3.send(
          new PutObjectCommand({
            Bucket: config.bucket,
            Key: file.s3Key,
            Body: body,
            ContentLength: file.size,
            ContentType: contentType,
            Metadata: metadata,
          }),
        );

        uploaded++;
      } catch (err: any) {
        failed++;
        failures.push({
          s3Key: file.s3Key,
          localPath: file.localPath,
          error: err.message || String(err),
        });
      }

      processed++;

      if (processed % progressInterval === 0) {
        const pct = ((processed / toUpload.length) * 100).toFixed(1);
        console.log(
          `  [${folder}] Progress: ${uploaded} uploaded, ${failed} failed (${processed}/${toUpload.length} = ${pct}%)`,
        );
      }
    }),
  );

  await Promise.all(tasks);

  // Write failures file if any
  if (failures.length > 0) {
    const failuresPath = path.resolve(
      process.cwd(),
      `upload-failures-${folder}.json`,
    );
    fs.writeFileSync(failuresPath, JSON.stringify(failures, null, 2));
    console.log(`  Failures written to: ${failuresPath}`);
  }

  const summary: FolderSummary = {
    folder,
    total: files.length,
    uploaded,
    skipped: alreadyIngested,
    failed,
    durationMs: Date.now() - startTime,
  };

  console.log(`\n  [${folder}] Complete:`);
  console.log(`    Total:        ${summary.total}`);
  console.log(`    Uploaded:     ${summary.uploaded}`);
  console.log(`    Skipped:      ${summary.skipped} (already ingested)`);
  console.log(`    Failed:       ${summary.failed}`);
  console.log(`    Duration:     ${formatDuration(summary.durationMs)}`);

  return summary;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const config = parseArgs();

  console.log("S3 Upload Script (v2 — DB-checked)");
  console.log("-".repeat(60));
  console.log(`  Bucket:      ${config.bucket}`);
  console.log(`  Region:      ${config.region}`);
  console.log(`  Folders:     ${config.folders.join(", ")}`);
  console.log(`  Concurrency: ${config.concurrency}`);
  console.log(`  Dry run:     ${config.dryRun}`);
  console.log(`  Verify only: ${config.verifyOnly}`);
  console.log(`  Check:       DB ingestion_records`);
  console.log("-".repeat(60));

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Verify DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("  DB connection verified");
  } catch (err: any) {
    console.error(`  Failed to connect to DB: ${err.message}`);
    console.error("  Check your DATABASE_URL environment variable.");
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }

  let s3: S3Client | undefined;

  if (!config.dryRun && !config.verifyOnly) {
    s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Quick validation: try listing bucket
    try {
      await s3.send(
        new ListObjectsV2Command({
          Bucket: config.bucket,
          MaxKeys: 1,
        }),
      );
      console.log("  S3 connection verified");
    } catch (err: any) {
      console.error(`  Failed to connect to S3: ${err.message}`);
      console.error("  Check your AWS credentials and bucket name.");
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  const summaries: FolderSummary[] = [];

  for (const folder of config.folders) {
    const summary = await uploadFolder(s3!, prisma, config, folder);
    summaries.push(summary);
  }

  // Print grand summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(
    config.dryRun
      ? "DRY RUN SUMMARY"
      : config.verifyOnly
        ? "VERIFICATION SUMMARY"
        : "UPLOAD SUMMARY",
  );
  console.log("=".repeat(60));

  let grandTotal = 0;
  let grandUploaded = 0;
  let grandSkipped = 0;
  let grandFailed = 0;

  for (const s of summaries) {
    console.log(`\n  ${s.folder}/`);
    console.log(`    Total:    ${s.total}`);
    console.log(`    Uploaded: ${s.uploaded}`);
    console.log(`    Skipped:  ${s.skipped}`);
    console.log(`    Failed:   ${s.failed}`);
    console.log(`    Duration: ${formatDuration(s.durationMs)}`);
    grandTotal += s.total;
    grandUploaded += s.uploaded;
    grandSkipped += s.skipped;
    grandFailed += s.failed;
  }

  if (summaries.length > 1) {
    console.log(`\n  Grand Total:`);
    console.log(`    Files:    ${grandTotal}`);
    console.log(`    Uploaded: ${grandUploaded}`);
    console.log(`    Skipped:  ${grandSkipped}`);
    console.log(`    Failed:   ${grandFailed}`);
  }

  console.log("");

  await prisma.$disconnect();
  await pool.end();

  if (grandFailed > 0) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
