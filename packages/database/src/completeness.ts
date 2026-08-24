/**
 * SINGLE SOURCE OF TRUTH for official profile completeness (Plan 45c, Fix #4).
 *
 * Lives in @ournigeria/database (a BUILT package) — not @ournigeria/shared-types,
 * which ships raw .ts as its `main` and is only safe for type-only imports. The
 * API imports these as runtime VALUES, so they must come from a compiled package
 * or the production API crashes on boot (`require` of a .ts file).
 *
 * Scoring = filled items / applicable items:
 *  - 8 flat contact/identity fields (every official type)
 *  - biography, education, career categories (every type)
 *  - elected-only: positions, partyHistory, elections
 */

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

export const COMPLETENESS_BASE_CATEGORIES = ["biography", "education", "career"] as const;
export const COMPLETENESS_ELECTED_CATEGORIES = ["positions", "partyHistory", "elections"] as const;

export type CompletenessCategory =
  | (typeof COMPLETENESS_BASE_CATEGORIES)[number]
  | (typeof COMPLETENESS_ELECTED_CATEGORIES)[number];

export interface CompletenessInput {
  /** elected | appointed | civil_servant | … (null → treated as elected, today's data) */
  officialType: string | null;
  flat: Record<CompletenessFlatField, boolean>;
  biography: boolean;
  /** legacy education text present OR ≥1 OfficialEducation row */
  education: boolean;
  career: boolean;
  positions: boolean;
  partyHistory: boolean;
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
