import type { BallotRace } from "./election-ballot";

const API_BASE = typeof window !== "undefined"
  ? "/api" 
  : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:3000/api");

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "omit",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(res.status, body.error || "Request failed");
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Officials
export async function getOfficials(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<{
    data: Official[];
    total: number;
    page: number;
    pages: number;
  }>(`/officials${qs}`);
}

export async function getOfficialById(id: string, init?: RequestInit) {
  return apiFetch<Official>(`/officials/${id}`, init);
}

export async function getOfficialsByLocation(params: {
  state: string;
  lga?: string;
  ward?: string;
}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
  ).toString();
  return apiFetch<{ chain: ChainEntry[] }>(`/officials/by-location?${qs}`);
}

// Geo
export async function reverseGeocode(lat: number, lng: number) {
  return apiFetch<GeoResult>(`/geo/reverse?lat=${lat}&lng=${lng}`);
}

export async function getFaacPeriods(init?: RequestInit) {
  return apiFetch<{
    years: number[];
    monthsByYear: Record<number, number[]>;
  }>(`/geo/faac-periods`, init);
}

export async function getStateDetails(slug: string, year?: string, month?: string, init?: RequestInit) {
  const qs = new URLSearchParams();
  if (year) qs.set("year", year);
  if (month) qs.set("month", month);
  const queryString = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<any>(`/geo/states/${slug}${queryString}`, init);
}

export async function getLgaDetails(stateSlug: string, lgaSlug: string, year?: string, month?: string, init?: RequestInit) {
  const qs = new URLSearchParams();
  if (year) qs.set("year", year);
  if (month) qs.set("month", month);
  const queryString = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<any>(`/geo/states/${stateSlug}/lgas/${lgaSlug}${queryString}`, init);
}

/** One legislative tier a ward sits inside; null while its INEC mapping is unreconciled. */
export interface WardConstituency {
  code: string;
  name: string;
  type: string;
  representatives: {
    id: string;
    slug: string | null;
    name: string;
    role: string;
    party: string;
    image: string | null;
  }[];
}

export interface WardConstituencies {
  senatorial: WardConstituency | null;
  federal: WardConstituency | null;
  state: WardConstituency | null;
}

export async function getWardDetails(stateSlug: string, lgaSlug: string, wardSlug: string, init?: RequestInit) {
  return apiFetch<any>(`/geo/states/${stateSlug}/lgas/${lgaSlug}/wards/${wardSlug}`, init);
}

export async function getStates(init?: RequestInit) {
  return apiFetch<{ code: string; name: string; region: string; party: string; faac: string; faacDate?: string }[]>("/geo/states", init);
}

export async function getLgas(stateCode: string, init?: RequestInit) {
  return apiFetch<{ code: string; name: string }[]>(
    `/geo/lgas?state=${stateCode}`,
    init,
  );
}

export async function getWards(lgaCode: string, init?: RequestInit) {
  return apiFetch<{ code: string; name: string }[]>(
    `/geo/wards?lga=${lgaCode}`,
    init,
  );
}

export interface ConstituencyDetails {
  code: string;
  name: string;
  type: string; // federal | state | senatorial
  stateCode: string;
  stateName: string;
  representatives: {
    id: string;
    slug: string | null;
    name: string;
    role: string;
    party: string;
    image: string | null;
    email: string | null;
  }[];
  wards: { code: string; name: string; lgaName: string }[];
  lgas: { code: string; name: string }[];
  projects: unknown[];
}

export async function getConstituencyDetails(code: string, init?: RequestInit) {
  return apiFetch<ConstituencyDetails>(
    `/geo/constituencies/${encodeURIComponent(code)}`,
    init,
  );
}

export async function getParties() {
  return apiFetch<{ acronym: string; name: string }[]>("/geo/parties");
}

export async function getRegions() {
  return apiFetch<{ code: string; name: string }[]>("/geo/regions");
}

// Political parties (first-class entities — distinct from the /geo/parties dropdown)
export async function getPartyDirectory(init?: RequestInit) {
  return apiFetch<PartyListItem[]>("/parties", init);
}

