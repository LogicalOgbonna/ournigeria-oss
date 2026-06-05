/**
 * Per-state Local-Government council term start (the councilors' inauguration date
 * for the CURRENT term). Used as the default `official_positions.start_date` for a
 * created councilor (the column is NOT NULL). Each entry is cited. A state absent
 * here is GATED — submit-create refuses to create a councilor for it until added.
 */
export const COUNCILOR_TERM_START: Record<string, string> = {
  // Abia: LG election held 2 Nov 2024; chairmen + 184 ward councilors sworn in 4 Nov 2024.
  // Sources: channelstv.com (2024-11-04), thisdaylive.com (2024-11-05), ikengaonline.com (2024-11-04).
  abia: "2024-11-04",
};

/**
 * v1 creatable entity allow-list — parallel to APPLIABLE_FIELDS / isAppliable for
 * field updates. The agent can ONLY ever create a councilor (a nigerian_officials
 * row + an official_positions row with role='councilor'). Nothing else.
 */
export function isCreatableCouncilor(targetTable: string, role: string): boolean {
  return targetTable === "nigerian_officials" && role === "councilor";
}
