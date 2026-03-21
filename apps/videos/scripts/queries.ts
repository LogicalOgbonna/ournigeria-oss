/**
 * Database queries for video data.
 * Uses pg directly (same pattern as packages/content/query.ts).
 * Queries budget_chunks summary metadata and other vector tables via raw SQL.
 *
 * Note: budget_summaries table is empty. All budget data lives in budget_chunks
 * vector table as summary chunks with is_summary=true metadata.
 */

import pg from "pg";
import {
  budgetPidgin,
  corruptionPidgin,
  comparisonPidgin,
  faacPidgin,
  impactPidgin,
} from "../src/lib/pidgin-templates";

const SECTOR_COLORS: Record<string, string> = {
  economic: "#d97706",
  "economic sector": "#d97706",
  social: "#059669",
  "social sector": "#059669",
  "social services": "#059669",
  "social services sector": "#059669",
  administration: "#7c3aed",
  "administration sector": "#7c3aed",
  "law and justice": "#e11d48",
  "law and justice sector": "#e11d48",
  education: "#059669",
  health: "#0891b2",
  infrastructure: "#d97706",
  agriculture: "#65a30d",
  other: "#94a3b8",
  environment: "#16a34a",
  housing: "#f59e0b",
  security: "#ef4444",
};

const CHART_COLORS = [
  "#059669", "#0891b2", "#d97706", "#65a30d", "#7c3aed",
  "#e11d48", "#0284c7", "#ea580c", "#4f46e5", "#be185d",
];

