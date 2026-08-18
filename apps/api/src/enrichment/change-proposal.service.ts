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

/**
 * Pull the existing-official FK out of a create/correction payload. Child records
 * (legal cases, careers, family members, …) reference the official they belong to via
 * `proposedValue.officialId`. Returns null when absent/blank.
 */
function readOfficialId(proposedValue: unknown): string | null {
  if (!proposedValue || typeof proposedValue !== "object") return null;
  const v = (proposedValue as Record<string, unknown>).officialId;
  return typeof v === "string" && v.length > 0 ? v : null;
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
  /**
   * Overview stats for the admin home. One groupBy(status) → full breakdown.
   * `open` = the buckets that still need a human (pending + needs_human + needs_more_sources);
   * approved/rejected are terminal.
   */
  async stats() {
    const rows = await this.prisma.changeProposal.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const by = (s: string) => rows.find((r) => r.status === s)?._count._all ?? 0;
    const pending = by("pending");
    const needsHuman = by("needs_human");
    const needsMoreSources = by("needs_more_sources");
    const approved = by("approved");
    const rejected = by("rejected");
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    return {
      total,
      open: pending + needsHuman + needsMoreSources,
      pending,
      needsHuman,
      needsMoreSources,
      approved,
      rejected,
    };
  }

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
    // Officials to resolve for display, from three places:
    //  1. targetPk on a nigerian_officials correction (the row IS the official),
    //  2. targetPk on an official_positions proposal (resolve through the position),
    //  3. proposedValue.officialId on a child-record create/correction (legal case, career,
    //     family member, …) — the record is ABOUT that existing official. These were previously
    //     unresolved, which is why the dashboard showed "Unknown official" for them.
    const officialIds = new Set<string>();
    const positionIds = new Set<string>();
    for (const p of proposals) {
      const embeddedId = readOfficialId(p.proposedValue);
      if (embeddedId) officialIds.add(embeddedId);
      if (!p.targetPk) continue;
      if (p.targetTable === "nigerian_officials" && p.changeKind !== "create") officialIds.add(p.targetPk);
      else if (p.targetTable === "official_positions") positionIds.add(p.targetPk);
    }

    const [officials, positions] = await Promise.all([
      officialIds.size
        ? this.prisma.nigerianOfficial.findMany({
            where: { id: { in: [...officialIds] } },
            select: { id: true, name: true, imageUrl: true, slug: true },
          })
        : Promise.resolve([] as { id: string; name: string; imageUrl: string | null; slug: string | null }[]),
      positionIds.size
        ? this.prisma.officialPosition.findMany({
            where: { id: { in: [...positionIds] } },
            select: { id: true, role: true, official: { select: { id: true, name: true, imageUrl: true, slug: true } } },
          })
        : Promise.resolve([] as { id: string; role: string; official: { id: string; name: string; imageUrl: string | null; slug: string | null } }[]),
    ]);

    // Current position (role · state · party) per resolved official — powers the identity chip
    // and the entity-role filter (active, current-dated; most recent start wins).
    const currentByOfficial = await this.currentPositions([...officialIds]);

    const officialById = new Map(officials.map((o) => [o.id, o]));
    const positionById = new Map(positions.map((p) => [p.id, p]));

    return proposals.map((p) => {
      let officialId: string | null = null;
      let officialName: string | null = null;
      let officialImage: string | null = null;
      let officialSlug: string | null = null;
      let officialState: string | null = null;
      let officialParty: string | null = null;
      let rawRole: string | null = null;

      const embeddedId = readOfficialId(p.proposedValue);
      const embedded = embeddedId ? officialById.get(embeddedId) : null;

      if (embedded) {
        // Child-record proposal about an existing official (the "Unknown official" case, now fixed).
        officialId = embedded.id;
        officialName = embedded.name;
        officialImage = embedded.imageUrl;
        officialSlug = embedded.slug;
        const cur = currentByOfficial.get(embedded.id);
        rawRole = cur?.role ?? null;
        officialState = cur?.state ?? null;
        officialParty = cur?.party ?? null;
      } else if (p.changeKind === "create") {
        // A brand-new person carried in the payload (no id/public page yet). Two shapes:
        //  - councilor entity: { official:{name}, position:{role,partyAcronym,stateCode} }
        //  - flat record (assembly_member, …): { name, party, stateCode, imageUrl, leadershipRole }
        const v = p.proposedValue as {
          official?: { name?: string };
          position?: { role?: string; partyAcronym?: string; stateCode?: string };
          name?: string; party?: string; stateCode?: string; imageUrl?: string; leadershipRole?: string;
        } | null;
        officialName = v?.official?.name ?? v?.name ?? null;
        rawRole = v?.position?.role ?? v?.leadershipRole ?? null;
        officialParty = v?.position?.partyAcronym ?? v?.party ?? null;
        officialState = v?.position?.stateCode ?? v?.stateCode ?? null;
        officialImage = v?.imageUrl ?? null;
      } else if (p.targetPk && p.targetTable === "nigerian_officials") {
        const o = officialById.get(p.targetPk);
        if (o) { officialId = o.id; officialName = o.name; officialImage = o.imageUrl; officialSlug = o.slug; }
        const cur = currentByOfficial.get(p.targetPk);
        rawRole = cur?.role ?? null;
        officialState = cur?.state ?? null;
        officialParty = cur?.party ?? null;
      } else if (p.targetPk && p.targetTable === "official_positions") {
        const pos = positionById.get(p.targetPk);
        if (pos?.official) { officialId = pos.official.id; officialName = pos.official.name; officialImage = pos.official.imageUrl; officialSlug = pos.official.slug; }
        rawRole = pos?.role ?? null;
      }

      // Stored (denormalized) entityRole wins; live resolution is the fallback for old rows.
      const entityRole: EntityRole = (p.entityRole as EntityRole | null) ?? normalizeEntityRole(rawRole);
      return { ...p, officialId, officialName, officialImage, officialSlug, officialRole: rawRole, officialState, officialParty, entityRole };
    });
  }

  /**
   * Resolve each official's current position (role · state · party) for the identity chip and the
   * entity filter: their active, currently-dated position with the most recent start date.
   * Officials with no active position are absent from the map.
   */
  private async currentPositions(
    officialIds: string[],
  ): Promise<Map<string, { role: string; state: string | null; party: string | null }>> {
    const byOfficial = new Map<string, { role: string; state: string | null; party: string | null }>();
    if (officialIds.length === 0) return byOfficial;
    const positions = await this.prisma.officialPosition.findMany({
      where: {
        officialId: { in: officialIds },
        status: "active",
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
      select: { officialId: true, role: true, stateCode: true, partyAcronym: true, startDate: true },
      orderBy: { startDate: "desc" },
    });
    // Ordered desc by startDate, so the first row seen per official is the most recent.
    for (const pos of positions) {
      if (!byOfficial.has(pos.officialId)) {
        byOfficial.set(pos.officialId, { role: pos.role, state: pos.stateCode ?? null, party: pos.partyAcronym ?? null });
      }
    }
    return byOfficial;
  }
}
