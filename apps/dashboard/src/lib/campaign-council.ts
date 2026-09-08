/**
 * The council panel's pure parts: what the role catalog and the member form
 * accept, and the exact bodies the API's council routes are sent.
 *
 * Kept free of React so the rules that are easy to get wrong — a linked
 * official's name may never be PATCHed, a scope change must carry all three
 * scope columns, an unchanged field must not be sent at all — are unit tested
 * rather than eyeballed in a browser.
 *
 * Mirrors apps/api/src/campaigns/admin-campaigns.schemas.ts (roleSchema,
 * memberBaseSchema, endMemberSchema) and admin-campaign-council.service.ts.
 */

import type { PersonValue } from "@/components/campaigns/official-picker";
import type { CouncilMember } from "@/lib/campaigns";

// ---------- enumerations ----------

/** `endMemberSchema.endReason` — the API accepts nothing else. */
export const END_REASONS = [
  "resigned",
  "removed",
  "reshuffled",
  "deceased",
  "campaign_ended",
] as const;
export type EndReason = (typeof END_REASONS)[number];

export const END_REASON_LABEL: Record<EndReason, string> = {
  resigned: "Resigned",
  removed: "Removed",
  reshuffled: "Reshuffled",
  deceased: "Deceased",
  campaign_ended: "Campaign ended",
};

/** A stored end reason, or a value the API grew after this build shipped. */
export function endReasonLabel(code: string | null | undefined): string {
  if (!code) return "Ended";
  return END_REASON_LABEL[code as EndReason] ?? code.replace(/_/g, " ");
}

export const SCOPE_LEVELS = ["national", "state", "lga"] as const;
export type ScopeLevel = (typeof SCOPE_LEVELS)[number];
export const SCOPE_LEVEL_LABEL: Record<ScopeLevel, string> = {
  national: "National",
  state: "State",
  lga: "LGA",
};

// ---------- limits (mirror the zod schemas) ----------

/** `roleSchema.code` — a letter, then 1–59 more of [a-z0-9_]. */
export const ROLE_CODE_RE = /^[a-z][a-z0-9_]{1,59}$/;
export const ROLE_LABEL_MIN = 2;
export const ROLE_LABEL_MAX = 100;
export const SORT_ORDER_MAX = 1000;
export const MEMBER_NAME_MIN = 2;
export const MEMBER_NAME_MAX = 200;
export const REASON_MAX = 500;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- shared helpers ----------

/**
 * `<input type="date">` text for a stored timestamp. The API parses
 * `YYYY-MM-DD` as UTC midnight, so the ISO string is sliced rather than run
 * through `Date` — west of UTC that would render the previous day.
 */
export function isoDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** A whole number ≥ 0 from a free-text box; null for empty or unparseable. */
export function parseOrder(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isSafeInteger(n) ? n : null;
}

/** Up to two initials for the portrait fallback. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** A body that carries nothing but its audit reason changes nothing. */
export function isEmptyPatch(body: Record<string, unknown>): boolean {
  return Object.keys(body).every((k) => k === "reason");
}

// ---------- role catalog ----------

export interface RoleFormValues {
  code: string;
  label: string;
  /** Free text so a half-typed number does not snap back to 0 under the caret. */
  sortOrder: string;
  isActive: boolean;
}

export function roleProblems(
  v: RoleFormValues,
  opts: { checkCode?: boolean; taken?: readonly string[] } = {},
): Partial<Record<keyof RoleFormValues, string>> {
  const problems: Partial<Record<keyof RoleFormValues, string>> = {};
  if (opts.checkCode) {
    const code = v.code.trim();
    if (!code) problems.code = "Code is required.";
    else if (!ROLE_CODE_RE.test(code))
      problems.code =
        "Lower-case letters, digits and underscores; 2–60 characters, starting with a letter.";
    else if (opts.taken?.includes(code)) problems.code = "That code already exists.";
  }
  const label = v.label.trim();
  if (label.length < ROLE_LABEL_MIN)
    problems.label = `Label needs at least ${ROLE_LABEL_MIN} characters.`;
  else if (label.length > ROLE_LABEL_MAX)
    problems.label = `Label is at most ${ROLE_LABEL_MAX} characters.`;
  const order = parseOrder(v.sortOrder);
  if (v.sortOrder.trim() && (order === null || order > SORT_ORDER_MAX))
    problems.sortOrder = `Whole number between 0 and ${SORT_ORDER_MAX}.`;
  return problems;
}