/** acronym → logoUrl map for party flag discs (fail-soft: {} on error).
 *
 * Only https URLs pass: logo_url is writable via the enrichment pipeline
 * (AI-proposed, human-approved), so it is not strictly hand-curated — http
 * URLs would be mixed-content-blocked anyway and data: URIs are unwanted.
 * Bounded by a timeout so a hung /parties can't stall SSR for a decorative
 * 16px disc (the fetch itself continues and still populates the Next cache). */
export async function getPartyLogoMap(): Promise<Record<string, string>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const request = getPartyDirectory({ next: { revalidate: 3600 } });
    request.catch(() => {}); // may lose the race below; don't leave an unhandled rejection
    const parties = await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("/parties timed out after 2500ms")), 2500);
      }),
    ]);
    return Object.fromEntries(
      parties
        .filter(
          (p) =>
            typeof p.acronym === "string" &&
            typeof p.logoUrl === "string" &&
            p.logoUrl.startsWith("https://"),
        )
        .map((p) => [p.acronym.toUpperCase(), p.logoUrl!]),
    );
  } catch (err) {
    console.error("getPartyLogoMap: party logos unavailable, falling back to acronyms", err);
    return {};
  } finally {
    clearTimeout(timer);
  }
}

export async function getPartyByAcronym(acronym: string, init?: RequestInit) {
  return apiFetch<PartyDetail>(`/parties/${encodeURIComponent(acronym)}`, init);
}

export async function getPartyOfficeholders(
  acronym: string,
  role: string,
  page = 1,
  init?: RequestInit,
) {
  return apiFetch<PartyOfficeholderPage>(
    `/parties/${encodeURIComponent(acronym)}/officeholders?role=${encodeURIComponent(role)}&page=${page}`,
    init,
  );
}

export async function getConstituencies(stateCode: string, type?: string) {
  const qs = new URLSearchParams({ state: stateCode });
  if (type) qs.set("type", type);
  return apiFetch<{ code: string; name: string; type: string }[]>(
    `/geo/constituencies?${qs.toString()}`,
  );
}

// Election ballot (by-party candidate tracker)
export async function getElectionBallot(
  params: { state: string; lga?: string; ward?: string; offices: { office: string; year: number }[] },
  init?: RequestInit,
): Promise<{ races: BallotRace[] }> {
  const qs = new URLSearchParams({ state: params.state });
  if (params.lga) qs.set("lga", params.lga);
  if (params.ward) qs.set("ward", params.ward);
  qs.set("offices", params.offices.map((o) => `${o.office}:${o.year}`).join(","));
  return apiFetch<{ races: BallotRace[] }>(`/election/ballot?${qs.toString()}`, init);
}

// Proposals
export async function createProposal(data: {
  officialId: string;
  positionId?: string;
  targetField: string;
  proposedValue: string;
  sourceUrl?: string;
  // Only for targetField "name": correction (rename same person) vs succession
  // (previous term ended → a new official). Ignored server-side for other fields.
  nameChangeKind?: "correction" | "succession";
  // Only for targetField "partyAcronym": correction (fix wrong party in place) vs
  // defection (record a dated party change, keep history).
  partyChangeKind?: "correction" | "defection";
  // Effective date (YYYY-MM-DD) for a succession/defection event.
  effectiveDate?: string;
}) {
  return apiFetch<{ id: string; status: string; trust: "verified" | "anonymous" }>("/proposals", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(data),
  });
}

/** Citizen structured contribution — batch ADD (Plan 55). */
export async function createRecordProposals(data: {
  officialId: string;
  records: { recordType: string; data: Record<string, unknown>; sourceUrl?: string }[];
}) {
  return apiFetch<{ batchId: string; count: number; trust: "verified" | "anonymous" }>(
    "/proposals/records",
    { method: "POST", credentials: "include", body: JSON.stringify(data) },
  );
}

/** Citizen structured contribution — correct one field on an existing record (Plan 55). */
export async function createRecordEditProposal(data: {
  officialId: string;
  recordType: string;
  targetPk: string;
  field: string;
  value: unknown;
  sourceUrl?: string;
}) {
  return apiFetch<{ id: string; status: string; trust: "verified" | "anonymous" }>(
    "/proposals/record/edit",
    { method: "POST", credentials: "include", body: JSON.stringify(data) },
  );
}

