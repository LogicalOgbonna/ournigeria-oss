#!/usr/bin/env npx tsx
/**
 * OurNigeria Content Query Tool
 *
 * Pulls raw budget/corruption/FAAC/govspend data directly from PostgreSQL.
 * Outputs structured data to console for interactive content creation with Claude.
 *
 * Usage:
 *   npx tsx packages/content/query.ts --state Lagos --year 2024 --type budget
 *   npx tsx packages/content/query.ts --state Delta --type corruption
 *   npx tsx packages/content/query.ts --state Bayelsa --year 2024 --type faac
 *   npx tsx packages/content/query.ts --type govspend --year 2024 --limit 20
 *
 * Options:
 *   --state   Nigerian state name (e.g., Lagos, Kano, FCT)
 *   --year    Fiscal year (e.g., 2024)
 *   --type    Data type: budget|corruption|faac|govspend
 *   --limit   Max results from vector tables (default: 15)
 */

import pg from "pg";

const { Pool } = pg;

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

const STATE = args.includes("--state") ? getArg("state") : undefined;
const YEAR = args.includes("--year") ? parseInt(getArg("year"), 10) : undefined;
const TYPE = getArg("type");
const LIMIT = parseInt(getArg("limit", "15"), 10);

// ─── DB Connection ───────────────────────────────────────────────

function createPool(): pg.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "Missing DATABASE_URL. Run with: infisical run --env dev -- npx tsx query.ts",
    );
    process.exit(1);
  }
  return new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

// ─── Formatters ──────────────────────────────────────────────────

function formatNaira(value: number | bigint | string | null): string {
  if (value === null || value === undefined) return "N/A";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return String(value);
  if (num >= 1_000_000_000_000) return `₦${(num / 1_000_000_000_000).toFixed(2)} trillion`;
  if (num >= 1_000_000_000) return `₦${(num / 1_000_000_000).toFixed(2)} billion`;
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(2)} million`;
  return `₦${num.toLocaleString()}`;
}

function hr(): string {
  return "─".repeat(60);
}

// ─── Query: Budget ───────────────────────────────────────────────

async function queryBudget(pool: pg.Pool): Promise<void> {
  if (!STATE) {
    console.error("--state is required for budget queries");
    process.exit(1);
  }

  console.log(`\n${hr()}`);
  console.log(`📊 BUDGET DATA: ${STATE}${YEAR ? ` (${YEAR})` : ""}`);
  console.log(hr());

  // 1. Budget summaries
  const summaryQuery = YEAR
    ? `SELECT state_code, fiscal_year, total_budget, allocations, population_estimate
       FROM budget_summaries WHERE state_code = $1 AND fiscal_year = $2`
    : `SELECT state_code, fiscal_year, total_budget, allocations, population_estimate
       FROM budget_summaries WHERE state_code = $1 ORDER BY fiscal_year DESC`;

  const summaryParams = YEAR ? [STATE, YEAR] : [STATE];
  const summaries = await pool.query(summaryQuery, summaryParams);

  if (summaries.rows.length === 0) {
    // Try case-insensitive match on nigerian_states
    const stateMatch = await pool.query(
      `SELECT code, name FROM nigerian_states WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)`,
      [STATE],
    );
    if (stateMatch.rows.length > 0) {
      const code = stateMatch.rows[0].code;
      const retryQuery = YEAR
        ? `SELECT state_code, fiscal_year, total_budget, allocations, population_estimate
           FROM budget_summaries WHERE state_code = $1 AND fiscal_year = $2`
        : `SELECT state_code, fiscal_year, total_budget, allocations, population_estimate
           FROM budget_summaries WHERE state_code = $1 ORDER BY fiscal_year DESC`;
      const retryParams = YEAR ? [code, YEAR] : [code];
      const retry = await pool.query(retryQuery, retryParams);
      if (retry.rows.length > 0) {
        summaries.rows = retry.rows;
      }
    }
  }

  if (summaries.rows.length === 0) {
    console.log(`\n⚠ No budget summaries found for "${STATE}".`);
    const available = await pool.query(
      `SELECT DISTINCT state_code, fiscal_year FROM budget_summaries ORDER BY state_code, fiscal_year`,
    );
    const states = [...new Set(available.rows.map((r: { state_code: string }) => r.state_code))];
    console.log(`Available states: ${states.join(", ")}`);
  } else {
    for (const row of summaries.rows) {
      console.log(`\n## ${row.state_code} — ${row.fiscal_year}`);
      console.log(`Total Budget: ${formatNaira(row.total_budget)}`);
      if (row.population_estimate) {
        console.log(`Population: ${Number(row.population_estimate).toLocaleString()}`);
        const perCapita = Number(row.total_budget) / Number(row.population_estimate);
        console.log(`Per Capita: ${formatNaira(perCapita)}`);
      }
      if (row.allocations && typeof row.allocations === "object") {
        console.log(`\nAllocations:`);
        const allocs = row.allocations as Record<string, unknown>;
        for (const [key, val] of Object.entries(allocs)) {
          if (typeof val === "number" || typeof val === "string") {
            console.log(`  ${key}: ${formatNaira(val)}`);
          } else if (typeof val === "object" && val !== null) {
            console.log(`  ${key}:`);
            for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
              console.log(`    ${subKey}: ${typeof subVal === "number" ? formatNaira(subVal) : subVal}`);
            }
          }
        }
      }
    }
  }

  // 2. Vector chunk details
  const vectorIndex = process.env.VECTOR_INDEX_BUDGET;
  if (vectorIndex) {
    console.log(`\n${hr()}`);
    console.log("📄 BUDGET DOCUMENT CHUNKS");
    console.log(hr());

    const chunkQuery = YEAR
      ? `SELECT metadata->>'text' as text, metadata->>'sector' as sector,
                metadata->>'budget_category' as category, metadata->>'is_summary' as is_summary
         FROM "${vectorIndex}"
         WHERE metadata->>'state' = $1 AND (metadata->>'year')::int = $2
         ORDER BY metadata->>'sector'
         LIMIT $3`
      : `SELECT metadata->>'text' as text, metadata->>'sector' as sector,
                metadata->>'budget_category' as category, metadata->>'year' as year
         FROM "${vectorIndex}"
         WHERE metadata->>'state' = $1
         ORDER BY metadata->>'year' DESC, metadata->>'sector'
         LIMIT $2`;

    const chunkParams = YEAR ? [STATE, YEAR, LIMIT] : [STATE, LIMIT];

    try {
      const chunks = await pool.query(chunkQuery, chunkParams);
      if (chunks.rows.length === 0) {
        // Try Title Case
        const titleState = STATE.charAt(0).toUpperCase() + STATE.slice(1).toLowerCase();
        const retryParams = YEAR ? [titleState, YEAR, LIMIT] : [titleState, LIMIT];
        const retry = await pool.query(chunkQuery, retryParams);
        chunks.rows = retry.rows;
      }

      console.log(`Found ${chunks.rows.length} chunks\n`);
      for (const row of chunks.rows) {
        const tags = [row.sector, row.category, row.year, row.is_summary === "true" ? "SUMMARY" : null]
          .filter(Boolean)
          .join(" | ");
        if (tags) console.log(`[${tags}]`);
        console.log(row.text?.slice(0, 300));
        console.log();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`⚠ Could not query vector table "${vectorIndex}": ${msg}`);
    }
  }
}

