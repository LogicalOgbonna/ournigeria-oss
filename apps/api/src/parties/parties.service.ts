import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

const OFFICEHOLDER_ROLES = new Set(["governor", "senator", "rep", "mha", "lga_chairman"]);
const OFFICEHOLDER_PAGE_SIZE = 20;

interface FootprintRow {
  role: string;
  state_code: string | null;
  n: number;
}

interface OfficialMiniRow {
  role: string;
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
  context_label: string | null;
}

interface CandidateRow {
  election_type: string;
  year: number;
  election_date: Date | null;
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
  scope_label: string | null;
}

/** Seat-share band: held vs national total per chamber. */
function buildSeatShare(byRole: Record<string, number>, roleTotals: Record<string, number>) {
  const mk = (role: string) => ({ held: byRole[role] ?? 0, total: roleTotals[role] ?? 0 });
  return {
    governorships: mk("governor"),
    senate: mk("senator"),
    house: mk("rep"),
    stateAssembly: mk("mha"),
    lga: mk("lga_chairman"),
  };
}

/** Compact Naira: ₦1.23T / ₦45.6B / ₦7.8M / ₦12,345. */
function formatNaira(n: number): string {
  if (n >= 1e12) return `₦${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `₦${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `₦${(n / 1e6).toFixed(1)}M`;
  return `₦${Math.round(n).toLocaleString()}`;
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

    const [parties, seatGroups, officers] = await Promise.all([
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
      // All officers in one query (≤45 rows); grouped per party below (no N+1).
      this.prisma.partyOfficer.findMany({
        orderBy: [{ displayOrder: "asc" }, { role: "asc" }],
        select: {
          partyAcronym: true,
          role: true,
          name: true,
          imageUrl: true,
          official: { select: { slug: true } },
        },
      }),
    ]);

    const seatsByParty = new Map<string, number>();
    for (const g of seatGroups) {
      if (g.partyAcronym) {
        seatsByParty.set(g.partyAcronym, g._count._all);
      }
    }

    const officersByParty = new Map<
      string,
      { role: string; name: string; imageUrl: string | null; officialSlug: string | null }[]
    >();
    for (const o of officers) {
      const list = officersByParty.get(o.partyAcronym) ?? [];
      list.push({ role: o.role, name: o.name, imageUrl: o.imageUrl, officialSlug: o.official?.slug ?? null });
      officersByParty.set(o.partyAcronym, list);
    }

    return parties
      .map((p) => ({
        acronym: p.acronym,
        name: p.name,
        isActive: p.isActive,
        logoUrl: p.logoUrl,
        completenessScore: p.completenessScore != null ? Number(p.completenessScore) : null,
        seats: seatsByParty.get(p.acronym) ?? 0,
        officers: officersByParty.get(p.acronym) ?? [],
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
        officers: {
          orderBy: [{ displayOrder: "asc" }, { role: "asc" }],
          include: { official: { select: { slug: true } } },
        },
      },
    });

    if (!party) {
      throw new NotFoundException("Party not found");
    }

    const [footprint, statesGoverned, candidates, seatTotals] = await Promise.all([
      this.computeFootprint(acronym),
      this.computeStatesGoverned(acronym),
      this.computeCandidates(acronym),
      this.computeSeatTotalsAndRank(acronym),
    ]);

    const [budgetGoverned, seatsByZone] = await Promise.all([
      this.computeBudgetGoverned(statesGoverned),
      this.computeSeatsByZone(footprint.seatsByState),
    ]);

    const seatShare = buildSeatShare(footprint.byRole, seatTotals.roleTotals);

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
      officers: party.officers.map((o) => ({
        role: o.role,
        name: o.name,
        imageUrl: o.imageUrl,
        officialSlug: o.official?.slug ?? null,
      })),
      footprint,
      statesGoverned,
      candidates,
      seatShare,
      budgetGoverned,
      seatsByZone,
      rank: seatTotals.rank,
    };
  }

  /**
   * National per-role seat totals (denominators for the seat-share band) + this
   * party's rank by total active seats among all parties (ties broken by acronym).
   */
  private async computeSeatTotalsAndRank(acronym: string) {
    const [roleGroups, partyGroups] = await Promise.all([
      this.prisma.officialPosition.groupBy({
        by: ["role"],
        where: { status: "active", partyAcronym: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.officialPosition.groupBy({
        by: ["partyAcronym"],
        where: { status: "active", partyAcronym: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const roleTotals: Record<string, number> = {};
    for (const g of roleGroups) roleTotals[g.role] = g._count._all;

    const ranked = partyGroups
      .map((g) => ({ acronym: g.partyAcronym as string, seats: g._count._all }))
      .sort((a, b) => b.seats - a.seats || a.acronym.localeCompare(b.acronym));
    const idx = ranked.findIndex((p) => p.acronym === acronym);

    return {
      roleTotals,
      // position is null for a party that holds no seats (badge omitted).
      rank: { position: idx >= 0 ? idx + 1 : null, totalParties: ranked.length },
    };
  }

  /**
   * Combined approved budget of the states the party governs. For each governed
   * state's fiscal entity (= state code), take its latest budgeted fiscal year and
   * SUM(approved_budget). Empty on environments without ingested budget data.
   */
  private async computeBudgetGoverned(statesGoverned: string[]) {
    const empty = {
      totalNaira: null as string | null,
      totalRaw: 0,
      statesGoverned: statesGoverned.length,
      statesWithData: 0,
      topStates: [] as { stateCode: string; name: string; naira: string; raw: number }[],
    };
    if (statesGoverned.length === 0) return empty;

    const placeholders = statesGoverned.map((_, i) => `$${i + 1}`).join(", ");
    const rows = await this.prisma.$queryRawUnsafe<{ state_code: string; total: string | null }[]>(
      `WITH latest AS (
         SELECT entity_code, max(fiscal_year) AS fy
         FROM budget_line_items
         WHERE entity_code IN (${placeholders})
         GROUP BY entity_code
       )
       SELECT b.entity_code AS state_code, SUM(b.approved_budget)::numeric AS total
       FROM budget_line_items b
       JOIN latest l ON l.entity_code = b.entity_code AND l.fy = b.fiscal_year
       GROUP BY b.entity_code`,
      ...statesGoverned,
    );
    if (rows.length === 0) return empty;

    const names = await this.prisma.nigerianState.findMany({
      where: { code: { in: statesGoverned } },
      select: { code: true, name: true },
    });
    const nameOf = new Map(names.map((n) => [n.code, n.name]));

    const perState = rows
      .map((r) => ({ stateCode: r.state_code, raw: Number(r.total) || 0 }))
      .filter((s) => s.raw > 0);
    const totalRaw = perState.reduce((a, s) => a + s.raw, 0);
    const topStates = perState
      .sort((a, b) => b.raw - a.raw)
      .slice(0, 5)
      .map((s) => ({ stateCode: s.stateCode, name: nameOf.get(s.stateCode) ?? s.stateCode, naira: formatNaira(s.raw), raw: s.raw }));

    return {
      totalNaira: totalRaw > 0 ? formatNaira(totalRaw) : null,
      totalRaw,
      statesGoverned: statesGoverned.length,
      statesWithData: perState.length,
      topStates,
    };
  }

  /** Seats per geopolitical zone (regional strongholds), strongest zone first. */
  private async computeSeatsByZone(seatsByState: Record<string, number>) {
    const stateZones = await this.prisma.$queryRaw<
      { state_code: string; zone_code: string; zone_name: string }[]
    >`
      SELECT s.code AS state_code, z.code AS zone_code, z.name AS zone_name
      FROM nigerian_states s
      JOIN geopolitical_zones z ON z.code = s.zone_code
    `;
    const agg = new Map<string, { zoneCode: string; zoneName: string; seats: number }>();
    for (const sz of stateZones) {
      const seats = seatsByState[sz.state_code] ?? 0;
      if (seats <= 0) continue;
      const cur = agg.get(sz.zone_code) ?? { zoneCode: sz.zone_code, zoneName: sz.zone_name, seats: 0 };
      cur.seats += seats;
      agg.set(sz.zone_code, cur);
    }
    const zones = Array.from(agg.values()).sort((a, b) => b.seats - a.seats);
    return { zones, strongestZone: zones[0]?.zoneName ?? null };
  }

  /** State codes where the party holds the governorship (active). Drives the map. */
  private async computeStatesGoverned(acronym: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ state_code: string }[]>`
      SELECT DISTINCT state_code
      FROM official_positions
      WHERE status = 'active' AND role = 'governor'
        AND party_acronym = ${acronym} AND state_code IS NOT NULL
      ORDER BY state_code
    `;
    return rows.map((r) => r.state_code);
  }

  /**
   * Paginated officeholders for a party + role, mapped to officials (for the
   * lazy-loaded accordion on the detail page). Scope label resolved via the
   * exclusive arc (state / constituency / lga).
   */
  async listOfficeholders(acronymParam: string, roleParam?: string, pageParam?: string) {
    const acronym = acronymParam.toUpperCase();
    if (!roleParam || !OFFICEHOLDER_ROLES.has(roleParam)) {
      throw new BadRequestException("invalid or missing role");
    }
    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
    const limit = OFFICEHOLDER_PAGE_SIZE;
    const offset = (page - 1) * limit;

    const [countRows, rows] = await Promise.all([
      this.prisma.$queryRaw<{ n: number }[]>`
        SELECT count(*)::int AS n FROM official_positions
        WHERE status = 'active' AND party_acronym = ${acronym} AND role = ${roleParam}
      `,
      this.prisma.$queryRaw<OfficialMiniRow[]>`
        SELECT p.role, o.id, o.slug, o.name, o.image_url,
          COALESCE(st.name, con.name, lga.name) AS context_label
        FROM official_positions p
        JOIN nigerian_officials o ON o.id = p.official_id
        LEFT JOIN nigerian_states st ON st.code = p.state_code
        LEFT JOIN nigerian_constituencies con ON con.code = p.constituency_code
        LEFT JOIN nigerian_lgas lga ON lga.code = p.lga_code
        WHERE p.status = 'active' AND p.party_acronym = ${acronym} AND p.role = ${roleParam}
        ORDER BY context_label NULLS LAST, o.name
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = countRows[0]?.n ?? 0;
    return {
      data: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        imageUrl: r.image_url,
        contextLabel: r.context_label,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Primary winners (flagbearers) for the party, mapped to officials. Sparse until
   * the structured-enrichment sweeper populates official_elections. Ordered most
   * recent year first; scope label is the state/district, else "National".
   */
  private async computeCandidates(acronym: string) {
    const rows = await this.prisma.$queryRaw<CandidateRow[]>`
      SELECT e.election_type, e.year, e.election_date,
        o.id, o.slug, o.name, o.image_url,
        COALESCE(st.name, con.name) AS scope_label
      FROM official_elections e
      JOIN nigerian_officials o ON o.id = e.official_id
      LEFT JOIN nigerian_states st ON st.code = e.state_code
      LEFT JOIN nigerian_constituencies con ON con.code = e.constituency_code
      WHERE e.is_primary = true AND lower(e.result) = 'won'
        AND e.party_acronym = ${acronym}
      ORDER BY e.year DESC, e.election_type
    `;
    return rows.map((r) => ({
      official: { id: r.id, slug: r.slug, name: r.name, imageUrl: r.image_url },
      electionType: r.election_type,
      year: r.year,
      electionDate: r.election_date ? r.election_date.toISOString().slice(0, 10) : null,
      scopeLabel: r.scope_label ?? "National",
    }));
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
    const seatsByStateByRole: Record<string, Record<string, number>> = {};
    const states = new Set<string>();

    for (const row of rows) {
      byRole[row.role] = (byRole[row.role] ?? 0) + row.n;
      if (row.state_code) {
        states.add(row.state_code);
        seatsByState[row.state_code] = (seatsByState[row.state_code] ?? 0) + row.n;
        (seatsByStateByRole[row.state_code] ??= {})[row.role] = row.n;
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
      // Per-state, per-role counts — drives the map hover tooltip breakdown.
      seatsByStateByRole,
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
