/**
 * Single source of truth for what an evidence row may point at.
 * Mirrors the chk_evidence_entry_type CHECK constraint in migration
 * 20260612030815_official_profile_structured_data — keep both in sync.
 */
export const EVIDENCE_ENTRY_TYPES = [
  "official_field", // official-level flat field (biography, legacy education text) — uses `field`
  "education",
  "career",
  "position",
  "election",
  "party_affiliation",
  "committee",
  "bill",
  "asset",
  "award",
  "publication",
  "family",
  "legal_case",
  "corruption_case",
  "corruption_case_party",
  "corruption_case_update",
] as const;

export type EvidenceEntryType = (typeof EVIDENCE_ENTRY_TYPES)[number];

export function isEvidenceEntryType(v: string): v is EvidenceEntryType {
  return (EVIDENCE_ENTRY_TYPES as readonly string[]).includes(v);
}
