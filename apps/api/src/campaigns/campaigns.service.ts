import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaService } from "@ournigeria/database";
import { GeoSeatResolver } from "../election/geo-seat-resolver";
import { Office, OFFICE_ELECTION_TYPE, OFFICE_LABEL, OFFICE_ORDER } from "../election/office-map";
import { PUBLIC_STATUSES } from "./campaign-shared";

/**
 * Public read model for `campaigns` — one ticket in one race, with its
 * council, documents, media and rival slates.
 *
 * VISIBILITY. Mirrors `PartiesService.computeCandidates` in the one rule that
 * matters on a transparency site: a low-confidence row never shows. Beyond
 * that a campaign is public while it is `active` or `concluded` AND a
 * reviewer has marked it `reviewed` (the dashboard review gate); drafts and
 * unreviewed rows never leak; `withdrawn`, `suspended` and `dissolved`
 * tickets drop out of every list and 404 by slug.
 *
 * There is deliberately NO year gate here (computeCandidates hides
 * `year > now()` because a flag-bearer grid on a party page is about past
 * results). Campaigns are pre-election content by definition. Whether the
 * election UI renders at all is awanaija's call via the PostHog
 * `election-gate` flag (`apps/awanaija/src/lib/election-gate.ts`); the API
 * only guarantees nothing low-confidence or withdrawn leaks through it.
 */

export const CAMPAIGN_ELECTION_TYPES = [
  "presidential",
  "gubernatorial",
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "lga_chairman",
  "councilor",
  "other",
] as const;

export type CampaignElectionType = (typeof CAMPAIGN_ELECTION_TYPES)[number];


const partySelect = {
  select: { acronym: true, name: true, logoUrl: true, color: true },
} satisfies Prisma.Campaign$partyArgs;

const personSelect = {
  select: { id: true, slug: true, name: true, dateOfBirth: true, imageUrl: true },
} satisfies Prisma.Campaign$candidateOfficialArgs;

/** The image slots a list consumer (the poster rail) needs; detail returns all. */
const RAIL_MEDIA_TYPES = ["poster_candidate", "poster_mate", "logo"] as const;

const summaryInclude = {
  party: partySelect,
  candidateOfficial: personSelect,
  runningMate: personSelect,
  media: {
    where: { type: { in: [...RAIL_MEDIA_TYPES] } },
    orderBy: [{ type: "asc" }, { displayOrder: "asc" }],
    select: { id: true, type: true, url: true, caption: true, displayOrder: true, metadata: true },
  },
} satisfies Prisma.CampaignInclude;

type SummaryRow = Prisma.CampaignGetPayload<{ include: typeof summaryInclude }>;

export interface CampaignListFilters {
  readonly year?: number;
  readonly electionType?: CampaignElectionType;
  readonly party?: string;
  readonly state?: string;
  readonly constituency?: string;
  readonly lga?: string;
}

export interface BallotParams {
  readonly state: string;
  readonly lga?: string;
  readonly ward?: string;
  readonly year: number;
  /** Subset of offices to resolve; default = every office. */
  readonly offices?: readonly Office[];
}

export interface BallotRace {
  office: Office;
  electionType: CampaignElectionType;
  seatLabel: string;
  seatCode: string | null;
  tickets: CampaignSummary[];
}

