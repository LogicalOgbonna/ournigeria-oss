import type { TicketArtwork } from "@/components/civic/CandidateTicket";
import { ApiError, apiFetch } from "@/lib/api";
import type { RailCandidate } from "@/lib/home-ballot";
import { partyColor } from "@/lib/partyColors";
import type { TicketDoc, TicketPerson, TicketProfile } from "@/lib/presidential-profiles-2027";

/**
 * Campaigns (tickets) from the API — `GET /api/campaigns` and
 * `GET /api/campaigns/:slug` — and the adapters that turn a campaign into the
 * two shapes the election UI already renders: a `RailCandidate` for the poster
 * rail and a `TicketProfile` for the ticket page. Nothing here is hardcoded;
 * the 2027 field, its artwork geometry and its editorial copy all live in the
 * DB (seeded by packages/database/scripts/seed-campaigns.ts).
 *
 * Server-side only: the fetches use Next's `revalidate` cache.
 */

/**
 * Same window as the homepage's ISR (`revalidate = 300` in app/page.tsx): after
 * a seed run on prod the rail is right within five minutes, not an hour.
 */
export const CAMPAIGNS_REVALIDATE = 300;

// ----- API read model -----

export interface CampaignPerson {
  readonly name: string;
  readonly shortName?: string | null;
  readonly imageUrl: string | null;
  readonly officialSlug: string | null;
  readonly dateOfBirth: string | null;
}

export interface CampaignMedia {
  readonly id: string;
  readonly type: string;
  readonly url: string;
  readonly caption: string | null;
  readonly displayOrder: number;
  readonly metadata: unknown;
}

export interface CampaignSummary {
  readonly id: string;
  readonly slug: string;
  readonly electionType: string;
  readonly year: number;
  readonly status: string;
  readonly party: {
    readonly acronym: string;
    readonly name: string | null;
    readonly logoUrl: string | null;
    readonly color: string | null;
  } | null;
  readonly candidate: CampaignPerson;
  readonly runningMate: CampaignPerson | null;
  readonly brandColor: string | null;
  readonly factionLabel: string | null;
  readonly isDisputed: boolean;
  /** Rail position within the race, first = 1; null = unranked (the API sorts it last). */
  readonly displayOrder: number | null;
  readonly media: readonly CampaignMedia[];
  /**
   * Where the race is fought. Absent (undefined) on presidential tickets; the
   * API fills the levels a race has (state for governorship, constituency for
   * NASS/state assembly, lga for council races) and leaves the rest null.
   */
  readonly scope?: {
    readonly state: { readonly code: string; readonly name: string } | null;
    readonly constituency: { readonly code: string; readonly name: string; readonly type: string } | null;
    readonly lga: { readonly code: string; readonly name: string } | null;
  } | null;
}

export interface CampaignDocument {
  readonly id: string;
  readonly kind: "manifesto" | "cv" | "achievements";
  readonly subject: string;
  readonly title: string;
  readonly blurb: string | null;
  readonly coverUrl: string | null;
  readonly fileUrl: string | null;
  readonly pageCount: number | null;
}

export interface CampaignDetail extends CampaignSummary {
  readonly visionLine: string | null;
  readonly fineprint: string | null;
  readonly pullQuote: string | null;
  readonly pullQuoteBg: string | null;
  readonly candidateBio: string | null;
  readonly documents: readonly CampaignDocument[];
  readonly council: readonly unknown[];
  readonly rivals: readonly {
    readonly slug: string;
    readonly candidateName: string;
    readonly runningMateName: string | null;
    readonly factionLabel: string | null;
    readonly isDisputed: boolean;
  }[];
}

// ----- Fetchers -----

/**
 * Fail-soft on 404 ONLY. A 5xx or an unreachable API throws: on an ISR route a
 * thrown regeneration keeps the last good HTML, whereas a swallowed error would
 * cache an empty rail (or a redirect for a real ticket URL) for the whole
 * window. Callers that must never throw (generateStaticParams) catch it.
 */
async function get<T>(path: string, notFound: T, tags: string[] = ["campaigns"]): Promise<T> {
  try {
    return await apiFetch<T>(path, { next: { revalidate: CAMPAIGNS_REVALIDATE, tags } } as RequestInit);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return notFound;
    // Any other failure degrades to the not-found shape instead of throwing:
    // an unreachable API is an empty rail/page section, never a crashed
    // render — and static builds (CI prerender, no API) must still export.
    console.warn(`[campaigns] ${path} failed: ${err instanceof Error ? err.message : err}`);
    return notFound;
  }
}

