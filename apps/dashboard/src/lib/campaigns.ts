import { adminFetch } from "@/lib/api";
import { asMb, fileProblem } from "@/lib/campaign-assets";
import type { Tone } from "@/lib/tone";

// `errorMessage` lives next to ApiError in lib/api.ts; re-exported here so
// campaign pages can keep importing everything they need from one module.
export { errorMessage } from "@/lib/api";

// ---------- types (mirror apps/api/src/campaigns/*) ----------

export type CampaignStatus =
  | "draft"
  | "active"
  | "suspended"
  | "withdrawn"
  | "dissolved"
  | "concluded";
export type ReviewStatus = "unreviewed" | "reviewed" | "disputed";
export type ElectionType =
  | "presidential"
  | "gubernatorial"
  | "senatorial"
  | "house_of_reps"
  | "state_assembly"
  | "lga_chairman"
  | "councilor"
  | "other";
export const ELECTION_TYPES: ElectionType[] = [
  "presidential",
  "gubernatorial",
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "lga_chairman",
  "councilor",
  "other",
];
export const ELECTION_TYPE_LABEL: Record<ElectionType, string> = {
  presidential: "Presidential",
  gubernatorial: "Governor",
  senatorial: "Senate",
  house_of_reps: "House of Reps",
  state_assembly: "State Assembly",
  lga_chairman: "LGA Chairman",
  councilor: "Councillor",
  other: "Other",
};
/**
 * The four race-key columns every campaign surface passes around: what the
 * `<RaceKeyFields>` picker emits, what `listQuerySchema` filters on and what
 * `raceScopeFor` validates on the way into a write. Exactly ONE of the three
 * scope codes is ever set (a national race sets none) — the API rejects a
 * payload carrying a second.
 */
export interface RaceKey {
  electionType: ElectionType;
  year: number;
  stateCode?: string | null;
  constituencyCode?: string | null;
  lgaCode?: string | null;
}

/** Which scope picker a race type needs (mirrors raceScopeFor in the API). */
export const SCOPE_FOR: Record<ElectionType, "state" | "constituency" | "lga" | null> = {
  presidential: null,
  gubernatorial: "state",
  senatorial: "constituency",
  house_of_reps: "constituency",
  state_assembly: "constituency",
  lga_chairman: "lga",
  councilor: "lga",
  other: null,
};
/**
 * The two statuses a ticket can be public in — PUBLIC_STATUSES in
 * apps/api/src/campaigns/campaign-shared.ts. Membership alone is what the API's
 * `patch` guard checks before demanding campaigns.review to drop a ticket to low
 * confidence, and what the verbs branch on; actual visibility also needs
 * `isPubliclyVisible`.
 */
export const PUBLIC_STATUSES = ["active", "concluded"] as const;

/** True when the status is one a public ticket can hold. */
export function isPublicStatus(status: CampaignStatus): boolean {
  return (PUBLIC_STATUSES as readonly string[]).includes(status);
}

/**
 * The whole public gate `CampaignsService.list/getBySlug` applies: a public
 * status AND reviewed AND above low confidence. Anything else 404s on
 * ournigeria.ng — including a live ticket that was edited since its approval.
 */
export function isPubliclyVisible(c: {
  status: CampaignStatus;
  reviewStatus: ReviewStatus;
  confidence: string;
}): boolean {
  return (
    isPublicStatus(c.status) && c.reviewStatus === "reviewed" && c.confidence !== "low"
  );
}

/**
 * Does this race elect a PAIR? Only the president, a governor and an LGA
 * chairman run with a deputy; Senate, House of Reps, State Assembly and ward
 * councillor seats are won by one person, so offering a running-mate field
 * there only invites bad data.
 */
export function hasRunningMate(type: ElectionType): boolean {
  return !SOLO_RACES.has(type);
}
/**
 * Does THIS ticket have a running mate to show fields for? The race type is
 * the rule, but a mate already stored on a solo race is shown anyway so the
 * bad data can be corrected rather than hidden.
 */
export function ticketHasMate(c: {
  electionType: ElectionType;
  runningMateName: string | null;
}): boolean {
  return hasRunningMate(c.electionType) || Boolean(c.runningMateName);
}

const SOLO_RACES = new Set<ElectionType>([
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "councilor",
]);

