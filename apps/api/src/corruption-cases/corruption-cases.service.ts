import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService, UUID_RE } from "@ournigeria/database";
import { EvidenceService, EvidenceView } from "../evidence/evidence.service";

/**
 * Curated corruption-case dataset (Plan 45) — independent domain, distinct from
 * the corruption RAG pipeline (corruption_chunks). Parties link to people via a
 * polymorphic subject; officials resolve to their profile slug, everyone else
 * renders by subjectName.
 */
@Injectable()
export class CorruptionCasesService {
  constructor(
    private prisma: PrismaService,
    private evidence: EvidenceService,
  ) {}

  async list(params: {
    status?: string;
    caseType?: string;
    stateCode?: string;
    subject?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, caseType, stateCode, subject, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (caseType) where.caseType = caseType;
    if (stateCode) where.stateCode = stateCode;
    if (subject) {
      where.parties = UUID_RE.test(subject)
        ? { some: { subjectId: subject } }
        : { some: { subjectName: { contains: subject, mode: "insensitive" } } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    const [cases, total] = await Promise.all([
      this.prisma.corruptionCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isLandmark: "desc" }, { updatedAt: "desc" }],
        include: {
          state: { select: { name: true } },
          parties: { take: 5 },
          _count: { select: { parties: true, updates: true } },
        },
      }),
      this.prisma.corruptionCase.count({ where }),
    ]);

    const officialNames = await this.resolveOfficialSubjects(
      cases.flatMap((c) => c.parties),
    );

    return {
      data: cases.map((c) => ({
        ...this.formatCaseSummary(c),
        parties: c.parties.map((p) => this.formatParty(p, officialNames)),
        partyCount: c._count.parties,
        updateCount: c._count.updates,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getBySlug(slug: string) {
    const kase = await this.prisma.corruptionCase.findUnique({
      where: { slug },
      include: {
        state: { select: { name: true } },
        parties: { orderBy: { createdAt: "asc" } },
        updates: { orderBy: { eventDate: "desc" } },
        legalCases: {
          select: { id: true, officialId: true, title: true, status: true },
        },
      },
    });
    if (!kase) throw new NotFoundException("Case not found");

    const officialNames = await this.resolveOfficialSubjects(kase.parties);

    // One batched evidence load: the case itself + every party + every update.
    const evidence = await this.evidence.loadForEntries([
      kase.id,
      ...kase.parties.map((p) => p.id),
      ...kase.updates.map((u) => u.id),
    ]);
    const ev = (id: string): EvidenceView[] => evidence.get(id) ?? [];

    return {
      ...this.formatCaseSummary(kase),
      summary: kase.summary,
      outcome: kase.outcome,
      sentence: kase.sentence,
      sector: kase.sector,
      openedDate: kase.openedDate?.toISOString().split("T")[0] ?? null,
      chargeDate: kase.chargeDate?.toISOString().split("T")[0] ?? null,
      verdictDate: kase.verdictDate?.toISOString().split("T")[0] ?? null,
      amountRecovered: kase.amountRecovered ? Number(kase.amountRecovered) : null,
      evidence: ev(kase.id),
      parties: kase.parties.map((p) => ({
        ...this.formatParty(p, officialNames),
        outcome: p.outcome,
        confidence: p.confidence,
        reviewStatus: p.reviewStatus,
        evidence: ev(p.id),
      })),
      updates: kase.updates.map((u) => ({
        id: u.id,
        eventDate: u.eventDate.toISOString().split("T")[0],
        eventType: u.eventType,
        description: u.description,
        confidence: u.confidence,
        evidence: ev(u.id),
      })),
      relatedLegalCases: kase.legalCases,
    };
  }

  /** Batch-resolve official subjects → { name, slug } for profile links. */
  private async resolveOfficialSubjects(
    parties: { subjectType: string; subjectId: string | null }[],
  ): Promise<Map<string, { name: string; slug: string | null }>> {
    const ids = [
      ...new Set(
        parties
          .filter((p) => p.subjectType === "official" && p.subjectId)
          .map((p) => p.subjectId as string),
      ),
    ];
    if (ids.length === 0) return new Map();
    const officials = await this.prisma.nigerianOfficial.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true },
    });
    return new Map(officials.map((o) => [o.id, { name: o.name, slug: o.slug }]));
  }

  private formatCaseSummary(c: any) {
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      caseType: c.caseType,
      status: c.status,
      forum: c.forum,
      state: c.state?.name ?? null,
      stateCode: c.stateCode,
      amountInvolved: c.amountInvolved ? Number(c.amountInvolved) : null,
      currency: c.currency,
      isLandmark: c.isLandmark,
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  private formatParty(
    p: any,
    officialNames: Map<string, { name: string; slug: string | null }>,
  ) {
    const resolved =
      p.subjectType === "official" && p.subjectId
        ? officialNames.get(p.subjectId) ?? null
        : null;
    return {
      id: p.id,
      subjectType: p.subjectType,
      subjectName: resolved?.name ?? p.subjectName,
      officialSlug: resolved?.slug ?? null,
      partyType: p.partyType,
      role: p.role,
    };
  }
}