// ─── Query: Corruption ───────────────────────────────────────────

async function queryCorruption(pool: pg.Pool): Promise<void> {
  const vectorIndex = process.env.VECTOR_INDEX_CORRUPTION;
  if (!vectorIndex) {
    console.error("VECTOR_INDEX_CORRUPTION env var not set");
    process.exit(1);
  }

  console.log(`\n${hr()}`);
  console.log(`🔍 CORRUPTION DATA${STATE ? `: ${STATE}` : ""}`);
  console.log(hr());

  let query: string;
  let params: (string | number)[];

  if (STATE) {
    query = `SELECT metadata->>'text' as text, metadata->>'official' as official,
                    metadata->>'amount_alleged_ngn' as amount, metadata->>'status' as status,
                    metadata->>'state' as state, metadata->>'section' as section
             FROM "${vectorIndex}"
             WHERE LOWER(metadata->>'state') = LOWER($1)
             LIMIT $2`;
    params = [STATE, LIMIT];
  } else {
    query = `SELECT metadata->>'text' as text, metadata->>'official' as official,
                    metadata->>'amount_alleged_ngn' as amount, metadata->>'status' as status,
                    metadata->>'state' as state, metadata->>'section' as section
             FROM "${vectorIndex}"
             LIMIT $1`;
    params = [LIMIT];
  }

  try {
    const result = await pool.query(query, params);
    console.log(`Found ${result.rows.length} chunks\n`);
    for (const row of result.rows) {
      const tags = [row.official, row.state, row.status, row.amount ? formatNaira(row.amount) : null]
        .filter(Boolean)
        .join(" | ");
      if (tags) console.log(`[${tags}]`);
      console.log(row.text?.slice(0, 400));
      console.log();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error querying "${vectorIndex}": ${msg}`);
  }
}

// ─── Query: FAAC ─────────────────────────────────────────────────

async function queryFaac(pool: pg.Pool): Promise<void> {
  const vectorIndex = process.env.VECTOR_INDEX_FAAC;
  if (!vectorIndex) {
    console.error("VECTOR_INDEX_FAAC env var not set");
    process.exit(1);
  }

  console.log(`\n${hr()}`);
  console.log(`💰 FAAC DATA${STATE ? `: ${STATE}` : ""}${YEAR ? ` (${YEAR})` : ""}`);
  console.log(hr());

  let query: string;
  let params: (string | number)[];

  if (STATE && YEAR) {
    query = `SELECT metadata->>'text' as text, metadata->>'state' as state,
                    metadata->>'total_allocation' as allocation, metadata->>'chunk_type' as type,
                    metadata->>'month' as month, metadata->>'year' as year
             FROM "${vectorIndex}"
             WHERE LOWER(metadata->>'state') = LOWER($1) AND (metadata->>'year')::int = $2
             ORDER BY metadata->>'month'
             LIMIT $3`;
    params = [STATE, YEAR, LIMIT];
  } else if (STATE) {
    query = `SELECT metadata->>'text' as text, metadata->>'state' as state,
                    metadata->>'total_allocation' as allocation, metadata->>'chunk_type' as type,
                    metadata->>'year' as year
             FROM "${vectorIndex}"
             WHERE LOWER(metadata->>'state') = LOWER($1)
             ORDER BY (metadata->>'year')::int DESC
             LIMIT $2`;
    params = [STATE, LIMIT];
  } else {
    query = `SELECT metadata->>'text' as text, metadata->>'state' as state,
                    metadata->>'total_allocation' as allocation, metadata->>'chunk_type' as type
             FROM "${vectorIndex}"
             LIMIT $1`;
    params = [LIMIT];
  }

  try {
    const result = await pool.query(query, params);
    console.log(`Found ${result.rows.length} chunks\n`);
    for (const row of result.rows) {
      const tags = [row.state, row.year, row.month, row.type, row.allocation ? formatNaira(row.allocation) : null]
        .filter(Boolean)
        .join(" | ");
      if (tags) console.log(`[${tags}]`);
      console.log(row.text?.slice(0, 400));
      console.log();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error querying "${vectorIndex}": ${msg}`);
  }
}

