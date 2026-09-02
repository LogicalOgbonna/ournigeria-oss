import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService, UUID_RE, Prisma } from "@ournigeria/database";
import { EvidenceService, EvidenceView } from "../evidence/evidence.service";
import { CompletenessService } from "../completeness/completeness.service";

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

const dateOnly = (d: Date | null | undefined): string | null =>
  d ? d.toISOString().split("T")[0] : null;

@Injectable()
export class OfficialsService {
  constructor(
    private prisma: PrismaService,
    private evidence: EvidenceService,
    private completenessService: CompletenessService,
  ) {}

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

    // Soft-deleted officials never surface publicly (plan 62 §12).
    const where: any = { deletedAt: null };
    const positionWhere: any = { status: "active" };

    if (stateCode) positionWhere.stateCode = stateCode;
    if (lgaCode) positionWhere.lgaCode = lgaCode;
    if (role) positionWhere.role = role;
    if (party) positionWhere.partyAcronym = party;

    if (stateCode || lgaCode || role || party) {
      where.positions = { some: positionWhere };
    } else {
      // Office-holder guard (plan 60 §5): election CANDIDATES are officials rows
      // (official_type NULL, at most `contesting` positions) so the ballot can
      // link to them — but contesting an office is not holding one. The bare
      // list and name search must only surface people who hold/held office.
      // Their profile page (by slug) stays reachable via ballot links.
      where.OR = [
        { officialType: { not: null } },
        { positions: { some: { status: { not: "contesting" } } } },
      ];
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
            include: {
              party: true,
              state: true,
              lga: true,
              constituency: true,
              // Resolve ward → LGA → state so ward-scoped offices (councilors)
              // can express their LGA and state, which aren't on the position row.
              ward: { include: { lga: { include: { state: true } } } },
              term: true,
            },
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

  async getByIdOrSlug(idOrSlug: string) {
    // Legacy UUID URLs resolve by id; new SEO URLs resolve by slug.
    const where = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const include = {
        // Full career history (Plan 45) — ongoing positions (endDate null) sort
        // first so existing positions[0] consumers keep seeing the current office.
        positions: {
          orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { startDate: "desc" }],
          include: {
            party: true,
            state: true,
            lga: true,
            constituency: true,
            // Resolve ward → LGA → state so ward-scoped offices (councilors)
            // can express their LGA and state, which aren't on the position row.
            ward: { include: { lga: { include: { state: true } } } },
            term: true,
          },
        },
        proposals: {
          where: { status: { in: ["submitted", "under_review"] } },
          orderBy: { voteScore: "desc" },
          take: 20,
          include: { _count: { select: { votes: true } } },
        },
        educationRecords: { orderBy: [{ endYear: "desc" }, { startYear: "desc" }] },
        careers: { orderBy: [{ endYear: "desc" }, { startYear: "desc" }] },
        partyAffiliations: { orderBy: { startDate: "desc" }, include: { party: true } },
        committees: { orderBy: { startDate: "desc" }, include: { term: true } },
        sponsoredBills: { orderBy: { introducedDate: "desc" } },
        elections: {
          orderBy: [{ year: "desc" }, { electionDate: "desc" }],
          include: { party: true, state: true, constituency: true, lga: true, ward: true },
        },
        assetDeclarations: { orderBy: { year: "desc" } },
        awards: { orderBy: { year: "desc" } },
        publications: { orderBy: { year: "desc" } },
        familyMembers: { include: { relatedOfficial: { select: { name: true, slug: true } } } },
        legalCases: {
          orderBy: { filedDate: "desc" },
          include: { relatedCorruptionCase: { select: { slug: true, title: true, status: true } } },
        },
    } satisfies Prisma.NigerianOfficialInclude;

    let official = await this.prisma.nigerianOfficial.findUnique({ where, include });

    // Slug miss? It may be a former slug of a renamed official. Fall back to the
    // alias table so old links still resolve; the caller compares official.slug to
    // the requested slug and 308-redirects to the canonical URL.
    if (!official && !UUID_RE.test(idOrSlug)) {
      const alias = await this.prisma.officialSlugAlias.findUnique({
        where: { slug: idOrSlug },
        select: { officialId: true },
      });
      if (alias) {
        official = await this.prisma.nigerianOfficial.findUnique({
          where: { id: alias.officialId },
          include,
        });
      }
    }

    if (!official || official.deletedAt) {
      // Soft-deleted officials are hidden from the public API (plan 62 §12).
      throw new NotFoundException("Official not found");
    }

    // Corruption involvement — independent domain, joined via polymorphic subject.
    const caseParties = await this.prisma.corruptionCaseParty.findMany({
      where: { subjectType: "official", subjectId: official.id },
      include: { case: { select: { id: true, slug: true, title: true, status: true, caseType: true, forum: true, amountInvolved: true, currency: true } } },
    });

    // ONE batched evidence query for every fact on the profile (no N+1).
    const entryIds = [
      official.id, // official_field evidence (biography, legacy education)
      ...official.positions.map((p) => p.id),
      ...official.educationRecords.map((r) => r.id),
      ...official.careers.map((r) => r.id),
      ...official.partyAffiliations.map((r) => r.id),
      ...official.committees.map((r) => r.id),
      ...official.sponsoredBills.map((r) => r.id),
      ...official.elections.map((r) => r.id),
      ...official.assetDeclarations.map((r) => r.id),
      ...official.awards.map((r) => r.id),
      ...official.publications.map((r) => r.id),
      ...official.familyMembers.map((r) => r.id),
      ...official.legalCases.map((r) => r.id),
      ...caseParties.map((p) => p.id),
    ];
    const evidence = await this.evidence.loadForEntries(entryIds);
    const ev = (id: string): EvidenceView[] => evidence.get(id) ?? [];
    const prov = (r: {
      id: string;
      confidence: string;
      sourceType: string;
      reviewStatus: string;
      lastVerifiedAt: Date | null;
    }) => ({
      id: r.id,
      confidence: r.confidence,
      sourceType: r.sourceType,
      reviewStatus: r.reviewStatus,
      lastVerifiedAt: r.lastVerifiedAt?.toISOString() ?? null,
      evidence: ev(r.id),
    });

    // "Proposed" = created by a citizen "identify" submission that an admin has not
    // yet approved. The included `proposals` are already filtered to pending statuses
    // (submitted/under_review); an identify proposal means the whole record is unverified.
    // Self-clearing: approve()/reject() move the proposal out of the pending set.
    const proposed = official.proposals.some(
      (p) => (p.proposedValue as any)?.type === "identify",
    );

    return {
      ...this.formatOfficial(official),
      officialType: official.officialType ?? null,
      proposed,
      fieldEvidence: {
        biography: evidence.get(EvidenceService.key(official.id, "biography")) ?? [],
        education: evidence.get(EvidenceService.key(official.id, "education")) ?? [],
      },
      educationRecords: official.educationRecords.map((r) => ({
        ...prov(r),
        institution: r.institution,
        institutionType: r.institutionType,
        qualification: r.qualification,
        field: r.field,
        startYear: r.startYear,
        endYear: r.endYear,
        graduated: r.graduated,
        location: r.location,
      })),
      careerRecords: official.careers.map((r) => ({
        ...prov(r),
        organization: r.organization,
        role: r.role,
        industry: r.industry,
        employmentType: r.employmentType,
        startYear: r.startYear,
        endYear: r.endYear,
        description: r.description,
      })),
      partyHistory: official.partyAffiliations.map((r) => ({
        ...prov(r),
        party: r.partyAcronym,
        partyName: r.party?.name ?? null,
        startDate: dateOnly(r.startDate),
        endDate: dateOnly(r.endDate),
        reason: r.reason,
      })),
      committees: official.committees.map((r) => ({
        ...prov(r),
        committeeName: r.committeeName,
        chamber: r.chamber,
        role: r.role,
        termName: r.term?.name ?? null,
        startDate: dateOnly(r.startDate),
        endDate: dateOnly(r.endDate),
      })),
      sponsoredBills: official.sponsoredBills.map((r) => ({
        ...prov(r),
        title: r.title,
        billNumber: r.billNumber,
        chamber: r.chamber,
        role: r.role,
        status: r.status,
        introducedDate: dateOnly(r.introducedDate),
        statusDate: dateOnly(r.statusDate),
        summary: r.summary,
      })),
      elections: official.elections.map((r) => ({
        ...prov(r),
        electionType: r.electionType,
        isPrimary: r.isPrimary,
        year: r.year,
        electionDate: dateOnly(r.electionDate),
        party: r.partyAcronym,
        partyName: r.party?.name ?? null,
        state: r.state?.name ?? null,
        constituency: r.constituency?.name ?? null,
        lga: r.lga?.name ?? null,
        ward: r.ward?.name ?? null,
        result: r.result,
        votes: r.votes,
        votePercentage: r.votePercentage ? Number(r.votePercentage) : null,
        winnerName: r.winnerName,
        resultedInPositionId: r.resultedInPositionId,
        notes: r.notes,
      })),
      assetDeclarations: official.assetDeclarations.map((r) => ({
        ...prov(r),
        year: r.year,
        declaredTo: r.declaredTo,
        amount: r.amount ? Number(r.amount) : null,
        currency: r.currency,
        summary: r.summary,
      })),
      awards: official.awards.map((r) => ({
        ...prov(r),
        title: r.title,
        awardedBy: r.awardedBy,
        year: r.year,
        category: r.category,
        description: r.description,
      })),
      publications: official.publications.map((r) => ({
        ...prov(r),
        title: r.title,
        type: r.type,
        publisher: r.publisher,
        year: r.year,
      })),
      familyMembers: official.familyMembers.map((r) => ({
        ...prov(r),
        relationship: r.relationship,
        name: r.name,
        isPublicFigure: r.isPublicFigure,
        notes: r.notes,
        relatedOfficial: r.relatedOfficial
          ? { name: r.relatedOfficial.name, slug: r.relatedOfficial.slug }
          : null,
      })),
      legalCases: official.legalCases.map((r) => ({
        ...prov(r),
        title: r.title,
        caseType: r.caseType,
        status: r.status,
        forum: r.forum,
        caseNumber: r.caseNumber,
        filedDate: dateOnly(r.filedDate),
        resolvedDate: dateOnly(r.resolvedDate),
        outcome: r.outcome,
        relatedCorruptionCase: r.relatedCorruptionCase ?? null,
      })),
      corruptionCases: caseParties.map((p) => ({
        ...prov(p),
        roleInCase: p.role,
        outcome: p.outcome,
        case: {
          slug: p.case.slug,
          title: p.case.title,
          status: p.case.status,
          caseType: p.case.caseType,
          forum: p.case.forum,
          amountInvolved: p.case.amountInvolved ? Number(p.case.amountInvolved) : null,
          currency: p.case.currency,
        },
      })),
    };
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
    if (lgaCode) {
      const mhaPositions = await this.prisma.officialPosition.findMany({
        where: {
          role: "mha",
          status: "active",
          official: { deletedAt: null },
          constituencyCode: { startsWith: `state_${stateCode}_` },
        },
        include: { official: true, party: true, constituency: true, term: true },
      });

      if (mhaPositions.length > 0) {
        let matched: (typeof mhaPositions)[0] | undefined;

        // Strategy 1: Use constituency_wards table if we have a ward code
        if (wardCode) {
          const wardMapping = await this.prisma.constituencyWard.findFirst({
            where: { wardCode, constituency: { type: "state" } },
          });
          if (wardMapping) {
            matched = mhaPositions.find((p) => p.constituencyCode === wardMapping.constituencyCode);
          }
        }

        // Strategy 2: Match by LGA name in constituency name
        if (!matched) {
          const lgaRecord = await this.prisma.nigerianLga.findUnique({ where: { code: lgaCode } });
          const lgaName = lgaRecord?.name?.toLowerCase();
          if (lgaName) {
            matched = mhaPositions.find((p) =>
              p.constituency?.name?.toLowerCase().includes(lgaName),
            );
          }
        }

        // Strategy 3: Match by LGA code embedded in constituency code
        if (!matched) {
          const lgaSuffix = lgaCode.replace(`${stateCode}-`, "");
          matched = mhaPositions.find((p) =>
            p.constituencyCode?.includes(lgaSuffix),
          );
        }

        if (matched) {
          chain.push(this.formatPositionResult(matched, "mha", { stateCode, lgaCode }));
        } else {
          chain.push({ role: "mha", scope: { stateCode, lgaCode }, official: null, position: null });
        }
      } else {
        chain.push({ role: "mha", scope: { stateCode, lgaCode }, official: null, position: null });
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
          official: { deletedAt: null },
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
          const lgaName = lgaRecord?.name?.toLowerCase();
          if (lgaName) {
            matched = fedPositions.find((p) =>
              p.constituency?.name?.toLowerCase().includes(lgaName),
            );
          }
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
          official: { deletedAt: null },
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
      // official.deletedAt filter: soft-deleted officials never surface (plan 62 §12)
      where: { role, status: "active", official: { deletedAt: null }, ...scope },
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
        where: {
          role,
          status: "active",
          stateCode: scope.stateCode,
          official: { deletedAt: null },
        },
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
          official: { deletedAt: null },
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
        where: {
          role,
          status: "active",
          wardCode: scope.wardCode,
          official: { deletedAt: null },
        },
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
      slug: official.slug ?? null,
      name: official.name,
      imageUrl: official.imageUrl,
      dateOfBirth: official.dateOfBirth
        ? official.dateOfBirth.toISOString().split("T")[0]
        : null,
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
        status: p.status,
        isCurrent:
          p.status === "active" && (!p.endDate || p.endDate.getTime() > Date.now()),
        party: p.party?.acronym ?? p.partyAcronym ?? null,
        partyName: p.party?.name ?? null,
        // Ward-scoped offices (councilors) only store ward_code; derive the
        // LGA and state from the ward's parent relations when absent.
        state: p.state?.name ?? p.ward?.lga?.state?.name ?? null,
        stateCode: p.stateCode ?? p.ward?.lga?.stateCode ?? null,
        lga: p.lga?.name ?? p.ward?.lga?.name ?? null,
        lgaCode: p.lgaCode ?? p.ward?.lgaCode ?? null,
        constituency: p.constituency?.name ?? null,
        constituencyCode: p.constituencyCode,
        ward: p.ward?.name ?? null,
        wardCode: p.wardCode,
        startDate: p.startDate?.toISOString().split("T")[0] ?? null,
        endDate: p.endDate?.toISOString().split("T")[0] ?? null,
        endReason: p.endReason ?? null,
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

  /**
   * @deprecated Legacy flat-field fallback, used only when completeness_score
   * is null (pre-backfill rows). The real definition lives in
   * @ournigeria/shared-types and is computed by CompletenessService (Plan 45c).
   */
  computeCompleteness(official: any): number {
    let filled = 0;
    for (const field of TRACKED_FIELDS) {
      if (official[field] != null && official[field] !== "") {
        filled++;
      }
    }
    return Number((filled / TRACKED_FIELDS.length).toFixed(2));
  }

  /** Delegates to the single category-aware implementation (Plan 45c, Fix #4). */
  async recomputeCompleteness(officialId: string) {
    await this.completenessService.recompute(officialId);
  }
}

