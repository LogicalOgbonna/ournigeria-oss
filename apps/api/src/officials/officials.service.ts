import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

const TRACKED_FIELDS = [
  "name",
  "imageUrl",
  "email",
  "phoneNumber",
  "officeAddress",
  "twitterHandle",
  "facebookUrl",
  "education",
  "biography",
  "gender",
] as const;

@Injectable()
export class OfficialsService {
  constructor(private prisma: PrismaService) {}

  async list(params: {
    stateCode?: string;
    lgaCode?: string;
    role?: string;
    party?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { stateCode, lgaCode, role, party, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    const positionWhere: any = { status: "active" };

    if (stateCode) positionWhere.stateCode = stateCode;
    if (lgaCode) positionWhere.lgaCode = lgaCode;
    if (role) positionWhere.role = role;
    if (party) positionWhere.partyAcronym = party;

    if (stateCode || lgaCode || role || party) {
      where.positions = { some: positionWhere };
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [officials, total] = await Promise.all([
      this.prisma.nigerianOfficial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          positions: {
            where: { status: "active" },
            include: { party: true, state: true, lga: true, constituency: true, ward: true, term: true },
          },
          _count: { select: { proposals: true } },
        },
      }),
      this.prisma.nigerianOfficial.count({ where }),
    ]);

    return {
      data: officials.map((o) => this.formatOfficial(o)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const official = await this.prisma.nigerianOfficial.findUnique({
      where: { id },
      include: {
        positions: {
          where: { status: "active" },
          include: { party: true, state: true, lga: true, constituency: true, ward: true, term: true },
        },
        proposals: {
          where: { status: { in: ["submitted", "under_review"] } },
          orderBy: { voteScore: "desc" },
          take: 20,
          include: { _count: { select: { votes: true } } },
        },
      },
    });

    if (!official) {
      throw new NotFoundException("Official not found");
    }

    return this.formatOfficial(official);
  }

  async getByLocation(stateCode: string, lgaCode?: string, wardCode?: string) {
    const chain: any[] = [];

    // 1. Ward Councilor
    if (wardCode) {
      chain.push(await this.findOfficialByPosition("councilor", { wardCode }));
    } else {
      chain.push({ role: "councilor", scope: {}, official: null, position: null });
    }

    // 2. LGA Chairman
    if (lgaCode) {
      chain.push(await this.findOfficialByPosition("lga_chairman", { lgaCode }));
    } else {
      chain.push({ role: "lga_chairman", scope: {}, official: null, position: null });
    }

    // 3. State House Member (MHA) - uses constituency arc, find via ward or state constituency
    if (wardCode) {
      // Find state constituency containing this ward
      const wardMapping = await this.prisma.constituencyWard.findFirst({
        where: { wardCode },
        include: { constituency: true },
      });
      if (wardMapping && wardMapping.constituency.type === "state") {
        chain.push(await this.findOfficialByPosition("mha", { constituencyCode: wardMapping.constituencyCode }));
      } else {
        chain.push({ role: "mha", scope: { stateCode }, official: null, position: null });
      }
    } else {
      chain.push({ role: "mha", scope: { stateCode }, official: null, position: null });
    }

    // 4. Federal Rep - find via ward→constituency mapping, then LGA name match, then fallback
    if (lgaCode) {
      const fedPositions = await this.prisma.officialPosition.findMany({
        where: {
          role: "rep",
          status: "active",
          constituencyCode: { startsWith: `fed_${stateCode}_` },
        },
        include: { official: true, party: true, constituency: true, term: true },
      });

      if (fedPositions.length > 0) {
        let matched: (typeof fedPositions)[0] | undefined;

        // Strategy 1: Use constituency_wards table if we have a ward code
        if (wardCode) {
          const wardMapping = await this.prisma.constituencyWard.findFirst({
            where: { wardCode, constituency: { type: "federal" } },
          });
          if (wardMapping) {
            matched = fedPositions.find((p) => p.constituencyCode === wardMapping.constituencyCode);
          }
        }

        // Strategy 2: Match by LGA name in constituency name
        if (!matched) {
          const lgaRecord = await this.prisma.nigerianLga.findUnique({ where: { code: lgaCode } });
          const lgaName = lgaRecord?.name?.toLowerCase() || "";
          matched = fedPositions.find((p) =>
            p.constituency?.name?.toLowerCase().includes(lgaName),
          );
        }

        // Strategy 3: Match by LGA code embedded in constituency code
        if (!matched) {
          const lgaSuffix = lgaCode.replace(`${stateCode}-`, "");
          matched = fedPositions.find((p) =>
            p.constituencyCode?.includes(lgaSuffix),
          );
        }

        if (!matched) {
          matched = fedPositions[0]; // Last resort: first rep in the state
        }

        chain.push(this.formatPositionResult(matched, "representative", { stateCode, lgaCode }));
      } else {
        chain.push({ role: "representative", scope: { stateCode, lgaCode }, official: null, position: null });
      }
    } else {
      chain.push({ role: "representative", scope: { stateCode }, official: null, position: null });
    }

    // 5. Senator - uses constituency arc (sen_{state}_*), find via LGA senatorial mapping
    {
      const senPositions = await this.prisma.officialPosition.findMany({
        where: {
          role: "senator",
          status: "active",
          constituencyCode: { startsWith: `sen_${stateCode}_` },
        },
        include: { official: true, party: true, constituency: true, term: true },
      });

      if (senPositions.length > 0) {
        if (lgaCode && senPositions.length > 1) {
          // Narrow to the senator whose senatorial district contains this LGA
          const lgaMapping = await this.prisma.senatorialDistrictLga.findFirst({
            where: { lgaCode },
          });
          const matched = lgaMapping
            ? senPositions.find((p) => p.constituencyCode === lgaMapping.senatorialDistrictCode)
            : null;

          if (matched) {
            chain.push(this.formatPositionResult(matched, "senator", { stateCode, lgaCode }));
          } else {
            // Can't narrow, show first senator
            chain.push(this.formatPositionResult(senPositions[0], "senator", { stateCode }));
          }
        } else {
          // No LGA or only one senator, show first
          chain.push(this.formatPositionResult(senPositions[0], "senator", { stateCode }));
        }
      } else {
        chain.push({ role: "senator", scope: { stateCode }, official: null, position: null });
      }
    }

    // 6. Governor - uses state arc
    chain.push(await this.findOfficialByPosition("governor", { stateCode }));

    return chain;
  }

  private async findOfficialByPosition(
    role: string,
    scope: { stateCode?: string; constituencyCode?: string; lgaCode?: string; wardCode?: string },
  ) {
    const position = await this.prisma.officialPosition.findFirst({
      where: { role, status: "active", ...scope },
      include: {
        official: true,
        party: true,
        state: true,
        lga: true,
        constituency: true,
        ward: true,
        term: true,
      },
    });

    if (!position) {
      return { role, scope, official: null, position: null };
    }

    return {
      role,
      scope,
      official: this.formatOfficial(position.official),
      position: {
        id: position.id,
        role: position.role,
        party: position.party?.acronym ?? null,
        partyName: position.party?.name ?? null,
        state: position.state?.name ?? null,
        lga: position.lga?.name ?? null,
        constituency: position.constituency?.name ?? null,
        ward: position.ward?.name ?? null,
        startDate: position.startDate?.toISOString().split("T")[0] ?? null,
        endDate: position.endDate?.toISOString().split("T")[0] ?? null,
        termName: (position as any).term?.name ?? null,
        termNumber: (position as any).term?.termNumber ?? null,
      },
    };
  }

  private async findOfficialsByPosition(
    role: string,
    scope: { stateCode?: string; lgaCode?: string; wardCode?: string },
  ) {
    // For senators, find via senatorial district LGA mapping
    if (role === "senator" && scope.stateCode) {
      const positions = await this.prisma.officialPosition.findMany({
        where: { role, status: "active", stateCode: scope.stateCode },
        include: {
          official: true,
          party: true,
          state: true,
          constituency: true,
          term: true,
        },
      });

      // If we have an LGA code, filter to the senator whose senatorial district contains this LGA
      if (scope.lgaCode && positions.length > 1) {
        const lgaMappings = await this.prisma.senatorialDistrictLga.findMany({
          where: { lgaCode: scope.lgaCode },
        });
        const matchingDistrictCodes = new Set(lgaMappings.map((m) => m.senatorialDistrictCode));
        const filtered = positions.filter(
          (p) => p.constituencyCode && matchingDistrictCodes.has(p.constituencyCode),
        );
        if (filtered.length > 0) {
          return filtered.map((p) => this.formatPositionResult(p, role, scope));
        }
      }

      return positions.map((p) => this.formatPositionResult(p, role, scope));
    }

    // For federal reps, find via constituency-LGA mapping
    if (role === "representative" && scope.lgaCode) {
      const lgaMappings = await this.prisma.senatorialDistrictLga.findMany({
        where: { lgaCode: scope.lgaCode },
      });
      // Federal constituencies may share LGAs, find all positions for constituencies containing this LGA
      const positions = await this.prisma.officialPosition.findMany({
        where: {
          role,
          status: "active",
          stateCode: scope.stateCode,
        },
        include: {
          official: true,
          party: true,
          state: true,
          constituency: true,
          term: true,
        },
      });

      // Filter to the rep whose federal constituency contains this LGA
      // (constituency_wards would be more precise but we work with what we have)
      return positions.slice(0, 1).map((p) => this.formatPositionResult(p, role, scope));
    }

    // For MHAs, find via ward
    if (role === "mha" && scope.wardCode) {
      const positions = await this.prisma.officialPosition.findMany({
        where: { role, status: "active", wardCode: scope.wardCode },
        include: {
          official: true,
          party: true,
          state: true,
          constituency: true,
          ward: true,
          term: true,
        },
      });
      return positions.map((p) => this.formatPositionResult(p, role, scope));
    }

    return [];
  }

  private formatPositionResult(
    position: any,
    role: string,
    scope: { stateCode?: string; lgaCode?: string; wardCode?: string },
  ) {
    return {
      role,
      scope,
      official: this.formatOfficial(position.official),
      position: {
        id: position.id,
        role: position.role,
        party: position.party?.acronym ?? null,
        partyName: position.party?.name ?? null,
        state: position.state?.name ?? null,
        constituency: position.constituency?.name ?? null,
        ward: position.ward?.name ?? null,
        startDate: position.startDate?.toISOString().split("T")[0] ?? null,
        endDate: position.endDate?.toISOString().split("T")[0] ?? null,
        termName: (position as any).term?.name ?? null,
        termNumber: (position as any).term?.termNumber ?? null,
      },
    };
  }

  formatOfficial(official: any) {
    return {
      id: official.id,
      name: official.name,
      imageUrl: official.imageUrl,
      email: official.email,
      phoneNumber: official.phoneNumber,
      officeAddress: official.officeAddress,
      twitterHandle: official.twitterHandle,
      facebookUrl: official.facebookUrl,
      gender: official.gender,
      education: official.education,
      biography: official.biography,
      completenessScore: official.completenessScore
        ? Number(official.completenessScore)
        : this.computeCompleteness(official),
      positions: official.positions?.map((p: any) => ({
        id: p.id,
        role: p.role,
        party: p.party?.acronym ?? p.partyAcronym ?? null,
        partyName: p.party?.name ?? null,
        state: p.state?.name ?? null,
        stateCode: p.stateCode,
        lga: p.lga?.name ?? null,
        lgaCode: p.lgaCode,
        constituency: p.constituency?.name ?? null,
        constituencyCode: p.constituencyCode,
        ward: p.ward?.name ?? null,
        wardCode: p.wardCode,
        startDate: p.startDate?.toISOString().split("T")[0] ?? null,
        endDate: p.endDate?.toISOString().split("T")[0] ?? null,
        termName: p.term?.name ?? null,
        termNumber: p.term?.termNumber ?? null,
      })) ?? [],
      proposalCount: official._count?.proposals ?? 0,
      proposals: official.proposals?.map((p: any) => ({
        id: p.id,
        targetField: p.targetField,
        proposedValue: p.proposedValue,
        sourceUrl: p.sourceUrl,
        status: p.status,
        voteScore: p.voteScore,
        upvoteCount: p.upvoteCount ?? 0,
        downvoteCount: p.downvoteCount ?? 0,
        voteCount: p._count?.votes ?? 0,
        createdAt: p.createdAt.toISOString(),
      })) ?? [],
    };
  }

  computeCompleteness(official: any): number {
    let filled = 0;
    for (const field of TRACKED_FIELDS) {
      if (official[field] != null && official[field] !== "") {
        filled++;
      }
    }
    return Number((filled / TRACKED_FIELDS.length).toFixed(2));
  }

  async recomputeCompleteness(officialId: string) {
    const official = await this.prisma.nigerianOfficial.findUnique({
      where: { id: officialId },
    });
    if (!official) return;

    const score = this.computeCompleteness(official);
    await this.prisma.nigerianOfficial.update({
      where: { id: officialId },
      data: { completenessScore: score },
    });
  }
}