export function getCampaigns(params: {
  readonly year: number;
  readonly type?: string;
  readonly party?: string;
  readonly state?: string;
  readonly constituency?: string;
  readonly lga?: string;
}): Promise<CampaignSummary[]> {
  const q = new URLSearchParams({ year: String(params.year) });
  if (params.type) q.set("type", params.type);
  if (params.party) q.set("party", params.party);
  if (params.state) q.set("state", params.state);
  if (params.constituency) q.set("constituency", params.constituency);
  if (params.lga) q.set("lga", params.lga);
  return get<CampaignSummary[]>(`/campaigns?${q}`, []);
}

export function getCampaign(slug: string): Promise<CampaignDetail | null> {
  // Per-ticket tag so a dashboard edit revalidates exactly this ticket's page.
  return get<CampaignDetail | null>(`/campaigns/${encodeURIComponent(slug)}`, null, [
    "campaigns",
    `campaign:${slug}`,
  ]);
}

// ----- Official record → the Political Career / Education cards -----

/** One row of the Political Career card. */
export interface CareerEntry {
  readonly span: string;
  readonly office: string;
  /** Small line under the office — chamber, or the nature of the seat. */
  readonly chamber?: string;
}

/** One row of the Education card. */
export interface EducationEntry {
  readonly award: string;
  readonly school: string;
}

export interface OfficialRecords {
  readonly career: readonly CareerEntry[];
  readonly education: readonly EducationEntry[];
}

/** The slice of `GET /api/officials/:slug` the cards read. Everything optional: sparse profiles are the norm. */
interface OfficialRecordSource {
  readonly positions?: readonly {
    readonly role?: string | null;
    readonly startDate?: string | null;
    readonly endDate?: string | null;
    readonly stateName?: string | null;
    readonly state?: { readonly name?: string | null } | null;
    readonly constituency?: { readonly name?: string | null } | null;
  }[];
  readonly careerRecords?: readonly {
    readonly organization?: string | null;
    readonly role?: string | null;
    readonly startYear?: number | null;
    readonly endYear?: number | null;
  }[];
  readonly educationRecords?: readonly {
    readonly institution?: string | null;
    readonly qualification?: string | null;
    readonly field?: string | null;
  }[];
}

const yearOf = (iso: string | null | undefined) => (iso ? iso.slice(0, 4) : null);

/**
 * Political career = positions held (newest first) then the professional
 * career entries; education = the structured education rows. Empty arrays
 * when the profile is sparse — the page hides the cards, it never pads them.
 */
export function toOfficialRecords(
  o: OfficialRecordSource | null | undefined,
  roleLabel: (role: string | null | undefined) => string,
): OfficialRecords {
  if (!o) return { career: [], education: [] };
  const positions = [...(o.positions ?? [])]
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
    .map((p) => {
      const where = p.constituency?.name ?? p.state?.name ?? p.stateName ?? null;
      const from = yearOf(p.startDate);
      return {
        span: from ? `${from} - ${yearOf(p.endDate) ?? "Present"}` : "",
        office: where ? `${roleLabel(p.role)}, ${where}` : roleLabel(p.role),
        chamber: undefined,
      };
    });
  const careers = (o.careerRecords ?? [])
    .filter((c) => c.organization || c.role)
    .map((c) => ({
      span: c.startYear ? `${c.startYear} - ${c.endYear ?? "Present"}` : "",
      office: c.role ? `${c.role}, ${c.organization ?? ""}`.replace(/, $/, "") : (c.organization ?? ""),
      chamber: c.role && c.organization ? "Private sector" : undefined,
    }));
  const education = (o.educationRecords ?? [])
    .filter((e) => e.institution)
    .map((e) => ({
      award: [e.qualification, e.field].filter(Boolean).join(" ") || "Studied",
      school: e.institution ?? "",
    }));
  return { career: [...positions, ...careers], education };
}

// ----- Race labels -----

/**
 * The words the UI hangs on an election type: the offices on the poster, the
 * role card's upper-case base, the eyebrow, the noun in titles, and the seat
 * (the named scope level, null when the API sent none).
 */
export interface RaceLabel {
  readonly office: string;
  readonly mateOffice: string | null;
  readonly roleBase: string;
  readonly eyebrow: string;
  readonly noun: string;
  readonly seat: string | null;
}