/**
 * POST /campaigns/roles. `isActive` is deliberately not sent — a role is born
 * active (the schema's default) and deactivating one is an edit, not a
 * creation option.
 */
export function roleCreateBody(v: RoleFormValues): Record<string, unknown> {
  return {
    code: v.code.trim(),
    label: v.label.trim(),
    sortOrder: parseOrder(v.sortOrder) ?? 0,
  };
}

/** PATCH /campaigns/roles/:code — only what actually moved. */
export function rolePatchBody(
  v: RoleFormValues,
  base: { label: string; sortOrder: number; isActive: boolean },
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const label = v.label.trim();
  if (label !== base.label) body.label = label;
  const order = parseOrder(v.sortOrder) ?? 0;
  if (order !== base.sortOrder) body.sortOrder = order;
  if (v.isActive !== base.isActive) body.isActive = v.isActive;
  return body;
}

export const EMPTY_ROLE_FORM: RoleFormValues = {
  code: "",
  label: "",
  sortOrder: "",
  isActive: true,
};

export function roleFormOf(role: {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}): RoleFormValues {
  return {
    code: role.code,
    label: role.label,
    sortOrder: String(role.sortOrder),
    isActive: role.isActive,
  };
}

// ---------- members ----------

export interface MemberFormValues {
  /** What `OfficialPicker` emits: a linked official, or a bare name. */
  person: PersonValue | null;
  roleCode: string;
  scopeLevel: ScopeLevel;
  stateCode: string | null;
  lgaCode: string | null;
  /** "" or YYYY-MM-DD. */
  startDate: string;
  displayOrder: string;
}

export const EMPTY_MEMBER_FORM: MemberFormValues = {
  person: null,
  roleCode: "",
  scopeLevel: "national",
  stateCode: null,
  lgaCode: null,
  startDate: "",
  displayOrder: "",
};

export function memberFormOf(m: CouncilMember): MemberFormValues {
  return {
    person: { officialId: m.officialId, name: m.name },
    roleCode: m.roleCode,
    scopeLevel: m.scopeLevel,
    stateCode: m.stateCode,
    lgaCode: m.lgaCode,
    startDate: isoDateInput(m.startDate),
    displayOrder: String(m.displayOrder),
  };
}

export function memberProblems(
  v: MemberFormValues,
): Partial<Record<keyof MemberFormValues, string>> {
  const problems: Partial<Record<keyof MemberFormValues, string>> = {};
  const name = (v.person?.name ?? "").trim();
  if (!v.person?.officialId && !name) problems.person = "Pick an official, or type a name.";
  else if (!v.person?.officialId && name.length < MEMBER_NAME_MIN)
    problems.person = `Name needs at least ${MEMBER_NAME_MIN} characters.`;
  else if (!v.person?.officialId && name.length > MEMBER_NAME_MAX)
    problems.person = `Name is at most ${MEMBER_NAME_MAX} characters.`;
  if (!v.roleCode) problems.roleCode = "Pick a role.";
  if (v.scopeLevel === "state" && !v.stateCode) problems.stateCode = "Pick a state.";
  if (v.scopeLevel === "lga" && !v.lgaCode) problems.lgaCode = "Pick an LGA.";
  if (v.startDate && !DATE_RE.test(v.startDate)) problems.startDate = "Use YYYY-MM-DD.";
  if (v.displayOrder.trim() && parseOrder(v.displayOrder) === null)
    problems.displayOrder = "Whole number, 0 or more.";
  return problems;
}

/**
 * POST /campaigns/:id/council.
 *
 * `name` is omitted for a linked official on purpose: `resolvePerson` takes the
 * name from the official's own row and silently ignores the body's, so sending
 * it would only invite the reader to think it mattered.
 */
export function memberCreateBody(
  v: MemberFormValues,
  reason?: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    roleCode: v.roleCode,
    scopeLevel: v.scopeLevel,
  };
  if (v.person?.officialId) body.officialId = v.person.officialId;
  else body.name = (v.person?.name ?? "").trim();
  if (v.scopeLevel === "state") body.stateCode = v.stateCode;
  // An LGA-scoped member's state is read off the LGA row by the API, never
  // trusted from here — so only the LGA code is sent.
  if (v.scopeLevel === "lga") body.lgaCode = v.lgaCode;
  if (v.startDate) body.startDate = v.startDate;
  const order = parseOrder(v.displayOrder);
  if (order !== null) body.displayOrder = order;
  if (reason) body.reason = reason;
  return body;
}

