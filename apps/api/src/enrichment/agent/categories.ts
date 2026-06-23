/**
 * Category catalog for the autonomous enrichment sweeper.
 *
 * Each category the agent can autonomously work on maps to:
 *  - a profile domain (getProfile / corroboration rules)
 *  - the structured table it fills
 *  - a "kind": fillable (gap = zero rows) vs investigative (gap = never checked /
 *    due for re-check — most officials legitimately have none)
 *  - applicability by officialType (political categories only for elected/null)
 *
 * This is the single source of truth the gap-finder reads. Keep `category`
 * values in sync with EnrichmentAttempt.category and the evidence entry types.
 */

export type CategoryKind = "fillable" | "investigative";

export interface CategorySpec {
  /** Stable key, stored in enrichment_attempts.category and used by the sweeper/Hermes. */
  category: string;
  /** Profile domain (apps/api/src/enrichment/agent/profiles.ts). */
  domain: string;
  /** Live table the category fills (for the zero-row gap test on fillable categories). */
  table: string;
  kind: CategoryKind;
  /** When true, only applies to elected officials (officialType 'elected' or null). */
  electedOnly: boolean;
  /** Human label for prompts/logs. */
  label: string;
}

export const CATEGORIES: CategorySpec[] = [
  { category: "education", domain: "education", table: "official_education", kind: "fillable", electedOnly: false, label: "Education" },
  { category: "career", domain: "careers", table: "official_careers", kind: "fillable", electedOnly: false, label: "Career before politics" },
  { category: "party_affiliation", domain: "party_affiliations", table: "official_party_affiliations", kind: "fillable", electedOnly: true, label: "Party affiliations" },
  { category: "committee", domain: "committees", table: "official_committees", kind: "fillable", electedOnly: true, label: "Committees" },
  { category: "bill", domain: "bills", table: "official_sponsored_bills", kind: "fillable", electedOnly: true, label: "Sponsored bills" },
  { category: "election", domain: "elections", table: "official_elections", kind: "fillable", electedOnly: true, label: "Elections contested" },
  { category: "asset", domain: "assets", table: "official_asset_declarations", kind: "fillable", electedOnly: false, label: "Asset declarations" },
  { category: "award", domain: "awards", table: "official_awards", kind: "fillable", electedOnly: false, label: "Awards & honours" },
  { category: "publication", domain: "publications", table: "official_publications", kind: "fillable", electedOnly: false, label: "Publications" },
  // Investigative — gap is "never checked / due for re-check", never a zero-row inference.
  { category: "family", domain: "family", table: "official_family_members", kind: "investigative", electedOnly: false, label: "Family" },
  { category: "legal_case", domain: "legal_cases", table: "official_legal_cases", kind: "investigative", electedOnly: false, label: "Legal cases" },
  { category: "corruption", domain: "corruption", table: "corruption_cases", kind: "investigative", electedOnly: false, label: "Corruption involvement" },
];

export const CATEGORY_BY_KEY: Record<string, CategorySpec> = Object.fromEntries(
  CATEGORIES.map((c) => [c.category, c]),
);

export function isElected(officialType: string | null): boolean {
  return officialType === null || officialType === "elected";
}

/** Categories that apply to a given official type. */
export function applicableCategories(officialType: string | null): CategorySpec[] {
  const elected = isElected(officialType);
  return CATEGORIES.filter((c) => !c.electedOnly || elected);
}
