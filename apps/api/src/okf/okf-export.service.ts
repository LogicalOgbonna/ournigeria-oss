import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { EvidenceService, EvidenceView } from "../evidence/evidence.service";
import { OfficialsService } from "../officials/officials.service";
import { okfSlug } from "./slug";
import { renderOfficial } from "./render/official";
import { renderCase } from "./render/case";
import { renderParty, renderState, renderLga } from "./render/geo";
import { renderTypeIndex, renderRootIndex, findDanglingLinks } from "./render/index-docs";
import { renderViz } from "./render/viz";
import type { Bundle, OfficialNode, CaseNode } from "./types";

const yearOf = (d: string | null | undefined): number | null =>
  d ? Number(String(d).slice(0, 4)) || null : null;

@Injectable()
export class OkfExportService {
  private readonly log = new Logger(OkfExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly officials: OfficialsService,
    private readonly evidence: EvidenceService,
    private readonly config: ConfigService,
  ) {}

  private webBase() {
    return this.config.get<string>("OKF_WEB_BASE_URL") ?? "https://app.ournigeria.ng";
  }
  private snapshotBase() {
    return this.config.get<string>("OKF_SNAPSHOT_BASE_URL") ?? this.config.get<string>("CDN_BASE_URL") ?? "";
  }

