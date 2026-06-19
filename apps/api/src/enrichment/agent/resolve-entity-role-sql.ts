import type { ClientBase } from "pg";
import { normalizeEntityRole } from "../entity-role";

/**
 * Resolve a proposal's normalized entity bucket (governor|senator|…|unknown) over a raw `pg`
 * connection — the form the enrichment agent uses on the INSERT path. Mirrors the Prisma-side
 * `resolveEntityRolePrisma`:
 *   - create                     → proposedValue.position.role
 *   - official_positions target  → that position's own role
 *   - nigerian_officials target  → the official's preferred current position role
 *   - anything unresolved        → "unknown"
 *
 * The agent role has SELECT on all tables, so the lookups below are permitted. Never throws.
 */
export async function resolveEntityRoleSql(
  client: ClientBase,
  p: { changeKind: string; targetTable: string; targetPk: string | null; proposedValue: unknown },
): Promise<string> {
  let rawRole: string | null = null;
  try {
    if (p.changeKind === "create") {
      const v = p.proposedValue as { position?: { role?: string } } | null;
      rawRole = v?.position?.role ?? null;
    } else if (p.targetPk && p.targetTable === "official_positions") {
      const r = await client.query(`SELECT role FROM official_positions WHERE id = $1 LIMIT 1`, [p.targetPk]);
      rawRole = r.rows[0]?.role ?? null;
    } else if (p.targetPk && p.targetTable === "nigerian_officials") {
      const r = await client.query(
        `SELECT role FROM official_positions
          WHERE official_id = $1 AND status = 'active'
            AND start_date <= CURRENT_DATE AND (end_date IS NULL OR end_date > CURRENT_DATE)
          ORDER BY start_date DESC LIMIT 1`,
        [p.targetPk],
      );
      rawRole = r.rows[0]?.role ?? null;
    }
  } catch {
    rawRole = null;
  }
  return normalizeEntityRole(rawRole);
}
