/**
 * Tables the apply service is allowed to write, and which columns per table.
 *
 * NOTE — coverage vs. DB grants: the `enrichment_apply` role (roles migration) is also
 * granted UPDATE on faac_state_allocations, faac_lga_allocations, debt_records, gdp_records,
 * igr_records and population_estimates. Those are deliberately reserved for later plans and
 * are NOT listed here yet, so `isAppliable()` rejects them — the grant exists, the app path
 * does not. `faac_disbursements`/`budget_metadata` are listed with empty field sets for the
 * same reason.
 *
 * NOTE — CHECK-constrained fields: `official_positions.status` (IN active|contested|suspended)
 * and `official_positions.end_reason` carry DB CHECK constraints. A proposed value outside
 * those sets will fail inside the apply transaction and roll back. Clean app-level validation
 * (returning 400 instead of a 500) is deferred to the agent-write plan (#3), which is the
 * first code path that can actually propose these fields.
 */
export const APPLIABLE_FIELDS: Record<string, readonly string[]> = {
  nigerian_officials: [
    "image_url", "email", "phone_number", "office_address", "twitter_handle",
    "facebook_url", "date_of_birth", "gender", "education", "biography",
  ],
  official_positions: [
    "party_acronym", "leadership_role", "end_date", "end_reason",
    "source_url", "source_date", "status",
  ],
  // Plan 45c structured fact tables — field-level corrections on existing rows.
  // (Whole-row creation goes through CREATABLE_ENTITIES, not this list.)
  official_education: ["institution", "institution_type", "qualification", "field", "start_year", "end_year", "graduated", "location"],
  official_careers: ["organization", "role", "industry", "employment_type", "start_year", "end_year", "description"],
  official_party_affiliations: ["start_date", "end_date", "reason"],
  official_committees: ["committee_name", "chamber", "role", "start_date", "end_date"],
  official_sponsored_bills: ["title", "bill_number", "status", "status_date", "summary"],
  official_elections: ["result", "votes", "vote_percentage", "winner_name", "election_date", "notes"],
  official_asset_declarations: ["year", "declared_to", "amount", "currency", "summary"],
  official_awards: ["title", "awarded_by", "year", "category", "description"],
  official_publications: ["title", "type", "publisher", "year"],
  official_family_members: ["relationship", "name", "is_public_figure", "notes"],
  official_legal_cases: ["title", "case_type", "status", "forum", "case_number", "filed_date", "resolved_date", "outcome"],
  corruption_cases: ["title", "summary", "case_type", "status", "forum", "amount_involved", "amount_recovered", "sector", "opened_date", "charge_date", "verdict_date", "outcome", "sentence"],
  // Parties (from main) — field-level corrections on existing party/chapter rows.
  political_parties: [
    "logo_url", "founding_year", "leader_name", "hq_address", "website",
    "email", "phone_number", "twitter_handle", "facebook_url", "description",
    "ideology", "slogan", "color", "inec_status",
  ],
  party_state_chapters: [
    "chairman_name", "secretary_name", "hq_address", "phone_number",
    "email", "website", "twitter_handle",
  ],
  party_officers: ["name", "image_url", "source_url"],
  // Financial domains (filled in their own later plans; listed so grants + apply agree)
  faac_disbursements: [],
  budget_metadata: [],
} as const;

// Completeness definition now lives in @ournigeria/shared-types (Plan 45c Fix #4);
// recompute is owned by CompletenessService.

/** Party identity + contact + substance fields that define completeness. */
export const PARTY_COMPLETENESS_FIELDS = [
  "name", "logo_url", "founding_year", "leader_name", "hq_address",
  "website", "email", "phone_number", "description", "ideology", "inec_status",
] as const;

/** State-chapter fields that define completeness. */
export const PARTY_CHAPTER_COMPLETENESS_FIELDS = [
  "chairman_name", "secretary_name", "hq_address", "phone_number",
  "email", "website", "twitter_handle",
] as const;

/**
 * Tables whose completeness_score the apply service recomputes INLINE (raw SQL)
 * after a write. nigerian_officials is intentionally NOT here — official
 * completeness is category-aware and owned by CompletenessService (Plan 45c,
 * @ournigeria/shared-types), recomputed post-commit in the apply service.
 */
export const COMPLETENESS_FIELDS_BY_TABLE: Record<string, readonly string[]> = {
  political_parties: PARTY_COMPLETENESS_FIELDS,
  party_state_chapters: PARTY_CHAPTER_COMPLETENESS_FIELDS,
} as const;

/**
 * Primary-key column per appliable table, for the apply/recompute WHERE clause.
 * Most tables use a uuid `id`; political_parties is keyed by its varchar `acronym`.
 * `cast` is the SQL cast applied to the bound pk param (empty for text keys).
 */
export const PK_BY_TABLE: Record<string, { col: string; cast: string }> = {
  nigerian_officials: { col: "id", cast: "::uuid" },
  official_positions: { col: "id", cast: "::uuid" },
  political_parties: { col: "acronym", cast: "" },
  party_state_chapters: { col: "id", cast: "::uuid" },
} as const;

/** PK clause `"col" = $N[::cast]` for a table; defaults to uuid `id` if unmapped. */
export function pkClause(table: string, paramIndex: number): string {
  const pk = PK_BY_TABLE[table] ?? { col: "id", cast: "::uuid" };
  return `"${pk.col}" = $${paramIndex}${pk.cast}`;
}

export function isAppliable(table: string, field: string): boolean {
  return APPLIABLE_FIELDS[table]?.includes(field) ?? false;
}
