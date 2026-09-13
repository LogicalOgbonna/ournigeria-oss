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
 *   3. Strips DROPs of PROTECTED_ARTIFACTS (SQL-only objects Prisma can't see)
 *   4. Refuses to auto-apply any remaining destructive op without --allow-destructive
 *   5. Creates a timestamped migration directory with the SQL
 *   6. Applies the SQL to the dev database
 *   7. Marks the migration as applied in _prisma_migrations
 *
 * Why not `prisma migrate dev`?
 *   The database has non-Prisma tables (budget_chunks, corruption_chunks,
 *   govspend_chunks) managed by Mastra PgVector. `migrate dev` detects them
 *   as drift and demands a reset. This script bypasses that.
 *
 * Why steps 3 and 4 exist:
 *   `migrate diff` compares the DB against the Prisma schema, so anything the
 *   schema language cannot express looks like drift to be deleted. Partial
 *   (`WHERE ...`) unique indexes, expression indexes and columns declared only
 *   in migration SQL are all emitted as DROPs — and step 6 used to apply them
 *   without anyone reading the SQL. That silently removed
 *   `uq_role_assignment_active` (RBAC: one active grant per principal) and the
 *   five `uq_population_*_year` uniques. CHECK constraints and VIEWs are
 *   invisible to the diff and are therefore safe.
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

/**
 * Database objects that live ONLY in migration SQL because Prisma's schema
 * language cannot express them. `migrate diff` reads their absence from the
 * schema as drift and emits a DROP for each one.
 *
 * Adding an entry is a reviewed change, like the permission catalog: if you
 * hand-write a partial unique index or an expression index in a migration, add
 * its name here in the same PR, or the next migration anyone generates will
 * delete it.
 */
const PROTECTED_ARTIFACTS = [
  // RBAC — one active role assignment per (principal, role). 20260902100000_rbac_audit_chain
  "uq_role_assignment_active",
  // Population time series — one row per place per year. 20260904021736_population_scoped_by_level
  "uq_population_national_year",
  "uq_population_zone_year",
  "uq_population_state_year",
  "uq_population_lga_year",
  "uq_population_ward_year",
  // Socials — partial index on discovered tweets
  "idx_socials_discovered_tweet_source",
  // Campaigns — one ticket per (race, party, faction), NULLS NOT DISTINCT; and one
  // active council seat per (campaign, official, role). 20260907024312_campaigns_ticket_council_documents_media
  "uq_campaigns_race_party_faction",
  "uq_campaign_council_active_official",
  // Campaigns — one ticket per rank within a race (partial, NULLS NOT DISTINCT). 20260907130000_campaigns_display_order_unique
  "uq_campaigns_race_display_order",
  // Campaigns — review queue partial index. 20260908090000_campaigns_draft_review
  "idx_campaigns_review_queue",
  // Campaigns — one media row per single-slot type per ticket (partial: the
  // append types banner/photo are exempt). 20260908090200_campaign_media_slot_unique
  "uq_campaign_media_slot",
  // Elections — one event per (office, year, round, scope arc), NULLS NOT
  // DISTINCT; and the gate query's partial index. 20260912014235_add_elections
  "uq_elections_event",
  "idx_elections_gate",
];

/** SQL verbs that destroy data or invariants. Never auto-applied unreviewed. */
const DESTRUCTIVE_RE =
  /\b(DROP\s+(TABLE|COLUMN|INDEX|CONSTRAINT|VIEW|TYPE|SCHEMA)|TRUNCATE)\b/i;

/**
 * Split SQL into blocks of "leading comment lines + one statement". Prisma
 * emits `-- DropIndex\nDROP INDEX "x";`, and a statement can span lines
 * (`ALTER TABLE t DROP COLUMN a,\nDROP COLUMN b;`), so neither a per-line nor a
 * naive split(";") pass is enough.
 */
export function splitStatements(sql: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of sql.split("\n")) {
    // A blank line only separates blocks when we are not mid-statement.
    const midStatement = current.some((l) => l.trim() && !l.trim().startsWith("--"));
    if (!line.trim() && !midStatement) {
      if (current.length) blocks.push(current.join("\n"));
      current = [];
      continue;
    }
    current.push(line);
    if (line.trimEnd().endsWith(";")) {
      blocks.push(current.join("\n"));
      current = [];
    }
  }
  if (current.length) blocks.push(current.join("\n"));
  return blocks.filter((b) => b.trim());
}

/**
 * Remove statements that DROP a PROTECTED_ARTIFACT. Returns the surviving SQL
 * and the names that were rescued, so the caller can report them.
 */
export function stripProtectedDrops(sql: string): { sql: string; kept: string[] } {
  const kept: string[] = [];
  const surviving = splitStatements(sql).filter((block) => {
    if (!DESTRUCTIVE_RE.test(block)) return true;
    const hit = PROTECTED_ARTIFACTS.find((name) => block.includes(`"${name}"`));
    if (!hit) return true;
    kept.push(hit);
    return false;
  });
  return {
    sql: surviving.join("\n\n").replace(/\n{3,}/g, "\n\n").trim(),
    kept,
  };
}

/** Every statement that would destroy an object, for the pre-apply guard. */
export function findDestructiveOps(sql: string): string[] {
  return splitStatements(sql)
    .filter((b) => DESTRUCTIVE_RE.test(b))
    .map((b) =>
      b
        .split("\n")
        .filter((l) => l.trim() && !l.trim().startsWith("--"))
        .join(" ")
        .trim(),
    );
}

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

export function filterChunkTableOps(sql: string): string {
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

function main(): void {

  const args = process.argv.slice(2);
  const allowDestructive = args.includes("--allow-destructive");
  const name = args.find((a) => !a.startsWith("--"));
  if (!name) {
    console.error("Usage: npx tsx scripts/create-migration.ts <migration-name> [--allow-destructive]");
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

  const { sql, kept } = stripProtectedDrops(filterChunkTableOps(rawSql));

  for (const artifact of kept) {
    console.log(`KEPT (protected): ${artifact} — SQL-only object, DROP removed from the diff`);
  }

  if (!sql || sql === "--" || sql.replace(/--[^\n]*/g, "").trim() === "") {
    console.log("No schema changes detected. Nothing to migrate.");
    process.exit(0);
  }

  const destructive = findDestructiveOps(sql);
  if (destructive.length && !allowDestructive) {
    console.error(`\nRefusing to auto-apply ${destructive.length} destructive operation(s):\n`);
    for (const op of destructive) console.error(`  ${op}`);
    console.error(
      "\nThese were NOT written or applied. `migrate diff` deletes anything the Prisma\n" +
        "schema cannot express, so a DROP here is as likely to be a hand-written index,\n" +
        "constraint or column as it is a real change.\n\n" +
        "Read every line above. Then either:\n" +
        "  - add the object's name to PROTECTED_ARTIFACTS in this script (if it should survive), or\n" +
        "  - re-run with --allow-destructive (if the drops are genuinely intended).",
    );
    process.exit(1);
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
}

// Only run when invoked directly — the guard helpers above are imported by tests.
if (require.main === module) {
  main();
}