export type CampaignSummary = ReturnType<CampaignsService["summary"]>;

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private resolver: GeoSeatResolver,
  ) {}

  /** The where-clause every public read goes through. One place, not four. */
  private publicWhere(): Prisma.CampaignWhereInput {
    return {
      status: { in: [...PUBLIC_STATUSES] },
      reviewStatus: "reviewed",
      confidence: { not: "low" },
    };
  }

  async list(filters: CampaignListFilters) {
    const rows = await this.prisma.campaign.findMany({
      where: {
        ...this.publicWhere(),
        ...(filters.year !== undefined ? { year: filters.year } : {}),
        ...(filters.electionType ? { electionType: filters.electionType } : {}),
        ...(filters.party ? { partyAcronym: filters.party.toUpperCase() } : {}),
        ...(filters.state ? { stateCode: filters.state.toLowerCase() } : {}),
        ...(filters.constituency ? { constituencyCode: filters.constituency.toLowerCase() } : {}),
        ...(filters.lga ? { lgaCode: filters.lga.toLowerCase() } : {}),
      },
      include: summaryInclude,
      // Race first (type, year, scope) so an unscoped down-ballot list groups
      // per race instead of interleaving Lagos#1, Osun#1, Lagos#2…; then the
      // editorial rank (NULL = unranked, last); then a stable tie-break. The
      // leading (electionType, year, displayOrder) matches idx_campaigns_type_year_order.
      orderBy: [
        { electionType: "asc" },
        { year: "desc" },
        { stateCode: "asc" },
        { constituencyCode: "asc" },
        { lgaCode: "asc" },
        { displayOrder: { sort: "asc", nulls: "last" } },
        { partyAcronym: "asc" },
        { slug: "asc" },
      ],
    });
    return rows.map((r) => this.summary(r));
  }

  async getBySlug(slugParam: string) {
    const slug = slugParam.trim().toLowerCase();
    const row = await this.prisma.campaign.findFirst({
      where: { slug, ...this.publicWhere() },
      include: {
        ...summaryInclude,
        state: { select: { code: true, name: true } },
        constituency: { select: { code: true, name: true, type: true } },
        lga: { select: { code: true, name: true } },
        documents: {
          orderBy: [{ kind: "asc" }, { subject: "asc" }],
        },
        // Every slot, not just the rail's three.
        media: {
          orderBy: [{ type: "asc" }, { displayOrder: "asc" }],
          select: { id: true, type: true, url: true, caption: true, displayOrder: true, metadata: true },
        },
        council: {
          where: { status: "active" },
          include: {
            role: { select: { code: true, label: true, sortOrder: true } },
            official: { select: { id: true, slug: true, name: true, imageUrl: true } },
            state: { select: { code: true, name: true } },
            lga: { select: { code: true, name: true } },
          },
          orderBy: [{ role: { sortOrder: "asc" } }, { displayOrder: "asc" }, { name: "asc" }],
        },
      },
    });
    if (!row) throw new NotFoundException("Campaign not found");

    // Rival slates: every other public ticket on the same race key. The route
    // never picks one silently — the caller lists them.
    const rivals = await this.prisma.campaign.findMany({
      where: {
        ...this.publicWhere(),
        id: { not: row.id },
        electionType: row.electionType,
        year: row.year,
        stateCode: row.stateCode,
        constituencyCode: row.constituencyCode,
        lgaCode: row.lgaCode,
        partyAcronym: row.partyAcronym,
      },
      select: {
        slug: true,
        candidateName: true,
        runningMateName: true,
        factionLabel: true,
        isDisputed: true,
      },
      orderBy: { slug: "asc" },
    });

    return {
      ...this.summary(row),
      scope: {
        state: row.state,
        constituency: row.constituency,
        lga: row.lga,
      },
      visionLine: row.visionLine,
      fineprint: row.fineprint,
      pullQuote: row.pullQuote,
      pullQuoteBg: row.pullQuoteBg,
      candidateBio: row.candidateBio,
      documents: row.documents.map((d) => ({
        id: d.id,
        kind: d.kind,
        subject: d.subject,
        title: d.title,
        blurb: d.blurb,
        coverUrl: d.coverUrl,
        fileUrl: d.fileUrl,
        pageCount: d.pageCount,
      })),
      council: row.council.map((c) => ({
        id: c.id,
        role: { code: c.role.code, label: c.role.label },
        name: c.official?.name ?? c.name,
        imageUrl: c.official?.imageUrl ?? c.imageUrl,
        officialSlug: c.official?.slug ?? null,
        scopeLevel: c.scopeLevel,
        state: c.state,
        lga: c.lga,
        startDate: c.startDate ? c.startDate.toISOString().slice(0, 10) : null,
      })),
      rivals: rivals.map((r) => ({
        slug: r.slug,
        candidateName: r.candidateName,
        runningMateName: r.runningMateName,
        factionLabel: r.factionLabel,
        isDisputed: r.isDisputed,
      })),
      provenance: {
        confidence: row.confidence,
        sourceType: row.sourceType,
        sourceUrl: row.sourceUrl,
        reviewStatus: row.reviewStatus,
        lastVerifiedAt: row.lastVerifiedAt,
      },
    };
  }

  /**
   * The races a viewer at (state, lga, ward) can vote in, each with its public
   * tickets in rail order. Seat resolution is GeoSeatResolver's (the same code
   * /api/election/ballot uses), so senate/hor resolve from an LGA and assembly
   * from a ward. A race with zero public tickets is omitted — the homepage
   * dropdown must not offer an empty rail.
   */
  async ballot(params: BallotParams): Promise<BallotRace[]> {
    // Every geo code is stored lower-case; normalise lga/ward the same way as
    // state so a "LAGOS_AGEGE" query resolves instead of silently missing.
    const state = params.state.trim().toLowerCase();
    const lga = params.lga?.trim().toLowerCase();
    const ward = params.ward?.trim().toLowerCase();
    const wanted = params.offices?.length ? params.offices : OFFICE_ORDER;
    const stateName =
      (await this.prisma.nigerianState.findUnique({ where: { code: state }, select: { name: true } }))?.name ?? state;

    const races = await Promise.all(
      wanted.map(async (office) => {
        try {
          const scope = await this.resolver.resolveOne(office, state, stateName, lga, ward);
          if (!scope) return null;
          // councillor seats key on ward_code, which campaigns does not model.
          if (scope.column === "wardCode") return null;
          // office-map and CAMPAIGN_ELECTION_TYPES share one vocabulary (the
          // office-map test proves the round trip); OFFICE_ELECTION_TYPE is
          // only typed `string`, so narrow it once, here.
          const electionType = OFFICE_ELECTION_TYPE[office] as CampaignElectionType;
          const rows = await this.prisma.campaign.findMany({
            where: {
              ...this.publicWhere(),
              electionType,
              year: params.year,
              ...(scope.column === "stateCode" ? { stateCode: scope.code } : {}),
              ...(scope.column === "constituencyCode" ? { constituencyCode: scope.code } : {}),
              ...(scope.column === "lgaCode" ? { lgaCode: scope.code } : {}),
            },
            include: summaryInclude,
            orderBy: [{ displayOrder: { sort: "asc", nulls: "last" } }, { partyAcronym: "asc" }, { slug: "asc" }],
          });
          if (rows.length === 0) return null;
          return {
            office,
            electionType,
            seatLabel: scope.label || OFFICE_LABEL[office],
            seatCode: scope.code,
            tickets: rows.map((r) => this.summary(r)),
          } satisfies BallotRace;
        } catch (err) {
          // Same rule as election.service.ts getBallot (#G): one bad seat query
          // must not blank the whole ballot. Here the race is simply omitted,
          // which is what this endpoint already does with an empty race.
          console.error("campaigns ballot race error:", office, err);
          return null;
        }
      }),
    );
    return races.filter((r): r is BallotRace => r !== null);
  }

  summary(r: SummaryRow) {
    return {
      id: r.id,
      slug: r.slug,
      electionType: r.electionType,
      year: r.year,
      status: r.status,
      party: r.party
        ? { acronym: r.party.acronym, name: r.party.name, logoUrl: r.party.logoUrl, color: r.party.color }
        : r.partyAcronym
          ? { acronym: r.partyAcronym, name: null, logoUrl: null, color: null }
          : null,
      // Linked official wins over the denormalized fallback; the fallback exists
      // for first-time candidates with no official row yet.
      candidate: {
        name: r.candidateOfficial?.name ?? r.candidateName,
        shortName: r.candidateShortName,
        imageUrl: r.candidateImageUrl ?? r.candidateOfficial?.imageUrl ?? null,
        officialSlug: r.candidateOfficial?.slug ?? null,
        dateOfBirth: r.candidateOfficial?.dateOfBirth
          ? r.candidateOfficial.dateOfBirth.toISOString().slice(0, 10)
          : null,
      },
      runningMate:
        r.runningMate || r.runningMateName
          ? {
              name: r.runningMate?.name ?? r.runningMateName,
              imageUrl: r.runningMateImageUrl ?? r.runningMate?.imageUrl ?? null,
              officialSlug: r.runningMate?.slug ?? null,
              dateOfBirth: r.runningMate?.dateOfBirth
                ? r.runningMate.dateOfBirth.toISOString().slice(0, 10)
                : null,
            }
          : null,
      brandColor: r.brandColor,
      factionLabel: r.factionLabel,
      isDisputed: r.isDisputed,
      displayOrder: r.displayOrder,
      media: r.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        caption: m.caption,
        displayOrder: m.displayOrder,
        metadata: m.metadata,
      })),
    };
  }
}
