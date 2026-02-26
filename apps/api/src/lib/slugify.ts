/**
 * Convert a title string into a URL-friendly slug.
 * Lowercases, strips non-alphanumeric characters, replaces spaces with hyphens,
 * and caps the result at 200 characters.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/**
 * Append a short suffix to a slug for collision handling.
 */
export function slugifyWithSuffix(title: string, suffix: string): string {
  const base = slugify(title);
  const maxBase = 200 - suffix.length - 1; // -1 for the hyphen separator
  return `${base.slice(0, maxBase)}-${suffix}`;
}
