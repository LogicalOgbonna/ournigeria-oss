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

/**
 * Physical column for each flat field. Declared as a total Record so adding a
 * field to COMPLETENESS_FLAT_FIELDS is a compile error until it is mapped here.
 */
export const COMPLETENESS_FLAT_COLUMNS: Record<CompletenessFlatField, string> = {
  name: "name",
  imageUrl: "image_url",
  email: "email",
  phoneNumber: "phone_number",
  officeAddress: "office_address",
  twitterHandle: "twitter_handle",
  facebookUrl: "facebook_url",
  gender: "gender",
};

/**
 * SQL twin of computeOfficialCompleteness(), generated from the same constants.
 *
 * Aggregate queries (the state/LGA leaderboards) MUST use this rather than
 * averaging the stored completeness_score column: recompute() only runs on the
 * proposal-approval and enrichment-apply paths, so every bulk-imported official
 * still has completeness_score = NULL. Averaging that column made
 * COALESCE(AVG(NULL), 0) report fully-populated states as a hard 0.
 *
 * `alias` is the table alias for nigerian_officials in the caller's query.
 * Returns a numeric expression in [0, 1] rounded to 2dp, or NULL when the row
 * is absent (outer join miss) so AVG skips it instead of counting it as zero.
 */
export function completenessSql(alias = "o"): string {
  const filled = (col: string) =>
    `(${alias}.${col} IS NOT NULL AND ${alias}.${col} <> '')`;
  const exists = (table: string) =>
    `EXISTS (SELECT 1 FROM ${table} x WHERE x.official_id = ${alias}.id)`;

  const flat = COMPLETENESS_FLAT_FIELDS.map((f) =>
    filled(COMPLETENESS_FLAT_COLUMNS[f]),
  );
  const base = [
    filled("biography"),
    `(${filled("education")} OR ${exists("official_education")})`,
    exists("official_careers"),
  ];
  const elected = [
    exists("official_positions"),
    exists("official_party_affiliations"),
    exists("official_elections"),
  ];

  const count = (parts: string[]) =>
    parts.map((p) => `(${p})::int`).join(" + ");

  // electedApplies(): NULL official_type is pre-Plan-45 data, i.e. politicians.
  const isElected = `(${alias}.official_type IS NULL OR ${alias}.official_type = 'elected')`;

  const filledCount = `(${count([...flat, ...base])} + CASE WHEN ${isElected} THEN ${count(elected)} ELSE 0 END)`;
  const applicable = `(${flat.length + base.length} + CASE WHEN ${isElected} THEN ${elected.length} ELSE 0 END)`;

  return `CASE WHEN ${alias}.id IS NULL THEN NULL
    ELSE ROUND(${filledCount}::numeric / ${applicable}::numeric, 2) END`;
}

/** completenessSql() for the conventional `o` alias. */
export const COMPLETENESS_SQL = completenessSql("o");