type RaceWords = Omit<RaceLabel, "seat">;

const RACES: Readonly<Record<string, RaceWords>> = {
  presidential: {
    office: "President",
    mateOffice: "Vice President",
    roleBase: "PRESIDENTIAL",
    eyebrow: "Presidential",
    noun: "presidential ticket",
  },
  gubernatorial: {
    office: "Governor",
    mateOffice: "Deputy Governor",
    roleBase: "GOVERNORSHIP",
    eyebrow: "Governorship",
    noun: "governorship ticket",
  },
  senatorial: {
    office: "Senator",
    mateOffice: null,
    roleBase: "SENATORIAL",
    eyebrow: "Senate",
    noun: "senate race",
  },
  house_of_reps: {
    office: "Federal Representative",
    mateOffice: null,
    roleBase: "HOUSE OF REPS",
    eyebrow: "House of Representatives",
    noun: "House of Representatives race",
  },
  state_assembly: {
    office: "State Assembly Member",
    mateOffice: null,
    roleBase: "STATE ASSEMBLY",
    eyebrow: "State Assembly",
    noun: "state assembly race",
  },
  lga_chairman: {
    office: "LGA Chairman",
    mateOffice: "Vice Chairman",
    roleBase: "LGA CHAIRMANSHIP",
    eyebrow: "LGA Chairmanship",
    noun: "LGA chairmanship race",
  },
  councilor: {
    office: "Councilor",
    mateOffice: null,
    roleBase: "COUNCIL",
    eyebrow: "Council",
    noun: "council race",
  },
};

const OTHER_RACE: RaceWords = {
  office: "Candidate",
  mateOffice: null,
  roleBase: "CANDIDATE",
  eyebrow: "Election",
  noun: "race",
};

/**
 * Labels for a campaign's race. Every election type the API can return
 * (apps/api/src/campaigns/campaigns.service.ts) has a row; anything else —
 * `other`, or a type added after this table — reads as a plain "Candidate" in
 * an "Election", with whatever scope level the API named as the seat.
 */
export function raceOf(c: Pick<CampaignSummary, "electionType" | "scope">): RaceLabel {
  const scope = c.scope ?? null;
  const words = RACES[c.electionType];
  if (!words) {
    const seat = scope?.constituency?.name ?? scope?.lga?.name ?? scope?.state?.name ?? null;
    return { ...OTHER_RACE, seat };
  }
  let seat: string | null = null;
  switch (c.electionType) {
    case "gubernatorial":
      seat = scope?.state?.name ?? null;
      break;
    case "senatorial":
    case "house_of_reps":
    case "state_assembly":
      seat = scope?.constituency?.name ?? null;
      break;
    case "lga_chairman":
    case "councilor":
      seat = scope?.lga?.name ?? null;
      break;
    default:
      // presidential: the whole country, no seat.
      break;
  }
  return { ...words, seat };
}

// ----- Adapters -----

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PosterMeta {
  box?: Box;
  chip?: TicketArtwork["chip"] | null;
  scrim?: TicketArtwork["scrim"] | null;
  urlColor?: string | null;
}

const isBox = (v: unknown): v is Box =>
  typeof v === "object" && v !== null && ["x", "y", "w", "h"].every((k) => typeof (v as Box)[k as keyof Box] === "number");

function media(c: CampaignSummary, type: string): CampaignMedia | undefined {
  return c.media.find((m) => m.type === type);
}

/**
 * The poster's authored geometry, when the seed stored it. A ticket without a
 * chip box renders the generic poster layout instead.
 */
function artworkOf(c: CampaignSummary): TicketArtwork | undefined {
  const poster = media(c, "poster_candidate");
  const meta = (poster?.metadata ?? null) as PosterMeta | null;
  if (!poster || !meta || !isBox(meta.box) || !meta.chip) return undefined;

  const mate = media(c, "poster_mate");
  const mateMeta = (mate?.metadata ?? null) as PosterMeta | null;

  return {
    bg: c.brandColor ?? partyColor(c.party?.acronym, c.party?.color),
    urlColor: meta.urlColor ?? undefined,
    candidate: { src: poster.url, ...meta.box },
    mate: mate && mateMeta && isBox(mateMeta.box) ? { src: mate.url, ...mateMeta.box } : undefined,
    chip: meta.chip,
    scrim: meta.scrim ?? undefined,
  };
}

