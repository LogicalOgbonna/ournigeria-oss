import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { normalizeEntityRole, type EntityRole } from "./entity-role";

/** Keyset cursor = base64("<createdAt ISO>|<id>"). Encodes the last row of a page. */
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

/** Decode a cursor; returns null for missing/garbage input (caller treats as page 1). */
function decodeCursor(cursor: string | undefined): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const [iso, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    const createdAt = new Date(iso);
    if (!id || Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

@Injectable()
export class ChangeProposalService {
  constructor(private readonly prisma: PrismaService) {}

  async listByStatus(status: string) {
    const proposals = await this.prisma.changeProposal.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: { sources: true },
    });
    return this.withOfficial(proposals);
  }

  /**
   * Keyset-paginated, server-filtered proposal list for the dashboard. Filters by status
   * (always) plus optional `actions` (changeKind) and `entities` (denormalized entityRole),
   * ordered by (createdAt desc, id desc). The cursor encodes the last row of the previous
   * page; `nextCursor` is null on the final page. A bad/garbage cursor is ignored (page 1).
   */
  async listPaginated(opts: {
    status: string;
    actions?: string[];
    entities?: string[];
    cursor?: string;
    limit: number;
  }) {
    const { status, actions = [], entities = [], cursor, limit } = opts;
    const cur = decodeCursor(cursor);

    const rows = await this.prisma.changeProposal.findMany({
      where: {
        status,
        ...(actions.length ? { changeKind: { in: actions } } : {}),
        ...(entities.length ? { entityRole: { in: entities } } : {}),
        ...(cur
          ? {
              OR: [
                { createdAt: { lt: cur.createdAt } },
                { createdAt: cur.createdAt, id: { lt: cur.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: { sources: true },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = await this.withOfficial(page);
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;
    return { items, nextCursor };
  }

  getWithSources(id: string) {
    return this.prisma.changeProposal.findUnique({
      where: { id },
      include: { sources: true },
    });
  }

  /**
   * Resolve which official each proposal touches, so the dashboard can show whose data is
   * changing and link to their public page. `nigerian_officials` proposals key off targetPk
   * directly; `official_positions` proposals resolve through the position's official; a
   * `create` carries the new official's name in its payload (no id/public page yet).
   */
  private async withOfficial<T extends { changeKind: string; targetTable: string; targetPk: string | null; proposedValue: unknown; entityRole?: string | null }>(
    proposals: T[],
  ) {
    const officialIds = new Set<string>();
    const positionIds = new Set<string>();
    for (const p of proposals) {
      if (p.changeKind === "create" || !p.targetPk) continue;
      if (p.targetTable === "nigerian_officials") officialIds.add(p.targetPk);
      else if (p.targetTable === "official_positions") positionIds.add(p.targetPk);
    }

    const [officials, positions] = await Promise.all([
      officialIds.size
        ? this.prisma.nigerianOfficial.findMany({
            where: { id: { in: [...officialIds] } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as { id: string; name: string }[]),
      positionIds.size
        ? this.prisma.officialPosition.findMany({
            where: { id: { in: [...positionIds] } },
            select: { id: true, role: true, official: { select: { id: true, name: true } } },
          })
        : Promise.resolve([] as { id: string; role: string; official: { id: string; name: string } }[]),
    ]);

    // For nigerian_officials-targeted proposals the role isn't on the proposal — resolve each
    // person's preferred current position role (active, current-dated; most recent start wins).
    const preferredRoleByOfficial = await this.preferredCurrentRoles([...officialIds]);

    const officialById = new Map(officials.map((o) => [o.id, o]));
    const positionById = new Map(positions.map((p) => [p.id, p]));

    return proposals.map((p) => {
      let officialId: string | null = null;
      let officialName: string | null = null;
      let rawRole: string | null = null;
      if (p.changeKind === "create") {
        const v = p.proposedValue as { official?: { name?: string }; position?: { role?: string } } | null;
        officialName = v?.official?.name ?? null;
        rawRole = v?.position?.role ?? null;
      } else if (p.targetPk && p.targetTable === "nigerian_officials") {
        const o = officialById.get(p.targetPk);
        if (o) { officialId = o.id; officialName = o.name; }
        rawRole = preferredRoleByOfficial.get(p.targetPk) ?? null;
      } else if (p.targetPk && p.targetTable === "official_positions") {
        const pos = positionById.get(p.targetPk);
        if (pos?.official) { officialId = pos.official.id; officialName = pos.official.name; }
        rawRole = pos?.role ?? null;
      }
      // Stored (denormalized) value wins; live resolution is the fallback for rows created
      // before the backfill / write-path change so the response is always populated.
      const entityRole: EntityRole = (p.entityRole as EntityRole | null) ?? normalizeEntityRole(rawRole);
      return { ...p, officialId, officialName, entityRole };
    });
  }

  /**
   * Resolve each official's "current role" for the entity filter: their active, currently-dated
   * position with the most recent start date. Returns a map of officialId → raw role string
   * (un-normalized — the caller buckets it). Officials with no active position are absent.
   */
  private async preferredCurrentRoles(officialIds: string[]): Promise<Map<string, string>> {
    const byOfficial = new Map<string, string>();
    if (officialIds.length === 0) return byOfficial;
    const positions = await this.prisma.officialPosition.findMany({
      where: {
        officialId: { in: officialIds },
        status: "active",
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
      select: { officialId: true, role: true, startDate: true },
      orderBy: { startDate: "desc" },
    });
    // Ordered desc by startDate, so the first row seen per official is the most recent.
    for (const pos of positions) {
      if (!byOfficial.has(pos.officialId)) byOfficial.set(pos.officialId, pos.role);
    }
    return byOfficial;
  }
}
