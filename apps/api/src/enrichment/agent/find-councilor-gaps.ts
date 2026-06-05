import type { ClientBase } from "pg";

export interface CouncilorGap {
  wardCode: string;
  wardName: string;
  lgaCode: string;
  lgaName: string;
  stateCode: string;
  stateName: string;
}

/**
 * Wards in a state with NO current councilor, ordered LGA -> ward. Read-only; the
 * agent runs this as enrichment_agent to choose its next ward to research.
 */
export async function findCouncilorGaps(
  client: ClientBase,
  stateCode: string,
  limit = 50,
): Promise<CouncilorGap[]> {
  const sql = `
    SELECT w.code AS ward_code, w.name AS ward_name,
           l.code AS lga_code, l.name AS lga_name,
           s.code AS state_code, s.name AS state_name
    FROM nigerian_wards w
    JOIN nigerian_lgas l   ON w.lga_code = l.code
    JOIN nigerian_states s ON l.state_code = s.code
    WHERE s.code = $1
      AND NOT EXISTS (
        SELECT 1 FROM official_positions p
        WHERE p.ward_code = w.code
          AND p.role = 'councilor'
          AND (p.end_date IS NULL OR p.end_date > now())
      )
    ORDER BY l.name, w.name
    LIMIT $2`;
  const res = await client.query(sql, [stateCode, limit]);
  return res.rows.map((r) => ({
    wardCode: r.ward_code, wardName: r.ward_name,
    lgaCode: r.lga_code, lgaName: r.lga_name,
    stateCode: r.state_code, stateName: r.state_name,
  }));
}
