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
  political_parties: [
    "logo_url", "founding_year", "leader_name", "hq_address", "website",
    "email", "phone_number", "twitter_handle", "facebook_url", "description",
    "ideology", "slogan", "color", "inec_status",
  ],
  party_state_chapters: [
    "chairman_name", "secretary_name", "hq_address", "phone_number",
    "email", "website", "twitter_handle",
  ],
  // Financial domains (filled in their own later plans; listed so grants + apply agree)
  faac_disbursements: [],
  budget_metadata: [],
} as const;

/** The 10 official fields that define completeness (mirrors CompletenessService). */
export const OFFICIAL_COMPLETENESS_FIELDS = [
  "name", "image_url", "email", "phone_number", "office_address",
  "twitter_handle", "facebook_url", "education", "biography", "gender",
] as const;

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
 * Tables whose completeness_score the apply service recomputes after a write,
 * mapped to the field list that defines it. Keep in sync with the per-table
 * completeness constants above.
 */
export const COMPLETENESS_FIELDS_BY_TABLE: Record<string, readonly string[]> = {
  nigerian_officials: OFFICIAL_COMPLETENESS_FIELDS,
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