export async function identifyOfficial(data: {
  name: string;
  role: string;
  imageUrl?: string;
  partyAcronym?: string;
  email?: string;
  phoneNumber?: string;
  officeAddress?: string;
  twitterHandle?: string;
  facebookUrl?: string;
  gender?: string;
  education?: string;
  biography?: string;
  dateOfBirth?: string;
  sourceUrl?: string;
  stateCode?: string;
  lgaCode?: string;
  wardCode?: string;
  constituencyCode?: string;
}) {
  return apiFetch<{ id: string; officialId: string; status: string; trust: "verified" | "anonymous" }>("/proposals/identify", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(data),
  });
}

export interface SeatCandidate {
  id: string;
  name: string;
  partyAcronym: string | null;
  sourceUrl: string | null;
  voteScore: number;
  confirmCount: number;
  voteCount: number;
  createdAt: string;
}

export interface SeatCandidatesResponse {
  seat: { role: string; column: string; code: string };
  hasCanonical: boolean;
  official?: { id: string; name: string; slug: string | null; imageUrl: string | null };
  positionId?: string;
  candidates: SeatCandidate[];
}

export async function getSeatCandidates(params: {
  role: string;
  wardCode?: string;
  lgaCode?: string;
  constituencyCode?: string;
  stateCode?: string;
}) {
  const qs = new URLSearchParams({ role: params.role });
  if (params.wardCode) qs.set("wardCode", params.wardCode);
  if (params.lgaCode) qs.set("lgaCode", params.lgaCode);
  if (params.constituencyCode) qs.set("constituencyCode", params.constituencyCode);
  if (params.stateCode) qs.set("stateCode", params.stateCode);
  return apiFetch<SeatCandidatesResponse>(`/proposals/seat?${qs.toString()}`);
}

export async function claimProposal(proposalId: string) {
  return apiFetch<{ status: string }>(`/proposals/${proposalId}/claim`, {
    method: "POST",
    credentials: "include",
  });
}

export async function voteOnProposal(
  proposalId: string,
  direction: 1 | -1,
) {
  return apiFetch<{ voteScore: number; upvoteCount: number; downvoteCount: number }>(`/proposals/${proposalId}/vote`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ direction }),
  });
}

export async function getProposals(officialId: string) {
  return apiFetch<{
    data: Proposal[];
    total: number;
  }>(`/proposals?officialId=${officialId}`);
}

export async function getProposalById(id: string) {
  return apiFetch<Proposal>(`/proposals/${id}`);
}

// Completeness
export async function getCompletenessRankings() {
  return apiFetch<CompletenessEntry[]>("/completeness");
}

// Activity
export async function getActivity(limit = 5) {
  return apiFetch<{ data: ActivityEntry[] }>(`/activity?limit=${limit}`);
}

// Auth
export async function sendOtp(phoneNumber: string) {
  return apiFetch<{ message: string }>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
}

export async function verifyOtp(phoneNumber: string, code: string) {
  return apiFetch<{ userId: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, code }),
  });
}

// Types

/** One evidence source attached to a fact (plan 45 — EvidenceView). */
export interface Evidence {
  id: string;
  url: string;
  archiveUrl: string | null;
  publisher: string;
  snippet: string;
  format: string;
  locator: string | null;
  sourceTier: "canonical" | "official" | "web" | string;
  confidence: "high" | "medium" | "low" | string;
  retrievedAt: string;
  hasSnapshot: boolean;
  originalAccessible: boolean;
}

/** Provenance + verification carried by every structured fact row. */
export interface ProvFields {
  id: string;
  confidence: "high" | "medium" | "low" | string;
  sourceType: string;
  reviewStatus: "unreviewed" | "reviewed" | "disputed" | string;
  lastVerifiedAt: string | null;
  evidence: Evidence[];
}

export interface EducationRecord extends ProvFields {
  institution: string;
  institutionType: string | null;
  qualification: string | null;
  field: string | null;
  startYear: number | null;
  endYear: number | null;
  graduated: boolean | null;
  location: string | null;
}

export interface CareerRecord extends ProvFields {
  organization: string;
  role: string | null;
  industry: string | null;
  employmentType: string | null;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
}

