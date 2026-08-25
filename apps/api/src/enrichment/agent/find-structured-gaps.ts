import type { ClientBase } from "pg";
import { CATEGORIES, type CategorySpec } from "./categories";

export interface StructuredGap {
  officialId: string;
  name: string;
  slug: string | null;
  officialType: string | null;
  category: string;
  /** profile domain — Hermes uses this to load the right corroboration rules */
  domain: string;
  completeness: number | null;
}

/**
 * The next batch of (official, category) work items for the autonomous sweeper.
 * Read-only; the agent runs this as enrichment_agent.
 *
 * A gap is eligible when, for that (official, category):
 *  - the category applies to the official's type (political ones → elected/null),
 *  - there is NO pending change_proposal for it,
 *  - there is no attempt yet OR the attempt is not pending AND its re-check timer
 *    has elapsed (enrichment_attempts.next_eligible_at <= now), and
 *  - for FILLABLE categories only, the official has zero rows in that table.
 *
 * Worst-completeness officials first. One query per category (≤12, all indexed),
 * merged and ranked in memory — cheap, and keeps each category's gap rule simple.
 */
export async function findStructuredGaps(
  client: ClientBase,
  limit = 20,
): Promise<StructuredGap[]> {
  const all: StructuredGap[] = [];

  for (const cat of CATEGORIES) {
    const rows = await queryCategory(client, cat, limit);
    all.push(...rows);
  }

  // Global ranking: worst profiles first, stable by official id.
  all.sort((a, b) => {
    const ca = a.completeness ?? -1;
    const cb = b.completeness ?? -1;
    if (ca !== cb) return ca - cb;
    return a.officialId < b.officialId ? -1 : a.officialId > b.officialId ? 1 : 0;
  });

  return all.slice(0, limit);
}

async function queryCategory(
  client: ClientBase,
  cat: CategorySpec,
  limit: number,
): Promise<StructuredGap[]> {
  const electedClause = cat.electedOnly
    ? `AND (o.official_type IS NULL OR o.official_type = 'elected')`
    : "";

  // FILLABLE: only officials with zero rows in the target table.
  const zeroRowClause =
    cat.kind === "fillable"
      ? `AND NOT EXISTS (SELECT 1 FROM "${cat.table}" t WHERE t.official_id = o.id)`
      : "";

  const sql = `
    SELECT o.id, o.name, o.slug, o.official_type, o.completeness_score
    FROM nigerian_officials o
    LEFT JOIN enrichment_attempts ea
      ON ea.official_id = o.id AND ea.category = $1
    WHERE TRUE
      ${electedClause}
      -- Office-holder guard (plan 60 §5.3): election candidates (type NULL, at
      -- most 'contesting' positions) are NOT swept — autonomous enrichment of
      -- ~1.8k unknowns would burn the LLM budget on people who may never hold
      -- office. They re-enter naturally when a position flips to 'active'.
      AND (o.official_type IS NOT NULL OR EXISTS (
        SELECT 1 FROM official_positions op
        WHERE op.official_id = o.id AND op.status <> 'contesting'
      ))
      AND (ea.id IS NULL OR (ea.status <> 'pending' AND ea.next_eligible_at <= now()))
      AND NOT EXISTS (
        SELECT 1 FROM change_proposals cp
        WHERE cp.target_table = $2
          AND cp.status IN ('pending', 'needs_human')
          AND (cp.proposed_value->>'officialId') = o.id::text
      )
      ${zeroRowClause}
    ORDER BY o.completeness_score ASC NULLS FIRST, o.created_at ASC
    LIMIT $3`;

  const res = await client.query(sql, [cat.category, cat.table, limit]);
  return res.rows.map((r) => ({
    officialId: r.id,
    name: r.name,
    slug: r.slug,
    officialType: r.official_type,
    category: cat.category,
    domain: cat.domain,
    completeness: r.completeness_score === null ? null : Number(r.completeness_score),
  }));
}
