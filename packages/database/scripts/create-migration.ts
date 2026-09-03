#!/usr/bin/env npx tsx
/**
 * Create a new Prisma migration by diffing the current DB against the schema
 * (the multi-file schema folder at prisma/schema/).
 *
 * Usage:
 *   npx tsx scripts/create-migration.ts <migration-name>
 *   # or via pnpm from repo root:
 *   pnpm prisma:migrate:create <migration-name>
 *
 * What it does:
 *   1. Runs `prisma migrate diff` to generate SQL (current DB → prisma/schema)
 *   2. Filters out operations on Mastra-managed chunk tables
 *   3. Creates a timestamped migration directory with the SQL
 *   4. Applies the SQL to the dev database
 *   5. Marks the migration as applied in _prisma_migrations
 *
 * Why not `prisma migrate dev`?
 *   The database has non-Prisma tables (budget_chunks, corruption_chunks,
 *   govspend_chunks) managed by Mastra PgVector. `migrate dev` detects them
 *   as drift and demands a reset. This script bypasses that.
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Tables managed by Mastra PgVector — never touch via Prisma migrations
const IGNORED_TABLES = [
  "budget_chunks",
  "corruption_chunks",
  "govspend_chunks",
  "faac_chunks",
  // Mastra PgVector index tables (env VECTOR_INDEX_* names)
  "faac_vectors",
  "faac_vectors_qwen",
  "budget_vectors",
  "corruption_vectors",
  "govspend_vectors",
];

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", cwd: join(__dirname, "..") });
}

function runSilent(cmd: string): { stdout: string; ok: boolean } {
  try {
    const stdout = execSync(cmd, {
      encoding: "utf-8",
      cwd: join(__dirname, ".."),
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, ok: true };
  } catch (e: any) {
    return { stdout: e.stdout ?? "", ok: false };
  }
}

function filterChunkTableOps(sql: string): string {
  const lines = sql.split("\n");
  const filtered: string[] = [];
  let skipping = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a block we should skip
    const isChunkOp = IGNORED_TABLES.some(
      (t) =>
        line.includes(`"${t}"`) ||
        line.includes(`'${t}'`) ||
        line.includes(` ${t}`) ||
        line.includes(`"${t}`)
    );

    // Skip comment headers for chunk table operations
    if (
      line.startsWith("-- ") &&
      i + 1 < lines.length &&
      IGNORED_TABLES.some(
        (t) =>
          lines[i + 1].includes(`"${t}"`) || lines[i + 1].includes(` ${t}`)
      )
    ) {
      skipping = true;
      continue;
    }

    if (isChunkOp) {
      skipping = true;
      continue;
    }

    // End skip on next comment header or blank line after a statement
    if (skipping) {
      if (line.startsWith("-- ") || (line.trim() === "" && filtered.length > 0)) {
        skipping = false;
        // Don't skip this line — re-evaluate it
        if (line.startsWith("-- ") && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (IGNORED_TABLES.some((t) => nextLine.includes(`"${t}"`))) {
            skipping = true;
            continue;
          }
        }
      } else {
        continue;
      }
    }

    filtered.push(line);
  }

  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

// ----- Main -----

const name = process.argv[2];
if (!name) {
  console.error("Usage: npx tsx scripts/create-migration.ts <migration-name>");
  console.error("Example: npx tsx scripts/create-migration.ts add_user_avatar");
  process.exit(1);
}

const slug = name.replace(/[^a-z0-9_]/gi, "_").toLowerCase();

console.log("Generating diff (current DB → prisma/schema)...");

const { stdout: rawSql, ok } = runSilent(
  `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --script`
);

if (!ok && !rawSql.trim()) {
  console.error("Failed to generate diff. Is the database running?");
  process.exit(1);
}

const sql = filterChunkTableOps(rawSql);

if (!sql || sql === "--" || sql.replace(/--[^\n]*/g, "").trim() === "") {
  console.log("No schema changes detected. Nothing to migrate.");
  process.exit(0);
}

const dirName = `${timestamp()}_${slug}`;
const migrationsDir = join(__dirname, "..", "prisma", "migrations");
const migrationDir = join(migrationsDir, dirName);
const sqlPath = join(migrationDir, "migration.sql");

mkdirSync(migrationDir, { recursive: true });
writeFileSync(sqlPath, sql + "\n");

console.log(`\nCreated migration: prisma/migrations/${dirName}/migration.sql`);
console.log("---");
console.log(sql);
console.log("---");

// Apply the SQL
console.log("\nApplying migration to database...");
try {
  run(`npx prisma db execute --file ${sqlPath}`);
  console.log("SQL applied successfully.");
} catch (e: any) {
  console.error("Failed to apply SQL:", e.message);
  console.error(`\nThe migration file was created at:\n  prisma/migrations/${dirName}/migration.sql`);
  console.error("You can fix the SQL and apply manually:");
  console.error(`  npx prisma db execute --file prisma/migrations/${dirName}/migration.sql`);
  console.error(`  npx prisma migrate resolve --applied ${dirName}`);
  process.exit(1);
}

// Mark as applied
console.log("Marking migration as applied...");
try {
  run(`npx prisma migrate resolve --applied ${dirName}`);
  console.log(`\nMigration ${dirName} applied and recorded.`);
} catch (e: any) {
  console.error("Failed to mark as applied:", e.message);
  console.error("Run manually:");
  console.error(`  npx prisma migrate resolve --applied ${dirName}`);
  process.exit(1);
}

// Regenerate client
console.log("Regenerating Prisma client...");
run(`npx prisma generate`);
console.log("Done.");
