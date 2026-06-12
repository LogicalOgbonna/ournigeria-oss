/**
 * SINGLE SOURCE OF TRUTH for official profile completeness (Plan 45c, Fix #4).
 *
 * Replaces the four divergent copies that existed before:
 *  - apps/api officials.service TRACKED_FIELDS
 *  - apps/api enrichment.constants OFFICIAL_COMPLETENESS_FIELDS (+ raw SQL)
 *  - apps/api completeness.service COMPLETENESS_SQL (rankings now read the
 *    stored completeness_score column instead of recomputing inline)
 *  - awanaija profile-side TRACKED_FIELDS (reads the server score)
 *
 * Scoring = filled items / applicable items, where items are:
 *  - 8 flat contact/identity fields (all official types)
 *  - biography (narrative text)
 *  - education (legacy freeform text OR ≥1 structured row)
 *  - career (≥1 structured pre-politics row)
 *  - elected-only: positions, partyHistory, elections (≥1 row each)
 *
 * Categories like committees/bills/assets/awards/publications/family/legal are
 * deliberately NOT scored — they don't apply uniformly (a governor never has
 * committees) and would penalize complete profiles.
 */

/** Flat NigerianOfficial columns counted for every official type (camelCase). */
export const COMPLETENESS_FLAT_FIELDS = [
  "name",
  "imageUrl",
  "email",
  "phoneNumber",
  "officeAddress",
  "twitterHandle",
  "facebookUrl",
  "gender",
] as const;

export type CompletenessFlatField = (typeof COMPLETENESS_FLAT_FIELDS)[number];

/** Structured categories scored for every official type. */
export const COMPLETENESS_BASE_CATEGORIES = [
  "biography",
  "education",
  "career",
] as const;

/** Structured categories scored only for elected officials. */
export const COMPLETENESS_ELECTED_CATEGORIES = [
  "positions",
  "partyHistory",
  "elections",
] as const;

export type CompletenessCategory =
  | (typeof COMPLETENESS_BASE_CATEGORIES)[number]
  | (typeof COMPLETENESS_ELECTED_CATEGORIES)[number];

export interface CompletenessInput {
  /** elected | appointed | civil_servant | … (null → treated as elected, today's data) */
  officialType: string | null;
  /** Flat fields that are non-null/non-empty. */
  flat: Record<CompletenessFlatField, boolean>;
  /** biography text present */
  biography: boolean;
  /** legacy education text present OR ≥1 OfficialEducation row */
  education: boolean;
  /** ≥1 OfficialCareer row */
  career: boolean;
  /** ≥1 OfficialPosition row */
  positions: boolean;
  /** ≥1 OfficialPartyAffiliation row (or a current position with a party) */
  partyHistory: boolean;
  /** ≥1 OfficialElection row */
  elections: boolean;
}

export function electedApplies(officialType: string | null): boolean {
  // Null means pre-Plan-45 data, which is all elected politicians.
  return officialType === null || officialType === "elected";
}

/** Returns a 0–1 score rounded to 2dp, matching completeness_score Decimal(3,2). */
export function computeOfficialCompleteness(input: CompletenessInput): number {
  const items: boolean[] = [
    ...COMPLETENESS_FLAT_FIELDS.map((f) => input.flat[f]),
    input.biography,
    input.education,
    input.career,
  ];
  if (electedApplies(input.officialType)) {
    items.push(input.positions, input.partyHistory, input.elections);
  }
  const filled = items.filter(Boolean).length;
  return Number((filled / items.length).toFixed(2));
}