/**
 * PATCH /campaigns/:id/council/:memberId — only the columns that moved.
 *
 * Two API rules shape this:
 *  - `name` alongside a (kept) `officialId` is a 400, "name is taken from the
 *    linked official". So a name is sent only when the member is, or is being
 *    made, unlinked.
 *  - the service recomputes the whole scope arc whenever ANY of scopeLevel /
 *    stateCode / lgaCode is present, so a scope change sends all three and lets
 *    `scopeFor` null out the columns the new level does not use.
 */
/**
 * Rename (or un-link) a member without losing a portrait that is theirs.
 *
 * `patchMember` re-runs `resolvePerson` as soon as ANY of officialId/name/
 * imageUrl is present, and that helper rebuilds `imageUrl` from the body alone
 * — an absent key resolves to null, not to "keep". So a bare rename would blank
 * a photo uploaded through `POST /council/:id/photo`; the stored URL is echoed
 * back to keep it.
 *
 * That echo is for an ALREADY-UNLINKED member only. A linked member's stored
 * `imageUrl` came from the official (`resolvePerson` copies it on create), so on
 * unlink the photo leaves with them and no `imageUrl` is sent at all — echoing
 * it would keep the ticket showing that official's face for someone no longer
 * connected to them, and an official whose own photo is hotlinked from a
 * foreign host would fail the stored-URL check outright.
 */
function setName(body: Record<string, unknown>, base: CouncilMember, name: string): void {
  body.name = name;
  if (!base.officialId) body.imageUrl = base.imageUrl;
}

export function memberPatchBody(
  v: MemberFormValues,
  base: CouncilMember,
  reason?: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (v.roleCode !== base.roleCode) body.roleCode = v.roleCode;

  const nextOfficialId = v.person?.officialId ?? null;
  const nextName = (v.person?.name ?? "").trim();
  if (nextOfficialId !== base.officialId) {
    body.officialId = nextOfficialId;
    // Unlinking leaves the row with no name source; the form's text becomes it.
    if (!nextOfficialId) setName(body, base, nextName);
  } else if (!nextOfficialId && nextName !== base.name) {
    setName(body, base, nextName);
  }

  const scopeMoved =
    v.scopeLevel !== base.scopeLevel ||
    (v.scopeLevel === "state" && v.stateCode !== base.stateCode) ||
    (v.scopeLevel === "lga" && v.lgaCode !== base.lgaCode);
  if (scopeMoved) {
    body.scopeLevel = v.scopeLevel;
    body.stateCode = v.scopeLevel === "state" ? v.stateCode : null;
    body.lgaCode = v.scopeLevel === "lga" ? v.lgaCode : null;
  }

  if (v.startDate !== isoDateInput(base.startDate)) body.startDate = v.startDate || null;

  const order = parseOrder(v.displayOrder) ?? 0;
  if (order !== base.displayOrder) body.displayOrder = order;

  if (reason) body.reason = reason;
  return body;
}

/**
 * May this member's portrait be uploaded here?
 *
 * A name-only member always can. A LINKED official normally cannot — their
 * portrait belongs to their own record — unless that record has no photo, in
 * which case the public page falls back to the member's own `imageUrl` and
 * filling it in is the only way to give them a face. An ended member is
 * history and is excluded by the caller.
 */
export function canUploadCouncilPhoto(member: {
  officialId: string | null;
  official?: { imageUrl: string | null } | null;
}): boolean {
  return !member.officialId || !member.official?.imageUrl;
}

// ---------- ordering ----------

/**
 * Reading order for the table: active members first (an ended one is history,
 * and the API's own `orderBy` puts it last too), then the ticket's hand-set
 * `displayOrder`, then the role catalog's `sortOrder` so two members left at 0
 * still come out chair-before-volunteer, then the name.
 */
export function sortCouncil<
  T extends { status: string; displayOrder: number; roleCode: string; name: string },
>(rows: readonly T[], roleSortOrder: (code: string) => number): T[] {
  return [...rows].sort(
    (a, b) =>
      (a.status === "ended" ? 1 : 0) - (b.status === "ended" ? 1 : 0) ||
      a.displayOrder - b.displayOrder ||
      roleSortOrder(a.roleCode) - roleSortOrder(b.roleCode) ||
      a.name.localeCompare(b.name),
  );
}