export const CONSTITUENCY_TYPE: Partial<
  Record<ElectionType, "senatorial" | "federal" | "state">
> = {
  senatorial: "senatorial",
  house_of_reps: "federal",
  state_assembly: "state",
};

/**
 * The state a seat code belongs to. LGA codes are `<state>_<lga>`
 * (`akwa_ibom_abak`) and constituency codes are `sen_|fed_|state_` +
 * `<state>_<seat>` (`sen_abia_abia_north`) — but state codes themselves contain
 * underscores, so the owner is found by longest matching prefix against the
 * real state list, never by splitting on "_". Used to seed the state selector
 * when an existing ticket is opened for edit: the API stores only the seat code
 * for constituency/LGA races (raceScopeFor rejects a second scope column).
 */
export function seatStateCode(
  seatCode: string | null | undefined,
  stateCodes: readonly string[],
): string | null {
  if (!seatCode) return null;
  const code = seatCode.toLowerCase();
  const candidates = [code];
  for (const prefix of ["sen_", "fed_", "state_"]) {
    if (code.startsWith(prefix)) candidates.push(code.slice(prefix.length));
  }
  let best: string | null = null;
  for (const state of stateCodes) {
    const sc = state.toLowerCase();
    const hit = candidates.some((c) => c === sc || c.startsWith(`${sc}_`));
    if (hit && (best === null || sc.length > best.length)) best = state;
  }
  return best;
}

// ---------- status chip ----------

// The tones live in lib/tone.ts with their chip classes (shared with the
// socials surfaces); re-exported so campaign pages keep one import.
export type { Tone };

/**
 * One human label for the (status, reviewStatus, reviewRequestedAt) triple the
 * API actually stores. Mirrors admin-campaigns.service.ts:
 *   - `submit` stamps reviewFlagData() → unreviewed + reviewRequestedAt (in review)
 *   - `request-changes` sets reviewStatus "disputed" and LEAVES reviewRequestedAt set
 *   - `approve` sets reviewed and clears reviewRequestedAt
 *   - `PATCH` on any non-draft re-runs reviewFlagData(), pushing a live/concluded
 *     ticket back into the queue while it stays publicly visible
 *   - `unpublish` only moves status → suspended, so review fields say nothing there
 */
export function statusLabel(c: {
  status: CampaignStatus;
  reviewStatus: ReviewStatus;
  reviewRequestedAt: string | null;
}): { label: string; tone: Tone } {
  if (c.status === "draft") {
    if (c.reviewStatus === "disputed") return { label: "Changes requested", tone: "warning" };
    return c.reviewRequestedAt
      ? { label: "In review", tone: "info" }
      : { label: "Draft", tone: "neutral" };
  }
  if (c.status === "active" || c.status === "concluded") {
    const base = c.status === "active" ? "Live" : "Concluded";
    // Public but edited since the last approval — the reviewer needs to see it.
    if (c.reviewStatus !== "reviewed") return { label: `${base} · re-review`, tone: "warning" };
    return { label: base, tone: c.status === "active" ? "success" : "neutral" };
  }
  if (c.status === "suspended") return { label: "Hidden", tone: "danger" };
  if (c.status === "withdrawn") return { label: "Withdrawn", tone: "danger" };
  if (c.status === "dissolved") return { label: "Dissolved", tone: "danger" };
  // Compile-time exhaustiveness: a new campaign_status in the API breaks the
  // build here. At runtime it degrades to a neutral chip rather than throwing
  // inside a table row.
  const unhandled: never = c.status;
  return { label: String(unhandled), tone: "neutral" };
}

export const MEDIA_SLOT_TYPES = [
  "poster_candidate",
  "poster_mate",
  "card_candidate",
  "card_mate",
  "quote_photo",
  "bio_photo",
  "logo",
] as const;
export const MEDIA_APPEND_TYPES = ["banner", "photo"] as const;
export type MediaType =
  | (typeof MEDIA_SLOT_TYPES)[number]
  | (typeof MEDIA_APPEND_TYPES)[number];