export interface PartyAffiliation extends ProvFields {
  party: string;
  partyName: string | null;
  startDate: string | null;
  endDate: string | null;
  reason: string | null;
}

export interface Committee extends ProvFields {
  committeeName: string;
  chamber: string;
  role: string;
  termName: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface SponsoredBill extends ProvFields {
  title: string;
  billNumber: string | null;
  chamber: string;
  role: string;
  status: string | null;
  introducedDate: string | null;
  statusDate: string | null;
  summary: string | null;
}

export interface ElectionRecord extends ProvFields {
  electionType: string;
  isPrimary: boolean;
  year: number;
  electionDate: string | null;
  party: string | null;
  partyName: string | null;
  state: string | null;
  constituency: string | null;
  lga: string | null;
  ward: string | null;
  result: string;
  votes: number | null;
  votePercentage: number | null;
  winnerName: string | null;
  resultedInPositionId: string | null;
  notes: string | null;
}

export interface AssetDeclaration extends ProvFields {
  year: number;
  declaredTo: string | null;
  amount: number | null;
  currency: string;
  summary: string | null;
}

export interface Award extends ProvFields {
  title: string;
  awardedBy: string | null;
  year: number | null;
  category: string | null;
  description: string | null;
}

export interface Publication extends ProvFields {
  title: string;
  type: string | null;
  publisher: string | null;
  year: number | null;
}

export interface FamilyMember extends ProvFields {
  relationship: string;
  name: string | null;
  isPublicFigure: boolean;
  notes: string | null;
  relatedOfficial: { name: string; slug: string | null } | null;
}

export interface LegalCase extends ProvFields {
  title: string;
  caseType: string;
  status: string;
  forum: string | null;
  caseNumber: string | null;
  filedDate: string | null;
  resolvedDate: string | null;
  outcome: string | null;
  relatedCorruptionCase: { slug: string; title: string; status: string } | null;
}

export interface OfficialCorruptionCase extends ProvFields {
  roleInCase: string;
  outcome: string | null;
  case: {
    slug: string;
    title: string;
    status: string;
    caseType: string;
    forum: string | null;
    amountInvolved: number | null;
    currency: string;
  };
}

export interface Official {
  id: string;
  slug: string | null;
  name: string;
  officialType?: string | null;
  imageUrl: string | null;
  dateOfBirth: string | null;
  email: string | null;
  phoneNumber: string | null;
  officeAddress: string | null;
  twitterHandle: string | null;
  facebookUrl: string | null;
  gender: string | null;
  education: string | null;
  biography: string | null;
  completenessScore: number;
  // True when this record exists only via an unapproved citizen "identify" submission
  // (a pending identify proposal). Present from getByIdOrSlug.
  proposed?: boolean;
  positions: Position[];
  proposalCount: number;
  proposals: Proposal[];

