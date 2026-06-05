import type { ClientBase } from "pg";
import { getProfile } from "./profiles";

export interface Candidate {
  officialId: string;
  name: string;
  missing: string[];
}

/**
 * Officials with at least one blank target field, ranked by lowest completeness first.
 * Read-only; the agent runs this as enrichment_agent to choose its next work.
 */
export async function findCandidates(client: ClientBase, limit = 50): Promise<Candidate[]> {
  const fields = getProfile("officials").targetFields;
  // Per-field blank test works for text and non-text columns.
  const blankExpr = (f: string) => `("${f}" IS NULL OR ("${f}")::text = '')`;
  const missingArray = fields
    .map((f) => `CASE WHEN ${blankExpr(f)} THEN '${f}' END`)
    .join(", ");
  const anyBlank = fields.map(blankExpr).join(" OR ");

  const sql = `
    SELECT id, name,
      ARRAY_REMOVE(ARRAY[${missingArray}], NULL) AS missing
    FROM nigerian_officials
    WHERE ${anyBlank}
    ORDER BY completeness_score ASC NULLS FIRST, created_at ASC
    LIMIT $1`;
  const res = await client.query(sql, [limit]);
  return res.rows.map((r) => ({ officialId: r.id, name: r.name, missing: r.missing as string[] }));
}
