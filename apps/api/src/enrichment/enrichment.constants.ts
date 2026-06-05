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
  // Financial domains (filled in their own later plans; listed so grants + apply agree)
  faac_disbursements: [],
  budget_metadata: [],
} as const;

/** The 10 official fields that define completeness (mirrors CompletenessService). */
export const OFFICIAL_COMPLETENESS_FIELDS = [
  "name", "image_url", "email", "phone_number", "office_address",
  "twitter_handle", "facebook_url", "education", "biography", "gender",
] as const;

export function isAppliable(table: string, field: string): boolean {
  return APPLIABLE_FIELDS[table]?.includes(field) ?? false;
}