  // Plan 45 structured sections (present from getByIdOrSlug; optional so list
  // responses that omit them still satisfy the type).
  fieldEvidence?: { biography: Evidence[]; education: Evidence[] };
  educationRecords?: EducationRecord[];
  careerRecords?: CareerRecord[];
  partyHistory?: PartyAffiliation[];
  committees?: Committee[];
  sponsoredBills?: SponsoredBill[];
  elections?: ElectionRecord[];
  assetDeclarations?: AssetDeclaration[];
  awards?: Award[];
  publications?: Publication[];
  familyMembers?: FamilyMember[];
  legalCases?: LegalCase[];
  corruptionCases?: OfficialCorruptionCase[];
}

export interface Position {
  id: string;
  role: string;
  party: string | null;
  partyName: string | null;
  state: string | null;
  stateCode: string | null;
  lga: string | null;
  lgaCode: string | null;
  constituency: string | null;
  constituencyCode: string | null;
  ward: string | null;
  wardCode: string | null;
  startDate: string | null;
  endDate: string | null;
  endReason?: string | null;
  status?: string;
  isCurrent?: boolean;
  termName: string | null;
  termNumber: number | null;
}

/**
 * Human-readable location for an official's position, expressed at the right
 * granularity for the office. Ward-scoped offices (councilors) read ward → LGA
 * → state; constituency-scoped offices (senators, reps, MHAs) show the
 * constituency; state-scoped offices (governors) show the state. Falls back to
 * "Nigeria" when nothing is set.
 */
export function formatOfficialLocation(
  position:
    | Pick<Position, "ward" | "lga" | "constituency" | "state">
    | null
    | undefined,
): string {
  if (!position) return "Nigeria";
  const parts = [
    position.ward,
    position.lga,
    position.constituency,
    position.state,
  ].filter((p): p is string => Boolean(p));
  return parts.length ? parts.join(", ") : "Nigeria";
}

export interface ChainEntry {
  role: string;
  scope: Record<string, string>;
  official: Official | null;
  position: Position | null;
}

export interface Proposal {
  id: string;
  targetField: string;
  proposedValue: unknown;
  sourceUrl: string | null;
  status: string;
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  createdAt: string;
  officialId?: string;
  officialName?: string;
}

export interface GeoResult {
  stateCode: string | null;
  stateName: string | null;
  lgaCode: string | null;
  lgaName: string | null;
  wardCode: string | null;
  wardName: string | null;
}

export interface CompletenessEntry {
  stateCode: string;
  stateName: string;
  completeness: number;
  officialCount: number;
}

export interface ActivityEntry {
  id: string;
  eventType: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: string;
}

// Political parties
export interface PartyOfficerView {
  role: string;
  name: string;
  imageUrl: string | null;
  officialSlug: string | null;
}

export interface PartyListItem {
  acronym: string;
  name: string;
  isActive: boolean;
  logoUrl: string | null;
  ideology: string | null;
  completenessScore: number | null;
  seats: number;
  governorships: number;
  officers: PartyOfficerView[];
}

export interface PartyFootprint {
  governors: number;
  senators: number;
  representatives: number;
  byRole: Record<string, number>;
  statesControlled: string[];
  seatsByState: Record<string, number>;
  seatsByStateByRole: Record<string, Record<string, number>>;
}

export interface PartyOfficialMini {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  contextLabel: string | null;
}

export interface PartyOfficeholderPage {
  data: PartyOfficialMini[];
  total: number;
  page: number;
  pages: number;
}

export interface PartyCandidate {
  official: { id: string; slug: string | null; name: string; imageUrl: string | null };
  electionType: string;
  year: number;
  electionDate: string | null;
  scopeLabel: string;
}

export interface PartyStateChapter {
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
  completenessScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartyDetail {
  acronym: string;
  ballotCode: string | null;
  name: string;
  isActive: boolean;
  logoUrl: string | null;
  foundingYear: number | null;
  leaderName: string | null;
  hqAddress: string | null;
  website: string | null;
  email: string | null;
  phoneNumber: string | null;
  twitterHandle: string | null;
  facebookUrl: string | null;
  description: string | null;
  ideology: string | null;
  slogan: string | null;
  color: string | null;
  inecStatus: string | null;
  completenessScore: number | null;
  createdAt: string;
  updatedAt: string;
  chapters: PartyStateChapter[];
  officers: PartyOfficerView[];
  footprint: PartyFootprint;
  statesGoverned: string[];
  candidates: PartyCandidate[];
  seatShare: PartySeatShare;
  budgetGoverned: PartyBudgetGoverned;
  seatsByZone: PartySeatsByZone;
  rank: { position: number | null; totalParties: number };
}

export interface SeatShareItem {
  held: number;
  total: number;
}

export interface PartySeatShare {
  governorships: SeatShareItem;
  senate: SeatShareItem;
  house: SeatShareItem;
  stateAssembly: SeatShareItem;
  lga: SeatShareItem;
}

export interface PartyBudgetGoverned {
  totalNaira: string | null;
  totalRaw: number;
  statesGoverned: number;
  statesWithData: number;
  topStates: { stateCode: string; name: string; naira: string; raw: number }[];
}

export interface PartyZone {
  zoneCode: string;
  zoneName: string;
  held: number;
  total: number;
  pct: number;
  byRole: { role: string; held: number; total: number }[];
}

export interface PartySeatsByZone {
  zones: PartyZone[];
  strongestZone: string | null;
}
