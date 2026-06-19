import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

interface FootprintRow {
  role: string;
  state_code: string | null;
  n: number;
}

@Injectable()
export class PartiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * List parties with a computed `seats` count = total active positions held.
   * Ordered by seats desc, then name asc.
   */
  async list(params: { activeOnly?: boolean }) {
    const { activeOnly } = params;

    const [parties, seatGroups] = await Promise.all([
      this.prisma.politicalParty.findMany({
        where: activeOnly ? { isActive: true } : {},
        select: {
          acronym: true,
          name: true,
          isActive: true,
          logoUrl: true,
          completenessScore: true,
        },
      }),
      // Active position counts per party (the computed `seats`).
      this.prisma.officialPosition.groupBy({
        by: ["partyAcronym"],
        where: { status: "active", partyAcronym: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const seatsByParty = new Map<string, number>();
    for (const g of seatGroups) {
      if (g.partyAcronym) {
        seatsByParty.set(g.partyAcronym, g._count._all);
      }
    }

    return parties
      .map((p) => ({
        acronym: p.acronym,
        name: p.name,
        isActive: p.isActive,
        logoUrl: p.logoUrl,
        completenessScore: p.completenessScore != null ? Number(p.completenessScore) : null,
        seats: seatsByParty.get(p.acronym) ?? 0,
      }))
      .sort((a, b) => b.seats - a.seats || a.name.localeCompare(b.name));
  }

  /**
   * Full party profile + per-state chapters + computed electoral footprint.
   */
  async getByAcronym(acronymParam: string) {
    const acronym = acronymParam.toUpperCase();

    const party = await this.prisma.politicalParty.findUnique({
      where: { acronym },
      include: {
        chapters: { orderBy: { stateCode: "asc" } },
      },
    });

    if (!party) {
      throw new NotFoundException("Party not found");
    }

    const footprint = await this.computeFootprint(acronym);

    return {
      acronym: party.acronym,
      name: party.name,
      isActive: party.isActive,
      logoUrl: party.logoUrl,
      foundingYear: party.foundingYear,
      leaderName: party.leaderName,
      hqAddress: party.hqAddress,
      website: party.website,
      email: party.email,
      phoneNumber: party.phoneNumber,
      twitterHandle: party.twitterHandle,
      facebookUrl: party.facebookUrl,
      description: party.description,
      ideology: party.ideology,
      slogan: party.slogan,
      color: party.color,
      inecStatus: party.inecStatus,
      completenessScore:
        party.completenessScore != null ? Number(party.completenessScore) : null,
      createdAt: party.createdAt.toISOString(),
      updatedAt: party.updatedAt.toISOString(),
      chapters: party.chapters.map((c) => this.formatChapter(c)),
      footprint,
    };
  }

  /**
   * Documented per-state chapter rows for a party, ordered by stateCode.
   */
  async getChapters(acronymParam: string) {
    const acronym = acronymParam.toUpperCase();

    const party = await this.prisma.politicalParty.findUnique({
      where: { acronym },
      select: { acronym: true },
    });

    if (!party) {
      throw new NotFoundException("Party not found");
    }

    const chapters = await this.prisma.partyStateChapter.findMany({
      where: { partyAcronym: acronym },
      orderBy: { stateCode: "asc" },
    });

    return chapters.map((c) => this.formatChapter(c));
  }

  /**
   * Resolve every active position's state via the exclusive arc
   * (state_code OR via constituency / lga / ward) and aggregate counts by role,
   * plus the distinct set of states where the party holds any active position.
   */
  private async computeFootprint(acronym: string) {
    const rows = await this.prisma.$queryRaw<FootprintRow[]>`
      SELECT
        p.role,
        COALESCE(p.state_code, con.state_code, lga.state_code, wlga.state_code) AS state_code,
        count(*)::int AS n
      FROM official_positions p
      LEFT JOIN nigerian_constituencies con ON con.code = p.constituency_code
      LEFT JOIN nigerian_lgas lga ON lga.code = p.lga_code
      LEFT JOIN nigerian_wards w ON w.code = p.ward_code
      LEFT JOIN nigerian_lgas wlga ON wlga.code = w.lga_code
      WHERE p.status = 'active' AND p.party_acronym = ${acronym}
      GROUP BY p.role, 2
    `;

    const byRole: Record<string, number> = {};
    const seatsByState: Record<string, number> = {};
    const states = new Set<string>();

    for (const row of rows) {
      byRole[row.role] = (byRole[row.role] ?? 0) + row.n;
      if (row.state_code) {
        states.add(row.state_code);
        seatsByState[row.state_code] = (seatsByState[row.state_code] ?? 0) + row.n;
      }
    }

    return {
      // Common roles surfaced explicitly (default to 0 when absent).
      governors: byRole["governor"] ?? 0,
      senators: byRole["senator"] ?? 0,
      representatives: byRole["rep"] ?? 0,
      // Full per-role breakdown (includes any roles not enumerated above).
      byRole,
      statesControlled: Array.from(states).sort(),
      // Per-state seat totals — drives the choropleth intensity on the party page.
      seatsByState,
    };
  }

  private formatChapter(c: {
    id: string;
    partyAcronym: string;
    stateCode: string;
    chairmanName: string | null;
    secretaryName: string | null;
    hqAddress: string | null;
    phoneNumber: string | null;
    email: string | null;
    website: string | null;
    twitterHandle: string | null;
    completenessScore: { toString(): string } | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: c.id,
      partyAcronym: c.partyAcronym,
      stateCode: c.stateCode,
      chairmanName: c.chairmanName,
      secretaryName: c.secretaryName,
      hqAddress: c.hqAddress,
      phoneNumber: c.phoneNumber,
      email: c.email,
      website: c.website,
      twitterHandle: c.twitterHandle,
      completenessScore: c.completenessScore != null ? Number(c.completenessScore) : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
