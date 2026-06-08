/**
 * Canonical slug helpers for human-readable, SEO-friendly URLs.
 *
 * Used by the officials slug backfill (packages/database/scripts) and the API
 * (generate-on-create + id-or-slug resolution). Keep this dependency-free so it
 * can be imported from scripts (tsx), the NestJS API, and anywhere else.
 */

/** Matches a canonical v4-ish UUID (the legacy /officials/<uuid> form). */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Build a URL-safe slug from a human name.
 *
 * lowercase -> strip diacritics -> "&" to "and" -> drop apostrophes/periods ->
 * non-alphanumerics to "-" -> collapse/trim dashes -> cap length.
 *
 * Examples:
 *   "Francis Nwifuru"      -> "francis-nwifuru"
 *   "Bumbum 'B (Mai'adua)" -> "bumbum-b-maiadua"
 *   "Obi & Sons"           -> "obi-and-sons"
 */
export function slugifyName(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/['’.]/g, "") // drop apostrophes (straight + curly) and periods
    .replace(/[^a-z0-9]+/g, "-") // everything else -> dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .slice(0, 120)
    .replace(/-+$/g, ""); // re-trim in case slice cut mid-dash
}