function getSectorColor(sector: string, index: number): string {
  const key = sector.toLowerCase();
  return SECTOR_COLORS[key] ?? CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Parse Naira amount from summary text.
 * Handles formats like "₦2,267,976,120,869" and "₦35,047,108,494.66"
 */
function parseNairaFromText(text: string): number | null {
  const match = text.match(/₦([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

/**
 * Extract sector name from summary text.
 * Pattern: "for the [SECTOR] sector in [STATE]"
 * Or overall: "for [STATE] for the year" (no sector)
 */
function parseSectorFromText(text: string): string | null {
  // Match "for the X Sector sector" or "for the X sector"
  const sectorMatch = text.match(/for the (.+?) sector in /i);
  if (sectorMatch) {
    // Remove trailing " Sector" if present (e.g., "Economic Sector sector" → "Economic")
    return sectorMatch[1].replace(/ Sector$/i, "").trim();
  }
  return null;
}

// ─── Budget Query ─────────────────────────────────────────────

export async function queryStateBudget(
  pool: pg.Pool,
  state: string,
  year: number,
) {
  const vectorIndex = process.env.VECTOR_INDEX_BUDGET;
  if (!vectorIndex) {
    console.error("VECTOR_INDEX_BUDGET env var not set");
    return null;
  }

  // Resolve state display name
  const nameResult = await pool.query(
    `SELECT name FROM nigerian_states WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)`,
    [state],
  );
  const stateName = nameResult.rows[0]?.name ?? state;

  // Get summary chunks for this state + year
  const summaryResult = await pool.query(
    `SELECT metadata->>'text' as text
     FROM "${vectorIndex}"
     WHERE metadata->>'is_summary' = 'true'
       AND metadata->>'state' = $1
       AND (metadata->>'year')::int = $2`,
    [stateName, year],
  );

  if (summaryResult.rows.length === 0) {
    // Try with original state string
    const retryResult = await pool.query(
      `SELECT metadata->>'text' as text
       FROM "${vectorIndex}"
       WHERE metadata->>'is_summary' = 'true'
         AND LOWER(metadata->>'state') = LOWER($1)
         AND (metadata->>'year')::int = $2`,
      [state, year],
    );
    if (retryResult.rows.length === 0) return null;
    summaryResult.rows = retryResult.rows;
  }

  // Parse summary chunks into total budget and sector breakdown
  let totalBudget = 0;
  const sectors: { label: string; value: number; color: string }[] = [];

  for (const row of summaryResult.rows) {
    const text: string = row.text || "";
    const amount = parseNairaFromText(text);
    if (!amount) continue;

    const sector = parseSectorFromText(text);
    if (sector) {
      // Sector-level summary — deduplicate by taking the first occurrence
      const existing = sectors.find(
        (s) => s.label.toLowerCase() === sector.toLowerCase(),
      );
      if (!existing) {
        sectors.push({
          label: sector,
          value: amount,
          color: getSectorColor(sector, sectors.length),
        });
      }
    } else if (text.includes("encompasses the entire state budget")) {
      // Overall budget total
      totalBudget = amount;
    }
  }

  if (sectors.length === 0) return null;

  // If no explicit total, sum sectors
  if (totalBudget === 0) {
    totalBudget = sectors.reduce((sum, s) => sum + s.value, 0);
  }

  // Sort by value descending, take top 8
  sectors.sort((a, b) => b.value - a.value);
  const topSectors = sectors.slice(0, 8);
  const otherValue = sectors.slice(8).reduce((sum, s) => sum + s.value, 0);
  if (otherValue > 0) {
    topSectors.push({ label: "Other", value: otherValue, color: "#94a3b8" });
  }

  // Convert to percentages
  const sectorTotal = topSectors.reduce((sum, s) => sum + s.value, 0);
  const sectorPercents = topSectors.map((s) => ({
    label: s.label,
    value: Math.round((s.value / sectorTotal) * 100),
    color: s.color,
  }));

  // Ensure percentages sum to 100
  const percentSum = sectorPercents.reduce((sum, s) => sum + s.value, 0);
  if (percentSum !== 100 && sectorPercents.length > 0) {
    sectorPercents[0].value += 100 - percentSum;
  }

  const topSector = sectorPercents[0];

  return {
    stateName,
    stateCode: state.toLowerCase().replace(/\s+/g, "-"),
    fiscalYear: year,
    totalBudget,
    sectors: sectorPercents,
    topSector: topSector.label,
    topSectorPercent: topSector.value,
    pidginCaption: budgetPidgin(
      stateName,
      year,
      totalBudget,
      topSector.label,
      topSector.value,
    ),
  };
}

// ─── Corruption Query ─────────────────────────────────────────

export async function queryCorruptionCase(
  pool: pg.Pool,
  state?: string,
) {
  const vectorIndex = process.env.VECTOR_INDEX_CORRUPTION;
  if (!vectorIndex) {
    console.error("VECTOR_INDEX_CORRUPTION env var not set");
    return null;
  }

  let query: string;
  let params: (string | number)[];

  if (state) {
    query = `SELECT
        metadata->>'official' as official,
        metadata->>'agency' as agency,
        metadata->>'amount_alleged_ngn' as amount,
        metadata->>'status' as status,
        metadata->>'state' as state,
        metadata->>'text' as details
      FROM "${vectorIndex}"
      WHERE LOWER(metadata->>'state') = LOWER($1)
        AND metadata->>'official' IS NOT NULL
        AND metadata->>'amount_alleged_ngn' IS NOT NULL
      ORDER BY (metadata->>'amount_alleged_ngn')::numeric DESC NULLS LAST
      LIMIT 1`;
    params = [state];
  } else {
    query = `SELECT
        metadata->>'official' as official,
        metadata->>'agency' as agency,
        metadata->>'amount_alleged_ngn' as amount,
        metadata->>'status' as status,
        metadata->>'state' as state,
        metadata->>'text' as details
      FROM "${vectorIndex}"
      WHERE metadata->>'official' IS NOT NULL
        AND metadata->>'amount_alleged_ngn' IS NOT NULL
      ORDER BY (metadata->>'amount_alleged_ngn')::numeric DESC NULLS LAST
      LIMIT 1`;
    params = [];
  }

  const result = await pool.query(query, params);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const amount = parseFloat(row.amount) || 0;
  const status = row.status || "unknown";

  return {
    officialName: row.official || "Unknown Official",
    agency: row.agency || "N/A",
    amountAlleged: amount,
    status,
    state: row.state || "Federal",
    details: (row.details || "").slice(0, 300),
    pidginCaption: corruptionPidgin(row.official || "Official", amount, status),
  };
}

// ─── FAAC Query ───────────────────────────────────────────────

export async function queryFaacAllocation(
  pool: pg.Pool,
  state: string,
  year: number,
) {
  const vectorIndex = process.env.VECTOR_INDEX_FAAC;
  if (!vectorIndex) {
    console.error("VECTOR_INDEX_FAAC env var not set");
    return null;
  }

  const query = `SELECT
      metadata->>'month' as month,
      metadata->>'total_allocation' as allocation,
      metadata->>'state' as state
    FROM "${vectorIndex}"
    WHERE LOWER(metadata->>'state') = LOWER($1)
      AND (metadata->>'year')::int = $2
      AND metadata->>'total_allocation' IS NOT NULL
    ORDER BY metadata->>'month'`;

  const result = await pool.query(query, [state, year]);
  if (result.rows.length === 0) return null;

  const monthlyData = result.rows.map((row: { month: string; allocation: string }) => ({
    month: row.month || "Unknown",
    amount: parseFloat(row.allocation) || 0,
  }));

  const totalAllocation = monthlyData.reduce(
    (sum: number, m: { amount: number }) => sum + m.amount,
    0,
  );

  // Get state display name
  const nameResult = await pool.query(
    `SELECT name FROM nigerian_states WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)`,
    [state],
  );
  const stateName = nameResult.rows[0]?.name ?? state;

  return {
    stateName,
    fiscalYear: year,
    totalAllocation,
    monthlyData,
    pidginCaption: faacPidgin(stateName, year, totalAllocation),
  };
}

// ─── State Comparison Query ───────────────────────────────────

export async function queryStateComparison(
  pool: pg.Pool,
  state1: string,
  state2: string,
  year: number,
) {
  const data1 = await queryStateBudget(pool, state1, year);
  const data2 = await queryStateBudget(pool, state2, year);

  if (!data1 || !data2) return null;

  const bigger = data1.totalBudget > data2.totalBudget ? data1 : data2;

  return {
    state1Name: data1.stateName,
    state2Name: data2.stateName,
    fiscalYear: year,
    state1TotalBudget: data1.totalBudget,
    state2TotalBudget: data2.totalBudget,
    state1Sectors: data1.sectors.slice(0, 5),
    state2Sectors: data2.sectors.slice(0, 5),
    state1TopSector: data1.topSector,
    state2TopSector: data2.topSector,
    pidginCaption: comparisonPidgin(
      data1.stateName,
      data2.stateName,
      "overall",
      data1.totalBudget,
      data2.totalBudget,
    ),
  };
}

// ─── Money Could Buy Query ────────────────────────────────────

export async function queryMoneyCouldBuy(
  pool: pg.Pool,
  state: string,
  year: number,
) {
  const data = await queryStateBudget(pool, state, year);
  if (!data) return null;

  // Use the top sector's actual amount (approximate from percentage)
  const topSectorAmount = Math.round(
    data.totalBudget * (data.topSectorPercent / 100),
  );

  return {
    stateName: data.stateName,
    fiscalYear: year,
    amount: topSectorAmount,
    context: `${data.topSector} Budget`,
    pidginCaption: impactPidgin(
      topSectorAmount,
      "primary schools",
      Math.floor(topSectorAmount / 20_000_000),
    ),
  };
}