  async buildBundle(timestamp: string): Promise<Bundle> {
    const bundle: Bundle = new Map();
    const snap = this.snapshotBase();
    const web = this.webBase();
    const populatedLgaCodes = new Set<string>();
    let skipped = 0;

    // --- officials (enumerate by slug, then rich-fetch each) ---
    const officialRows = await this.prisma.nigerianOfficial.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
      orderBy: { slug: "asc" },
    });
    const officialIndex: Array<{ slug: string; title: string }> = [];
    for (const { slug } of officialRows) {
      if (!slug) continue;
      try {
        const full = await this.officials.getByIdOrSlug(slug);
        const node = this.toOfficialNode(full, slug, timestamp, web);
        if (node.currentLga) populatedLgaCodes.add(node.currentLga.code);
        bundle.set(`officials/${slug}.md`, renderOfficial(node, snap));
        officialIndex.push({ slug, title: node.name });
      } catch (e) {
        skipped++;
        this.log.warn(`skip official ${slug}: ${(e as Error).message}`);
      }
    }

    // --- cases (with batched evidence across case/party/update rows) ---
    const caseRows = await this.prisma.corruptionCase.findMany({
      orderBy: { slug: "asc" },
      include: { parties: true, updates: { orderBy: { eventDate: "asc" } } },
    });
    const subjectIds = caseRows.flatMap((c) =>
      c.parties.filter((p) => p.subjectType === "official" && p.subjectId).map((p) => p.subjectId as string),
    );
    const subjects = subjectIds.length
      ? await this.prisma.nigerianOfficial.findMany({ where: { id: { in: subjectIds } }, select: { id: true, slug: true } })
      : [];
    const slugById = new Map(subjects.map((s) => [s.id, s.slug]));
    const evidenceIds = caseRows.flatMap((c) => [c.id, ...c.parties.map((p) => p.id), ...c.updates.map((u) => u.id)]);
    const evMap = await this.evidence.loadForEntries(evidenceIds);
    const ev = (id: string): EvidenceView[] => evMap.get(id) ?? [];

    const caseIndex: Array<{ slug: string; title: string }> = [];
    for (const c of caseRows) {
      bundle.set(`cases/${c.slug}.md`, renderCase(this.toCaseNode(c, slugById, ev, timestamp, web), snap));
      caseIndex.push({ slug: c.slug, title: c.title });
    }

    // --- parties ---
    const parties = await this.prisma.politicalParty.findMany({ orderBy: { acronym: "asc" } });
    const partyIndex: Array<{ slug: string; title: string }> = [];
    for (const p of parties) {
      const slug = p.acronym.toLowerCase();
      bundle.set(
        `parties/${slug}.md`,
        renderParty({ slug, acronym: p.acronym, name: p.name, isActive: p.isActive, timestamp, resource: `${web}/parties/${slug}` }),
      );
      partyIndex.push({ slug, title: p.name });
    }

    // --- states ---
    const states = await this.prisma.nigerianState.findMany({ orderBy: { code: "asc" }, include: { zone: true } });
    const stateNameByCode = new Map(states.map((s) => [s.code, s.name]));
    const stateIndex: Array<{ slug: string; title: string }> = [];
    for (const s of states) {
      bundle.set(
        `states/${s.code}.md`,
        renderState({ slug: s.code, code: s.code, name: s.name, capital: s.capital, zone: s.zone?.name ?? null, timestamp, resource: `${web}/states/${s.code}` }),
      );
      stateIndex.push({ slug: s.code, title: s.name });
    }

    // --- LGAs (populated only) ---
    const lgaIndex: Array<{ slug: string; title: string }> = [];
    if (populatedLgaCodes.size) {
      const lgas = await this.prisma.nigerianLga.findMany({ where: { code: { in: [...populatedLgaCodes] } }, orderBy: { code: "asc" } });
      for (const l of lgas) {
        const slug = okfSlug(l.code);
        bundle.set(
          `lgas/${slug}.md`,
          renderLga({ slug, code: l.code, name: l.name, stateCode: l.stateCode, stateName: stateNameByCode.get(l.stateCode) ?? l.stateCode, timestamp, resource: `${web}/lgas/${slug}` }),
        );
        lgaIndex.push({ slug, title: l.name });
      }
    }

    // --- indexes ---
    bundle.set("officials/index.md", renderTypeIndex("officials", officialIndex));
    bundle.set("cases/index.md", renderTypeIndex("cases", caseIndex));
    bundle.set("parties/index.md", renderTypeIndex("parties", partyIndex));
    bundle.set("states/index.md", renderTypeIndex("states", stateIndex));
    if (lgaIndex.length) bundle.set("lgas/index.md", renderTypeIndex("lgas", lgaIndex));
    bundle.set(
      "index.md",
      renderRootIndex({ officials: officialIndex.length, cases: caseIndex.length, parties: partyIndex.length, states: stateIndex.length, lgas: lgaIndex.length }),
    );

    // --- integrity + viz ---
    const dangling = findDanglingLinks(bundle);
    if (dangling.length) this.log.warn(`${dangling.length} dangling internal links (rendered as text by consumers)`);
    bundle.set("viz.html", renderViz(Object.fromEntries(bundle)));

    this.log.log(`bundle built: ${bundle.size} files, ${skipped} officials skipped`);
    if (skipped > Math.max(10, officialRows.length * 0.1)) {
      throw new Error(`too many officials skipped (${skipped}/${officialRows.length}) — aborting`);
    }
    return bundle;
  }

  // ---- mappers ----
  private toOfficialNode(
    full: Awaited<ReturnType<OfficialsService["getByIdOrSlug"]>>,
    slug: string,
    timestamp: string,
    web: string,
  ): OfficialNode {
    const f = full as Record<string, any>;
    const positions: any[] = f.positions ?? [];
    const current = positions[0];
    const currentState = current?.stateCode ? { code: current.stateCode, name: current.state ?? current.stateCode } : null;
    const currentParty = current?.party ? { acronym: current.party, name: current.partyName ?? current.party } : null;
    const currentLga = current?.lgaCode ? { code: current.lgaCode, name: current.lga ?? current.lgaCode } : null;
    return {
      slug,
      name: f.name,
      officialType: f.officialType ?? null,
      description:
        [current?.role, currentParty ? `(${currentParty.acronym})` : null].filter(Boolean).join(" ") ||
        (f.officialType ?? "Public official"),
      completeness: typeof f.completenessScore === "number" ? f.completenessScore : null,
      timestamp,
      resource: `${web}/officials/${slug}`,
      biography: f.biography ?? null,
      biographyEvidence: f.fieldEvidence?.biography ?? [],
      currentState,
      currentParty,
      currentLga,
      ward: current?.ward ?? null,
      positions: positions.map((p) => ({
        title: p.role ?? "Position",
        stateName: p.state ?? null,
        stateCode: p.stateCode ?? null,
        partyAcronym: p.party ?? null,
        partyName: p.partyName ?? null,
        startYear: yearOf(p.startDate),
        endYear: yearOf(p.endDate),
        isCurrent: Boolean(p.isCurrent),
        evidence: [],
      })),
      educationRecords: f.educationRecords ?? [],
      careerRecords: f.careerRecords ?? [],
      partyHistory: f.partyHistory ?? [],
      committees: f.committees ?? [],
      sponsoredBills: f.sponsoredBills ?? [],
      elections: (f.elections ?? []).map((e: any) => ({ ...e, partyAcronym: e.party })),
      assetDeclarations: f.assetDeclarations ?? [],
      awards: f.awards ?? [],
      publications: f.publications ?? [],
      familyMembers: (f.familyMembers ?? []).map((m: any) => ({ ...m, relatedOfficialSlug: m.relatedOfficial?.slug ?? null })),
      legalCases: f.legalCases ?? [],
      corruptionCaseLinks: (f.corruptionCases ?? []).map((c: any) => ({
        slug: c.case.slug,
        title: c.case.title,
        status: c.case.status,
        evidence: c.evidence ?? [],
      })),
    };
  }

  private toCaseNode(
    c: any,
    slugById: Map<string, string | null>,
    ev: (id: string) => EvidenceView[],
    timestamp: string,
    web: string,
  ): CaseNode {
    return {
      slug: c.slug,
      title: c.title,
      description: [
        c.caseType,
        c.status ? `(${c.status})` : null,
        c.amountInvolved ? `— ₦${Number(c.amountInvolved).toLocaleString("en-US")}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      caseType: c.caseType ?? null,
      status: c.status ?? null,
      forum: c.forum ?? null,
      amountInvolved: c.amountInvolved ? Number(c.amountInvolved) : null,
      currency: c.currency ?? null,
      stateCode: c.stateCode ?? null,
      timestamp,
      resource: `${web}/case/${c.slug}`,
      summary: c.summary ?? null,
      caseEvidence: ev(c.id),
      parties: c.parties.map((p: any) => ({
        role: p.role ?? null,
        outcome: p.outcome ?? null,
        officialSlug: p.subjectId ? (slugById.get(p.subjectId) ?? null) : null,
        name: p.subjectName ?? "Unknown",
        evidence: ev(p.id),
      })),
      updates: c.updates.map((u: any) => ({
        eventDate: u.eventDate ? new Date(u.eventDate).toISOString().slice(0, 10) : null,
        eventType: u.eventType ?? null,
        description: u.description ?? "",
        evidence: ev(u.id),
      })),
    };
  }
}
