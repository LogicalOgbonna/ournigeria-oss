// #!/usr/bin/env npx tsx
// /**
//  * fix-corruption-metadata.ts
//  *
//  * Targeted fix for corruption vector metadata without re-running the full pipeline.
//  * Re-extracts status and amount from S3 source files using the fixed extractors,
//  * then patches only the rows that have wrong values.
//  *
//  * Usage:
//  *   npx tsx apps/ingest/src/scripts/fix-corruption-metadata.ts [--dry-run] [--official "Name"]
//  *
//  * Requires: apps/ingest/src/scripts/.env (DATABASE_URL, AWS credentials)
//  */

// import { config } from "dotenv";
// import { resolve, dirname } from "node:path";
// import { fileURLToPath } from "node:url";

// const __dirname = dirname(fileURLToPath(import.meta.url));
// config({ path: resolve(__dirname, "../../scripts/.env") });
// // Also try the co-located .env
// config({ path: resolve(__dirname, ".env") });
// import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
// import * as pg from "pg";

// // Import the FIXED extractors
// import {
//   extractStatus,
//   extractTotalAmountAlleged,
//   extractAgency,
//   extractProfile,
//   buildSummaryChunkText,
//   type CaseStatus,
//   type ParsedAmount,
//   type OfficialProfile,
// } from "../pipeline/corruption-extractors";

// // ─── Config ──────────────────────────────────────────────────────

// const DATABASE_URL = process.env.DATABASE_URL;
// const S3_BUCKET = process.env.S3_BUCKET || "ournigeria-documents";
// const AWS_REGION = process.env.AWS_REGION || "eu-west-1";

// if (!DATABASE_URL) {
//   console.error("DATABASE_URL is required in .env");
//   process.exit(1);
// }

// const args = process.argv.slice(2);
// const DRY_RUN = args.includes("--dry-run");
// const officialIdx = args.indexOf("--official");
// const SINGLE_OFFICIAL = officialIdx !== -1 ? args[officialIdx + 1] : null;

// const s3 = new S3Client({ region: AWS_REGION });

// // ─── S3 Helpers ──────────────────────────────────────────────────

// async function downloadS3String(key: string): Promise<string | null> {
//   try {
//     const resp = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
//     return await resp.Body!.transformToString("utf-8");
//   } catch {
//     return null;
//   }
// }

// async function listOfficialDirs(): Promise<string[]> {
//   const dirs = new Set<string>();
//   let token: string | undefined;
//   do {
//     const resp = await s3.send(
//       new ListObjectsV2Command({
//         Bucket: S3_BUCKET,
//         Prefix: "corruption/",
//         Delimiter: "/",
//         ContinuationToken: token,
//       }),
//     );
//     for (const prefix of resp.CommonPrefixes ?? []) {
//       const dir = prefix.Prefix?.replace("corruption/", "").replace("/", "");
//       if (dir && dir !== "INDEX.md") dirs.add(dir);
//     }
//     token = resp.NextContinuationToken;
//   } while (token);
//   return Array.from(dirs).sort();
// }

// // ─── Database Helpers ────────────────────────────────────────────

// async function findCorruptionTable(pool: pg.Pool): Promise<string | null> {
//   // Mastra PgVector tables have an 'embedding' column. Find ones with corruption data.
//   const result = await pool.query<{ table_name: string }>(`
//     SELECT DISTINCT c.table_name
//     FROM information_schema.columns c
//     WHERE c.column_name = 'embedding'
//       AND c.table_schema = 'public'
//     ORDER BY c.table_name
//   `);

//   for (const row of result.rows) {
//     // Check if this table has corruption data (section=summary, official metadata)
//     const check = await pool.query(
//       `SELECT 1 FROM "${row.table_name}" WHERE metadata->>'section' = 'summary' AND metadata->>'official' IS NOT NULL LIMIT 1`,
//     );
//     if (check.rowCount && check.rowCount > 0) {
//       return row.table_name;
//     }
//   }
//   return null;
// }

// interface StoredRow {
//   id: string;
//   metadata: Record<string, unknown>;
//   content: string;
// }

// // ─── Main ────────────────────────────────────────────────────────

// async function main() {
//   console.log("=== Fix Corruption Metadata ===");
//   console.log(`Dry run: ${DRY_RUN}`);
//   if (SINGLE_OFFICIAL) console.log(`Targeting: ${SINGLE_OFFICIAL}`);

//   const pool = new pg.Pool({ connectionString: DATABASE_URL });

//   try {
//     // 1. Find the corruption vector table
//     const table = await findCorruptionTable(pool);
//     if (!table) {
//       console.error("Could not find corruption vector table. Check DATABASE_URL.");
//       return;
//     }
//     console.log(`Found corruption table: "${table}"`);

//     // 2. Get current metadata for all officials' summary chunks
//     const summaryRows = await pool.query<StoredRow>(
//       `SELECT id, metadata, metadata->>'text' AS content FROM "${table}" WHERE metadata->>'section' = 'summary' ORDER BY metadata->>'official'`,
//     );
//     console.log(`Found ${summaryRows.rowCount} summary chunks\n`);

//     // 3. List official directories in S3
//     const officialDirs = await listOfficialDirs();
//     console.log(`Found ${officialDirs.length} officials in S3\n`);

//     const fixes: Array<{
//       official: string;
//       oldStatus: string;
//       newStatus: string;
//       oldAmount: number | null;
//       newAmount: number | null;
//       newSummaryText: string;
//     }> = [];

