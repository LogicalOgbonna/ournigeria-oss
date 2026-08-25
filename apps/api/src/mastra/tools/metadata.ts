import { cache as cacheManager } from "@ournigeria/cache";
import type { BudgetOfficial, BudgetOfficials } from "../../types";
import { getSharedPool } from "../rag/db-pool";
import { getCurrentYear } from "../../lib/constants";

const officialsCache = cacheManager.namespace("meta:officials");

const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  commissioner_of_finance: "Commissioner of Finance",
  house_of_assembly_speaker: "Speaker, House of Assembly",
  appropriation_committee_chair: "Appropriation Committee Chair",
  accountant_general: "Accountant General",
  lga_chairman: "LGA Chairman",
};

/**
 * Look up officials for a given state and budget year.
 *
 * Data flow:
 *   cache check → DB query (official_positions JOIN nigerian_officials) → cache set
 *
 * For current/future years: uses status + date range (derived current).
 * For historical years: queries by date range overlap with the budget year.
 */
export async function getOfficials(
  state: string,
  year: number,
): Promise<BudgetOfficials | null> {
  const cacheKey = `${state}:${year}`;
  const cached = await officialsCache.get<BudgetOfficials>(cacheKey);
  if (cached) return cached;

  try {
    const pool = getSharedPool();

    // Title-case → lowercase code: "Lagos" → "lagos", "Akwa Ibom" → "akwa_ibom"
    const code = state.toLowerCase().replace(/ /g, "_");

    const currentYear = getCurrentYear();
    const isCurrentYear = year >= currentYear;

    // For current/future years: use status-aware current positions
    // For historical years: query by date range overlap with the budget year
    const query = isCurrentYear
      ? `SELECT o.name, pp.acronym AS party, o.image_url, p.role
         FROM official_positions p
         JOIN nigerian_officials o ON o.id = p.official_id
         LEFT JOIN political_parties pp ON pp.acronym = p.party_acronym
         WHERE p.state_code = $1
           AND p.status = 'active'
           AND p.start_date <= CURRENT_DATE
           AND (p.end_date IS NULL OR p.end_date > CURRENT_DATE)
         ORDER BY p.role`
      : `SELECT o.name, pp.acronym AS party, o.image_url, p.role
         FROM official_positions p
         JOIN nigerian_officials o ON o.id = p.official_id
         LEFT JOIN political_parties pp ON pp.acronym = p.party_acronym
         WHERE p.state_code = $1
           AND p.status <> 'contesting'
           AND p.start_date <= $2
           AND (p.end_date IS NULL OR p.end_date >= $3)
         ORDER BY p.role`;

    const params = isCurrentYear
      ? [code]
      : [code, `${year}-12-31`, `${year}-01-01`];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) return null;

    const officials: BudgetOfficial[] = result.rows.map(
      (row: {
        name: string;
        party: string | null;
        image_url: string | null;
        role: string;
      }) => ({
        role: ROLE_LABELS[row.role] ?? row.role,
        name: row.name,
        ...(row.party && { party: row.party }),
        ...(row.image_url && { imageUrl: row.image_url }),
      }),
    );

    const budgetOfficials: BudgetOfficials = {
      state,
      year,
      officials,
    };

    await officialsCache.set(cacheKey, budgetOfficials, 60 * 60 * 1000);
    return budgetOfficials;
  } catch (err) {
    console.warn(
      `[metadata] Failed to fetch officials for ${state} ${year}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function getOfficialsForResults(
  results: Array<{ state: string; year: number }>,
): Promise<BudgetOfficials[]> {
  const seen = new Set<string>();
  const promises: Promise<BudgetOfficials | null>[] = [];

  for (const { state, year } of results) {
    const key = `${state}|${year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    promises.push(getOfficials(state, year));
  }

  const results_ = await Promise.all(promises);
  return results_.filter((o): o is BudgetOfficials => o !== null);
}