export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  poster_candidate: "Poster — candidate",
  poster_mate: "Poster — running mate",
  card_candidate: "Card — candidate",
  card_mate: "Card — running mate",
  quote_photo: "Quote photo",
  bio_photo: "Bio photo",
  logo: "Party logo",
  banner: "Banner",
  photo: "Gallery photo",
};
export const DOCUMENT_KINDS = ["manifesto", "cv", "achievements"] as const;
export const DOCUMENT_SUBJECTS = ["ticket", "candidate", "running_mate"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export type DocumentSubject = (typeof DOCUMENT_SUBJECTS)[number];

export interface CampaignRow {
  id: string;
  slug: string;
  electionType: ElectionType;
  year: number;
  status: CampaignStatus;
  reviewStatus: ReviewStatus;
  reviewRequestedAt: string | null;
  reviewRequestedBy: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  partyAcronym: string | null;
  party: { acronym: string; name: string } | null;
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
  candidateName: string;
  candidateShortName: string | null;
  candidateImageUrl: string | null;
  candidateBio: string | null;
  candidateOfficialId: string | null;
  runningMateName: string | null;
  runningMateImageUrl: string | null;
  runningMateOfficialId: string | null;
  visionLine: string | null;
  fineprint: string | null;
  pullQuote: string | null;
  pullQuoteBg: string | null;
  brandColor: string | null;
  factionLabel: string | null;
  isDisputed: boolean;
  displayOrder: number | null;
  confidence: "high" | "medium" | "low";
  sourceType: string;
  sourceUrl: string | null;
  /**
   * `list()`/`queue()` return the whole Prisma row, so the model's own
   * `updatedAt @updatedAt` column rides along (campaigns.prisma).
   */
  updatedAt: string;
  /** Only `list()` includes this (the poster thumbnail); `queue()` never does. */
  media?: { url: string }[];
}
export interface Media {
  id: string;
  type: MediaType;
  url: string;
  caption: string | null;
  displayOrder: number;
  metadata: unknown;
  sourceUrl: string | null;
}
export interface CampaignDocument {
  id: string;
  kind: DocumentKind;
  subject: DocumentSubject;
  title: string;
  blurb: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  pageCount: number | null;
  /**
   * `GET /campaigns/:id` includes documents without a `select`, so the whole
   * row rides along. The Documents tab has to seed its Source URL box from
   * this: `documentPutSchema` treats an absent key as "keep" but the tab sends
   * every column it edits, so a field that could not be seeded would blank a
   * stored source on the next save.
   */
  sourceUrl: string | null;
}
/**
 * The bare `campaign_council_members` row every member mutation returns — the
 * `role`/`official` relations are included only by `GET /campaigns/:id`.
 */
export interface CouncilMemberRow {
  id: string;
  roleCode: string;
  officialId: string | null;
  name: string;
  imageUrl: string | null;
  scopeLevel: "national" | "state" | "lga";
  stateCode: string | null;
  lgaCode: string | null;
  status: "active" | "ended";
  endReason: string | null;
  startDate: string | null;
  endDate: string | null;
  displayOrder: number;
}
/** A member as `CampaignDetail.council` carries it: row + resolved relations. */
export interface CouncilMember extends CouncilMemberRow {
  role: { code: string; label: string };
  official: {
    id: string;
    slug: string | null;
    name: string;
    imageUrl: string | null;
  } | null;
}
export interface AuditEvent {
  seq: number;
  occurredAt: string;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
}
export interface CampaignDetail extends Omit<CampaignRow, "media"> {
  media: Media[];
  documents: CampaignDocument[];
  council: CouncilMember[];
  audit: AuditEvent[];
  candidateOfficial: {
    id: string;
    slug: string | null;
    name: string;
    imageUrl: string | null;
  } | null;
  runningMate: {
    id: string;
    slug: string | null;
    name: string;
    imageUrl: string | null;
  } | null;
  // The detail query also includes the resolved scope rows (admin-campaigns.service `get`).
  state: { code: string; name: string } | null;
  constituency: { code: string; name: string; type: string } | null;
  lga: { code: string; name: string } | null;
}
export interface CouncilRole {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

/** Mirrors listQuerySchema in admin-campaigns.schemas.ts. */
export interface CampaignListParams {
  year?: number;
  type?: ElectionType;
  state?: string | null;
  constituency?: string | null;
  lga?: string | null;
  party?: string | null;
  status?: CampaignStatus;
  reviewStatus?: ReviewStatus;
  q?: string | null;
  limit?: number;
  offset?: number;
}

// ---------- fetchers ----------

/** Drops null/undefined/empty values so a cleared filter leaves the query string. */
const q = (
  params: Record<string, string | number | boolean | null | undefined>,
): string =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

/** Verb bodies are not interchangeable — the API validates each one separately. */
interface CampaignVerbFn {
  (id: string, verb: "submit"): Promise<CampaignRow>;
  (id: string, verb: "request-changes", body: { note: string }): Promise<CampaignRow>;
  (
    id: string,
    verb: "approve" | "unpublish" | "conclude" | "withdraw" | "dissolve",
    body: { reason: string },
  ): Promise<CampaignRow>;
}

const verb: CampaignVerbFn = (
  id: string,
  v: string,
  body: Record<string, string> = {},
) =>
  adminFetch(`/campaigns/${id}/${v}`, {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<CampaignRow>;

export const campaignsApi = {
  list: (params: CampaignListParams) =>
    adminFetch(`/campaigns?${q({ ...params })}`) as Promise<{
      total: number;
      rows: CampaignRow[];
    }>,
  queue: () => adminFetch("/campaigns/queue") as Promise<CampaignRow[]>,
  get: (id: string) => adminFetch(`/campaigns/${id}`) as Promise<CampaignDetail>,
  create: (body: Record<string, unknown>) =>
    adminFetch("/campaigns", {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<CampaignRow>,
  patch: (id: string, body: Record<string, unknown>) =>
    adminFetch(`/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }) as Promise<CampaignRow>,
  slug: (id: string, slug: string) =>
    adminFetch(`/campaigns/${id}/slug`, {
      method: "PATCH",
      body: JSON.stringify({ slug }),
    }),
  remove: (id: string) => adminFetch(`/campaigns/${id}`, { method: "DELETE" }),
  verb,
  order: (body: Record<string, unknown>) =>
    adminFetch("/campaigns/order", { method: "PUT", body: JSON.stringify(body) }),
  roles: () => adminFetch("/campaigns/roles") as Promise<CouncilRole[]>,
  createRole: (body: Record<string, unknown>) =>
    adminFetch("/campaigns/roles", { method: "POST", body: JSON.stringify(body) }),
  patchRole: (code: string, body: Record<string, unknown>) =>
    adminFetch(`/campaigns/roles/${code}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteRole: (code: string) =>
    adminFetch(`/campaigns/roles/${code}`, { method: "DELETE" }),
  addMember: (id: string, body: Record<string, unknown>) =>
    adminFetch(`/campaigns/${id}/council`, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<CouncilMemberRow>,
  patchMember: (id: string, m: string, body: Record<string, unknown>) =>
    adminFetch(`/campaigns/${id}/council/${m}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }) as Promise<CouncilMemberRow>,
  endMember: (id: string, m: string, body: Record<string, unknown>) =>
    adminFetch(`/campaigns/${id}/council/${m}/end`, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<CouncilMemberRow>,
  removeMember: (id: string, m: string) =>
    adminFetch(`/campaigns/${id}/council/${m}`, {
      method: "DELETE",
    }) as Promise<{ deleted: true }>,
  presign: (id: string, body: { kind: "image" | "pdf"; contentType: string; size: number }) =>
    adminFetch(`/campaigns/${id}/uploads`, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<PresignResult>,
  commitMedia: (id: string, body: Record<string, unknown>) =>
    adminFetch(`/campaigns/${id}/media`, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<Media>,
  patchMedia: (id: string, m: string, body: Record<string, unknown>) =>
    adminFetch(`/campaigns/${id}/media/${m}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }) as Promise<Media>,
  deleteMedia: (id: string, m: string, reason?: string) =>
    adminFetch(`/campaigns/${id}/media/${m}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),
  putDocument: (
    id: string,
    kind: DocumentKind,
    subject: DocumentSubject,
    body: Record<string, unknown>,
  ) =>
    adminFetch(`/campaigns/${id}/documents/${kind}/${subject}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }) as Promise<CampaignDocument>,
  deleteDocument: (
    id: string,
    kind: DocumentKind,
    subject: DocumentSubject,
    reason?: string,
  ) =>
    adminFetch(`/campaigns/${id}/documents/${kind}/${subject}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),
  councilPhoto: (id: string, m: string, body: { stagingKey: string; reason?: string }) =>
    adminFetch(`/campaigns/${id}/council/${m}/photo`, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<CouncilMemberRow>,
  purge: (id: string, body: { keys: string[]; reason: string }) =>
    adminFetch(`/campaigns/${id}/purge`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export interface PresignResult {
  uploadUrl: string;
  stagingKey: string;
  expiresAt: string;
  maxBytes: number;
}

// ---------- upload orchestration (pure; XHR injected for tests) ----------

/**
 * The accepted types and size caps live in lib/campaign-assets.ts next to
 * `fileProblem`, the single gate both the drop zone and `uploadAsset` apply.
 * Re-exported here so campaign pages keep importing from one module.
 */
export {
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  PDF_MAX_BYTES,
  fileProblem,
} from "@/lib/campaign-assets";

export interface XhrLike {
  open(method: string, url: string): void;
  setRequestHeader(name: string, value: string): void;
  send(body: unknown): void;
  abort(): void;
  status: number;
  upload: {
    addEventListener(
      type: "progress",
      fn: (e: { lengthComputable: boolean; loaded: number; total: number }) => void,
    ): void;
  };
  addEventListener(type: "load" | "error" | "abort", fn: (e: unknown) => void): void;
}

export interface UploadOptions<T> {
  file: File;
  kind: "image" | "pdf";
  presign: (body: {
    kind: "image" | "pdf";
    contentType: string;
    size: number;
  }) => Promise<PresignResult>;
  /** Called with the staging key once the PUT succeeded; returns the API's commit result. */
  commit: (stagingKey: string) => Promise<T>;
  onProgress?: (fraction: number) => void;
  /** XHR factory (default: real XMLHttpRequest). fetch() has no upload progress. */
  xhr?: () => XhrLike;
  signal?: AbortSignal;
}

/**
 * presign → PUT straight to S3 (Content-Type and Content-Length are part of the
 * signature, so both are sent exactly as presigned) → commit. Client-side
 * checks mirror the server (type + size) so the user gets the error before a
 * 15 MB upload, not after.
 */
export async function uploadAsset<T>(opts: UploadOptions<T>): Promise<T> {
  const { file, kind } = opts;
  if (opts.signal?.aborted) throw new Error("Upload cancelled");
  // Exactly the check the drop zone already ran — one implementation, so a
  // file that slipped past the UI (a paste, a programmatic call) is refused
  // with the same sentence.
  const problem = fileProblem(file, kind);
  if (problem) throw new Error(problem);

  const presigned = await opts.presign({
    kind,
    contentType: file.type,
    size: file.size,
  });
  // The constants above are a copy of the server's; this catches the day they drift.
  if (file.size > presigned.maxBytes)
    throw new Error(`Server limit is ${asMb(presigned.maxBytes)} MB — this file is larger`);

  await new Promise<void>((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new Error("Upload cancelled"));
      return;
    }
    const xhr = (opts.xhr ?? (() => new XMLHttpRequest() as unknown as XhrLike))();
    const onAbort = () => xhr.abort();
    // One AbortSignal is often reused across several uploads, so drop our
    // listener the moment this one settles rather than letting them pile up.
    const settle = (fn: () => void) => {
      opts.signal?.removeEventListener("abort", onAbort);
      fn();
    };
    xhr.open("PUT", presigned.uploadUrl);
    // withCredentials stays false on purpose: this is a plain CORS PUT to S3
    // authorised by the SigV4 query string — a cookie would break the signature.
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total);
    });
    xhr.addEventListener("load", () =>
      settle(() => {
        if (xhr.status >= 200 && xhr.status < 300) {
          opts.onProgress?.(1);
          resolve();
        } else reject(new Error(`Upload failed (${xhr.status})`));
      }),
    );
    xhr.addEventListener("error", () =>
      settle(() => reject(new Error("Upload failed (network)"))),
    );
    xhr.addEventListener("abort", () =>
      settle(() => reject(new Error("Upload cancelled"))),
    );
    opts.signal?.addEventListener("abort", onAbort, { once: true });
    // Show a determinate bar from the first frame, before any progress event.
    opts.onProgress?.(0);
    xhr.send(file);
  });
  return opts.commit(presigned.stagingKey);
}