/** One poster on the rail. `id` is the slug, which is what the poster links to. */
export function toRailCandidate(c: CampaignSummary): RailCandidate {
  const acronym = c.party?.acronym ?? "";
  const race = raceOf(c);
  return {
    id: c.slug,
    candidate: {
      name: c.candidate.name,
      office: race.office,
      imageUrl: media(c, "poster_candidate")?.url ?? c.candidate.imageUrl,
    },
    mate: c.runningMate
      ? {
          name: c.runningMate.name,
          office: race.mateOffice ?? "Running mate",
          imageUrl: media(c, "poster_mate")?.url ?? c.runningMate.imageUrl,
        }
      : null,
    party: {
      acronym,
      name: c.party?.name ?? null,
      logoUrl: media(c, "logo")?.url ?? c.party?.logoUrl ?? null,
      // The poster's own fill, deliberately not PARTY_COLORS (APC's card is red).
      color: c.brandColor ?? c.party?.color ?? null,
    },
    shortName: c.candidate.shortName ?? undefined,
    art: artworkOf(c),
  };
}

/** Split "Peter Gregory Obi" into ["Peter Gregory", "Obi"] the way the cards print it. */
function splitName(name: string): [given: string, surname: string] {
  const cut = name.lastIndexOf(" ");
  return cut > 0 ? [name.slice(0, cut), name.slice(cut + 1)] : ["", name];
}

function toTicketPerson(
  p: CampaignPerson,
  role: TicketPerson["role"],
  photo: string | null | undefined,
): TicketPerson {
  const [given, surname] = splitName(p.name);
  return { given, surname, dob: p.dateOfBirth ?? undefined, role, photo: photo ?? p.imageUrl ?? undefined };
}

/**
 * The long-form profile, or null when the campaign carries no editorial copy —
 * the page then renders the ticket pair alone rather than empty sections.
 * Career and education are NOT here: they join on the official record.
 */
export function toTicketProfile(c: CampaignDetail): TicketProfile | null {
  if (!c.visionLine && !c.pullQuote && !c.candidateBio && c.documents.every((d) => !d.coverUrl && !d.fileUrl)) {
    return null;
  }
  const [, surname] = splitName(c.candidate.name);
  // The panel's tab order is the design's (Manifesto / CV / Achievements),
  // not the API's alphabetical one.
  const TAB_ORDER: readonly TicketDoc["key"][] = ["manifesto", "cv", "achievements"];
  const docs: TicketDoc[] = [...c.documents]
    .sort((a, b) => TAB_ORDER.indexOf(a.kind) - TAB_ORDER.indexOf(b.kind))
    .map((d) => ({
      key: d.kind,
      title: d.title,
      blurb: d.blurb ?? "",
      cover: d.coverUrl ?? undefined,
      href: d.fileUrl ?? undefined,
      pages: d.pageCount ?? undefined,
    }));
  return {
    candidate: toTicketPerson(c.candidate, [raceOf(c).roleBase, "(CANDIDATE)"], media(c, "card_candidate")?.url),
    mate: c.runningMate
      ? toTicketPerson(c.runningMate, ["RUNNING MATE", "(CANDIDATE)"], media(c, "card_mate")?.url)
      : null,
    visionLine: c.visionLine ?? "",
    fineprint: c.fineprint ?? "",
    quote: c.pullQuote ?? "",
    quoteBg: c.pullQuoteBg ?? c.brandColor ?? "#0f2919",
    quotePhoto: media(c, "quote_photo")?.url,
    short: c.candidate.shortName ?? surname,
    bio: c.candidateBio ?? "",
    bioPhoto: media(c, "bio_photo")?.url,
    docs,
  };
}

/**
 * Everything the public ticket page needs from one campaign, for ANY election
 * type — a senate seat resolves the same way a presidential ticket does; only
 * the labels (`race`) differ. Null when the campaign belongs to another cycle.
 * Pure: the route fetches, this maps, so it is testable without an API.
 */
export function publicTicket(
  c: CampaignDetail,
  year: number,
): {
  ticket: RailCandidate;
  profile: TicketProfile | null;
  /** The candidate's official slug, for the career/education join. */
  candidateSlug: string | null;
  race: RaceLabel;
} | null {
  if (c.year !== year) return null;
  return {
    ticket: toRailCandidate(c),
    profile: toTicketProfile(c),
    candidateSlug: c.candidate.officialSlug,
    race: raceOf(c),
  };
}
