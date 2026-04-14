const API_BASE = typeof window !== "undefined" 
  ? "/api" 
  : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "/api");

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

export async function getStateDetails(slug: string, year?: string, month?: string) {
  const qs = new URLSearchParams();
  if (year) qs.set("year", year);
  if (month) qs.set("month", month);
  const queryString = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<any>(`/geo/states/${slug}${queryString}`);
}

export async function getLgaDetails(stateSlug: string, lgaSlug: string) {
  return apiFetch<any>(`/geo/states/${stateSlug}/lgas/${lgaSlug}`);
}

export async function getWardDetails(stateSlug: string, lgaSlug: string, wardSlug: string) {
  return apiFetch<any>(`/geo/states/${stateSlug}/lgas/${lgaSlug}/wards/${wardSlug}`);
}

export async function getStates() {
  return apiFetch<{ code: string; name: string; region: string; party: string; faac: string }[]>("/geo/states");
}

export async function getLgas(stateCode: string) {
  return apiFetch<{ code: string; name: string }[]>(
    `/geo/lgas?state=${stateCode}`,
  );
}

export async function getWards(lgaCode: string) {
  return apiFetch<{ code: string; name: string }[]>(
    `/geo/wards?lga=${lgaCode}`,
  );
}

export async function getParties() {
  return apiFetch<{ acronym: string; name: string }[]>("/geo/parties");
}

export async function getRegions() {
  return apiFetch<{ code: string; name: string }[]>("/geo/regions");
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
  return apiFetch<{ id: string; status: string }>("/proposals", {
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
  return apiFetch<{ id: string; officialId: string; status: string }>("/proposals/identify", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(data),
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
export interface Official {
  id: string;
  name: string;
  imageUrl: string | null;
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
