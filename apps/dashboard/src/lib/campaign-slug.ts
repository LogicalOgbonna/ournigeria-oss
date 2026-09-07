/**
 * Client-side twin of the ticket slug the API derives (admin-campaigns.service
 * `deriveSlug` + `packages/database/src/slug.ts` `slugifyName`). The create form
 * shows the operator the URL their ticket will get BEFORE they submit, so the
 * two must agree; the API still owns the final word (it de-duplicates a derived
 * slug with a `-2` suffix, and rejects a supplied one that is already taken).
 */

/** SLUG_RE from apps/api/src/campaigns/admin-campaigns.schemas.ts. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** createSchema: `.min(2).max(160)` on top of the pattern. */
export const SLUG_MIN = 2;
export const SLUG_MAX = 160;

/** Mirrors slugifyName in @ournigeria/database (NFKD fold, drop apostrophes). */
export function slugifyName(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/['’.]/g, "") // apostrophes (straight + curly) and periods
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

/** The last whitespace-separated word of a name ("Peter Gregory Obi" -> "obi"). */
function surname(name: string): string {
  const trimmed = name.trim();
  return slugifyName(trimmed.split(/\s+/).at(-1) ?? trimmed);
}

/**
 * `<candidate-surname>-<mate-surname>`, or the candidate's whole name when the
 * race has no running mate — the API's `deriveSlug`, with two edges tightened.
 *
 * The API joins its two parts blindly, so a name that folds away to nothing (a
 * name of only punctuation) leaves it with a leading or trailing dash that its
 * OWN `SLUG_RE` would reject; here the empty part is dropped instead, and the
 * result always either matches SLUG_RE or is empty. The join is also truncated
 * to SLUG_MAX: `.max(160)` applies to the whole slug, while slugifyName only
 * caps each part at 120.
 */
export function deriveTicketSlug(
  candidateName: string | null | undefined,
  mateName: string | null | undefined,
): string {
  const candidate = (candidateName ?? "").trim();
  if (!candidate) return "";
  const mate = (mateName ?? "").trim();
  const joined = mate
    ? [surname(candidate), surname(mate)].filter(Boolean).join("-")
    : slugifyName(candidate);
  return joined.slice(0, SLUG_MAX).replace(/-+$/g, "");
}

/** Null when the slug is acceptable, otherwise the message to show inline. */
export function slugError(slug: string): string | null {
  if (!slug) return "A slug is required — it becomes the ticket's public URL.";
  if (slug.length < SLUG_MIN) return `Slug must be at least ${SLUG_MIN} characters.`;
  if (slug.length > SLUG_MAX) return `Slug must be at most ${SLUG_MAX} characters.`;
  if (!SLUG_RE.test(slug))
    return "Use lowercase letters, numbers and single dashes (no leading, trailing or repeated dashes).";
  return null;
}