//     // 4. For each official, re-extract metadata from S3 and compare
//     const targetDirs = SINGLE_OFFICIAL
//       ? officialDirs.filter((d) => d === SINGLE_OFFICIAL.replace(/ /g, "_"))
//       : officialDirs;

//     for (const dir of targetDirs) {
//       const official = dir.replace(/_/g, " ");
//       const prefix = `corruption/${dir}`;

//       // Download the key files
//       const [caseOutcome, overview, charges, financial, investigation] =
//         await Promise.all([
//           downloadS3String(`${prefix}/case_outcome.md`),
//           downloadS3String(`${prefix}/overview.md`),
//           downloadS3String(`${prefix}/charges.md`),
//           downloadS3String(`${prefix}/financial_details.md`),
//           downloadS3String(`${prefix}/arrest_and_investigation.md`),
//         ]);

//       // Re-extract with fixed code
//       const combinedStatusText = caseOutcome || overview || "";
//       const newStatus = extractStatus(combinedStatusText);
//       const newProfile = extractProfile(overview || "");
//       const newAgencies = extractAgency(`${overview || ""}\n${investigation || ""}`);
//       const newAmount = extractTotalAmountAlleged(charges, financial);

//       // Find existing summary row
//       const existingRow = summaryRows.rows.find(
//         (r) => r.metadata.official === official,
//       );

//       const oldStatus = (existingRow?.metadata.status as string) ?? "unknown";
//       const oldAmount = (existingRow?.metadata.amount_alleged_ngn as number) ?? null;
//       const newNgnValue = newAmount?.ngnValue ?? null;

//       const statusChanged = oldStatus !== newStatus;
//       // Only update amounts when we have an authoritative new value.
//       // Don't null out existing amounts — keep them until source files
//       // are standardized with "Total Amount Alleged" headers.
//       const amountChanged =
//         newNgnValue !== null &&
//         oldAmount !== newNgnValue;

//       if (statusChanged || amountChanged) {
//         const newSummaryText = buildSummaryChunkText(
//           official,
//           newProfile,
//           newStatus,
//           newAgencies,
//           newAmount,
//         );

//         fixes.push({
//           official,
//           oldStatus,
//           newStatus,
//           oldAmount,
//           newAmount: newNgnValue,
//           newSummaryText,
//         });

//         const statusMsg = statusChanged
//           ? `status: "${oldStatus}" -> "${newStatus}"`
//           : "";
//         const amountMsg = amountChanged
//           ? `amount: ${formatNgn(oldAmount)} -> ${formatNgn(newNgnValue)}`
//           : "";
//         console.log(
//           `  NEEDS FIX: ${official} — ${[statusMsg, amountMsg].filter(Boolean).join(", ")}`,
//         );
//       }
//     }

//     if (fixes.length === 0) {
//       console.log("\nNo metadata discrepancies found.");
//       return;
//     }

//     console.log(`\n${fixes.length} official(s) need fixing.`);

//     if (DRY_RUN) {
//       console.log("\n[DRY RUN] No changes made. Remove --dry-run to apply.");
//       return;
//     }

//     // 5. Apply fixes
//     console.log("\nApplying fixes...");

//     for (const fix of fixes) {
//       const officialName = fix.official;

//       // Update metadata on ALL chunks for this official
//       const metaParts = [`jsonb_build_object('status', $2::text)`];
//       const metaParams: (string | number | null)[] = [officialName, fix.newStatus];

//       if (fix.newAmount !== null) {
//         metaParts.push(`jsonb_build_object('amount_alleged_ngn', $${metaParams.length + 1}::float8)`);
//         metaParams.push(fix.newAmount);
//       }

//       const metaUpdate = await pool.query(
//         `UPDATE "${table}"
//          SET metadata = metadata || ${metaParts.join(" || ")}
//          WHERE metadata->>'official' = $1`,
//         metaParams,
//       );
//       console.log(
//         `  Updated ${metaUpdate.rowCount} chunks for ${officialName} (metadata)`,
//       );

//       // Update the summary chunk's text content (stored in metadata->>'text')
//       const summaryUpdate = await pool.query(
//         `UPDATE "${table}"
//          SET metadata = metadata || jsonb_build_object('text', $2::text)
//          WHERE metadata->>'official' = $1 AND metadata->>'section' = 'summary'`,
//         [officialName, fix.newSummaryText],
//       );
//       console.log(
//         `  Updated ${summaryUpdate.rowCount} summary chunk(s) for ${officialName} (text)`,
//       );
//     }

//     console.log("\nDone. Summary chunk embeddings are slightly stale but functional.");
//     console.log(
//       "The metadata filters (status, amount) are now correct and will be used for retrieval.",
//     );
//     console.log(
//       "Embeddings will be fully refreshed on next pipeline run.",
//     );
//   } finally {
//     await pool.end();
//   }
// }

// function formatNgn(value: number | null): string {
//   if (value === null) return "null";
//   if (value >= 1e12) return `₦${(value / 1e12).toFixed(1)}T`;
//   if (value >= 1e9) return `₦${(value / 1e9).toFixed(1)}B`;
//   if (value >= 1e6) return `₦${(value / 1e6).toFixed(1)}M`;
//   return `₦${value.toLocaleString()}`;
// }

// main().catch((err) => {
//   console.error("Fatal:", err);
//   process.exit(1);
// });
