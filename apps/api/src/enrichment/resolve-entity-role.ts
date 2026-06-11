import type { PrismaService } from "@ournigeria/database";
import { normalizeEntityRole, type EntityRole } from "./entity-role";

type ProposalLike = {
  changeKind: string;
  targetTable: string;
  targetPk: string | null;
  proposedValue: unknown;
};

/**
 * Resolve a proposal's normalized entity bucket (governor|senator|…|unknown) via Prisma.
 * Hybrid resolution — the person is the base entity, the role comes from the most specific
 * source available:
 *   - create                     → proposedValue.position.role
 *   - official_positions target  → that position's own role
 *   - nigerian_officials target  → the official's preferred current position role
 *   - anything unresolved        → "unknown"
 *
 * Used by the backfill and as the read-time fallback for rows whose stored entity_role is null.
 * Never throws — unresolved inputs collapse to "unknown".
 */
export async function resolveEntityRolePrisma(
  prisma: PrismaService,
  p: ProposalLike,
): Promise<EntityRole> {
  let rawRole: string | null = null;
  try {
    if (p.changeKind === "create") {
      const v = p.proposedValue as { position?: { role?: string } } | null;
      rawRole = v?.position?.role ?? null;
    } else if (p.targetPk && p.targetTable === "official_positions") {
      const pos = await prisma.officialPosition.findUnique({
        where: { id: p.targetPk },
        select: { role: true },
      });
      rawRole = pos?.role ?? null;
    } else if (p.targetPk && p.targetTable === "nigerian_officials") {
      const pos = await prisma.officialPosition.findFirst({
        where: {
          officialId: p.targetPk,
          status: "active",
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
        },
        select: { role: true },
        orderBy: { startDate: "desc" },
      });
      rawRole = pos?.role ?? null;
    }
  } catch {
    rawRole = null;
  }
  return normalizeEntityRole(rawRole);
}
