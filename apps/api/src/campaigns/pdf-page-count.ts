/**
 * Best-effort page count without a PDF library (pdf-parse is pruned from the
 * production image): count `/Type /Page` object dictionaries, excluding the
 * `/Pages` tree nodes. Object streams (compressed dictionaries) hide pages
 * from this scan, so the result is a SUGGESTION the form lets the manager
 * overwrite. Null when nothing was found.
 */
export function countPdfPages(bytes: Buffer): number | null {
  const text = bytes.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?![s\w])/g);
  return matches && matches.length > 0 ? matches.length : null;
}
