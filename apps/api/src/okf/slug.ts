/** Deterministic, filename-safe slug. Used for node filenames and cross-links. */
export function okfSlug(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any non-alphanumeric run -> single dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}
