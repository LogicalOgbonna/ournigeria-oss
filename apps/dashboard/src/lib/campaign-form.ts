/**
 * Pure helpers behind the ticket edit form and the detail header — no React, so
 * the rules that decide what gets sent to `PATCH /api/admin/campaigns/:id` (and
 * why a ticket is not on the public site) are unit-testable on their own.
 * Every limit and pattern here mirrors `patchSchema` in
 * apps/api/src/campaigns/admin-campaigns.schemas.ts.
 */
import type { CampaignDetail, CampaignStatus, ReviewStatus } from "@/lib/campaigns";

/** patchSchema's `text(n)` limits, so a field never fails validation at the API. */
export const MAX = {
  candidateName: 200,
  candidateShortName: 60,
  runningMateName: 200,
  visionLine: 2_000,
  fineprint: 1_000,
  pullQuote: 1_000,
  candidateBio: 10_000,
  factionLabel: 100,
  sourceUrl: 2_000,
} as const;

/** HEX_COLOUR in admin-campaigns.schemas.ts. */
export const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** #abc -> #aabbcc. Anything already 6-digit (or unparseable) is passed through. */
export function expandHex(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  return short
    ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
    : value;
}

/** The API's httpUrl(): parseable AND http(s) — `new URL()` alone accepts javascript:. */
export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export type Confidence = "high" | "medium" | "low";

/** Exactly the columns the Ticket tab edits (the patchSchema whitelist). */
export interface Form {
  candidateName: string;
  candidateShortName: string;
  runningMateName: string;
  visionLine: string;
  fineprint: string;
  pullQuote: string;
  pullQuoteBg: string;
  brandColor: string;
  candidateBio: string;
  factionLabel: string;
  isDisputed: boolean;
  confidence: Confidence;
  sourceUrl: string;
}

/** The row this form binds to — a `CampaignDetail`, minus everything it ignores. */
export type FormSource = Pick<
  CampaignDetail,
  | "candidateName"
  | "candidateShortName"
  | "runningMateName"
  | "visionLine"
  | "fineprint"
  | "pullQuote"
  | "pullQuoteBg"
  | "brandColor"
  | "candidateBio"
  | "factionLabel"
  | "isDisputed"
  | "confidence"
  | "sourceUrl"
>;

/** null columns become "" so every input stays controlled; "" goes back as null. */
export function formOf(c: FormSource): Form {
  return {
    candidateName: c.candidateName ?? "",
    candidateShortName: c.candidateShortName ?? "",
    runningMateName: c.runningMateName ?? "",
    visionLine: c.visionLine ?? "",
    fineprint: c.fineprint ?? "",
    pullQuote: c.pullQuote ?? "",
    pullQuoteBg: c.pullQuoteBg ?? "",
    brandColor: c.brandColor ?? "",
    candidateBio: c.candidateBio ?? "",
    factionLabel: c.factionLabel ?? "",
    isDisputed: c.isDisputed,
    confidence: c.confidence,
    sourceUrl: c.sourceUrl ?? "",
  };
}

/**
 * The PATCH body: only what changed, with "" collapsed back to null (an empty
 * string would otherwise be STORED as an empty string, and a colour column would
 * fail the API's hex regex). `candidateName` is the one non-nullable string in
 * patchSchema, so it is only ever sent trimmed, never nulled. A change that is
 * pure whitespace is not a change at all — the API trims too.
 */
export function diffOf(form: Form, base: Form): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof Form)[]) {
    const next = form[key];
    if (next === base[key]) continue;
    if (typeof next === "string" && key !== "confidence") {
      const trimmed = next.trim();
      if (trimmed === base[key]) continue;
      body[key] = key === "candidateName" ? trimmed : trimmed || null;
    } else {
      body[key] = next;
    }
  }
  return body;
}

/** Inline problems the API would reject — checked before the request is made. */
export function problemsOf(form: Form): Partial<Record<keyof Form, string>> {
  const out: Partial<Record<keyof Form, string>> = {};
  if (form.candidateName.trim().length < 2)
    out.candidateName = "At least 2 characters.";
  if (form.runningMateName.trim() && form.runningMateName.trim().length < 2)
    out.runningMateName = "At least 2 characters (or leave it empty).";
  for (const key of ["pullQuoteBg", "brandColor"] as const) {
    const value = form[key].trim();
    if (value && !HEX.test(value)) out[key] = "Use #rgb or #rrggbb.";
  }
  const url = form.sourceUrl.trim();
  // httpUrl() on the API is z.string().url() + an http(s) scheme pin, so a bare
  // "example.com" or a "javascript:" URL must fail HERE, not in a 400.
  if (url && !isHttpUrl(url)) out.sourceUrl = "Enter a full http(s):// URL.";
  return out;
}

/**
 * Why a ticket is not on the public site — each branch is one clause of the
 * filter `CampaignsService` applies (PUBLIC_STATUSES + reviewed + confidence
 * above low), so an operator is never left guessing which one bit them.
 */
export function hiddenReason(c: {
  status: CampaignStatus;
  reviewStatus: ReviewStatus;
  reviewRequestedAt: string | null;
  confidence: string;
}): string {
  if (c.status === "draft") {
    // `request-changes` leaves reviewRequestedAt set, so the disputed check has
    // to come FIRST or a sent-back draft still claims to be waiting on review.
    if (c.reviewStatus === "disputed") return "Not public — changes requested";
    return c.reviewRequestedAt
      ? "Not public — waiting on review"
      : "Not public — draft";
  }
  if (c.status === "suspended") return "Not public — unpublished";
  if (c.status === "withdrawn" || c.status === "dissolved")
    return `Not public — ${c.status}`;
  if (c.confidence === "low") return "Not public — low confidence";
  return "Not public — edited since the last review";
}
