/**
 * Shared state/LGA name normalization for search tools.
 *
 * The DB stores states as Title Case (e.g. "Lagos", "Akwa Ibom") except
 * "FCT". Aliases cover common spellings found in source PDFs.
 */
export const STATE_ALIASES: Record<string, string> = {
  "fct": "FCT",
  "fct-abuja": "FCT",
  "fct abuja": "FCT",
  "nassarawa": "Nasarawa",
  "nasarawa": "Nasarawa",
  "akwa-ibom": "Akwa Ibom",
  "cross-river": "Cross River",
};

/** Normalize and title-case a state/LGA name, handling common PDF aliases. */
export function titleCaseState(s: string): string {
  const lower = s.toLowerCase().trim();
  if (STATE_ALIASES[lower]) return STATE_ALIASES[lower];
  return lower
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