// ─── Query: GovSpend ─────────────────────────────────────────────

async function queryGovspend(pool: pg.Pool): Promise<void> {
  const vectorIndex = process.env.VECTOR_INDEX_GOVSPEND;
  if (!vectorIndex) {
    console.error("VECTOR_INDEX_GOVSPEND env var not set");
    process.exit(1);
  }

  console.log(`\n${hr()}`);
  console.log(`🏛 GOVSPEND DATA${YEAR ? ` (${YEAR})` : ""}`);
  console.log(hr());

  let query: string;
  let params: (string | number)[];

  if (YEAR) {
    query = `SELECT metadata->>'text' as text, metadata->>'organization' as org,
                    metadata->>'amount' as amount, metadata->>'beneficiary' as beneficiary,
                    metadata->>'description' as description
             FROM "${vectorIndex}"
             WHERE metadata->>'year' = $1
             LIMIT $2`;
    params = [String(YEAR), LIMIT];
  } else {
    query = `SELECT metadata->>'text' as text, metadata->>'organization' as org,
                    metadata->>'amount' as amount, metadata->>'beneficiary' as beneficiary
             FROM "${vectorIndex}"
             LIMIT $1`;
    params = [LIMIT];
  }

  try {
    const result = await pool.query(query, params);
    console.log(`Found ${result.rows.length} chunks\n`);
    for (const row of result.rows) {
      const tags = [row.org, row.beneficiary, row.amount ? formatNaira(row.amount) : null]
        .filter(Boolean)
        .join(" | ");
      if (tags) console.log(`[${tags}]`);
      console.log(row.text?.slice(0, 400));
      console.log();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error querying "${vectorIndex}": ${msg}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const validTypes = ["budget", "corruption", "faac", "govspend"];
  if (!validTypes.includes(TYPE)) {
    console.error(`Invalid --type: "${TYPE}". Must be one of: ${validTypes.join(", ")}`);
    process.exit(1);
  }

  console.log("OurNigeria Content Query Tool");
  console.log(`Type: ${TYPE}${STATE ? `, State: ${STATE}` : ""}${YEAR ? `, Year: ${YEAR}` : ""}`);

  const pool = createPool();

  try {
    // Verify connection
    await pool.query("SELECT 1");

    switch (TYPE) {
      case "budget":
        await queryBudget(pool);
        break;
      case "corruption":
        await queryCorruption(pool);
        break;
      case "faac":
        await queryFaac(pool);
        break;
      case "govspend":
        await queryGovspend(pool);
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Database error: ${msg}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
