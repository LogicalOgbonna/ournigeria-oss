/** Tables the apply service is allowed to write, and which columns per table. */
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
