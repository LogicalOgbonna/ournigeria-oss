/**
 * Entity-role buckets for the enrichment portal's "by entity" filter.
 *
 * Position roles are stored inconsistently across the data (`rep` vs `representative`,
 * mixed case — see geo.service's case-insensitive role queries). The dashboard filter
 * needs a fixed, predictable vocabulary, so every resolved role is normalized into one
 * of these buckets; anything outside the set collapses to `unknown`.
 */
export const ENTITY_ROLE_BUCKETS = [
  "governor",
  "senator",
  "representative",
  "mha",
  "lga_chairman",
  "councilor",
  "unknown",
] as const;

export type EntityRole = (typeof ENTITY_ROLE_BUCKETS)[number];

const BUCKET_SET = new Set<string>(ENTITY_ROLE_BUCKETS);

/** Aliases for roles stored under a different spelling than the canonical bucket. */
const ROLE_ALIASES: Record<string, EntityRole> = {
  rep: "representative",
};

/**
 * Normalize a raw position role into a fixed entity bucket. Lower-cases and trims,
 * applies known aliases, and falls back to `"unknown"` for null/empty/out-of-set values.
 */
export function normalizeEntityRole(raw: string | null | undefined): EntityRole {
  if (!raw) return "unknown";
  const key = raw.trim().toLowerCase();
  if (!key) return "unknown";
  if (key in ROLE_ALIASES) return ROLE_ALIASES[key];
  return BUCKET_SET.has(key) ? (key as EntityRole) : "unknown";
}
