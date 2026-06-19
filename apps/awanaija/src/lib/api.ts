const API_BASE = typeof window !== "undefined" 
  ? "/api" 
  : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:3000/api");

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
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

export async function getOfficialById(id: string) {
  return apiFetch<Official>(`/officials/${id}`);
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

export async function getPartyByAcronym(acronym: string, init?: RequestInit) {
  return apiFetch<PartyDetail>(`/parties/${encodeURIComponent(acronym)}`, init);
}

export async function getConstituencies(stateCode: string, type?: string) {
  const qs = new URLSearchParams({ state: stateCode });
  if (type) qs.set("type", type);
  return apiFetch<{ code: string; name: string; type: string }[]>(
    `/geo/constituencies?${qs.toString()}`,
  );
}

// Proposals
export async function createProposal(data: {
  officialId: string;
  positionId?: string;
  targetField: string;
  proposedValue: string;
  sourceUrl?: string;
}) {
  return apiFetch<{ id: string; status: string; trust: "verified" | "anonymous" }>("/proposals", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(data),
  });
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
}

export interface PartyListItem {
  acronym: string;
  name: string;
  isActive: boolean;
  logoUrl: string | null;
  completenessScore: number | null;
  seats: number;
  officers: PartyOfficerView[];
}

export interface PartyFootprint {
  governors: number;
  senators: number;
  representatives: number;
  byRole: Record<string, number>;
  statesControlled: string[];
  seatsByState: Record<string, number>;
}

export interface PartyOfficialMini {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  contextLabel: string | null;
}

export interface PartyLeadership {
  governors: PartyOfficialMini[];
  senators: PartyOfficialMini[];
  otherOffices: { role: string; label: string; count: number }[];
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
  leadership: PartyLeadership;
  candidates: PartyCandidate[];
}
