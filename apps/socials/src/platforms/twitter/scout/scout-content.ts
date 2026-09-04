/**
 * Pure (DI-free) helpers for the location scout — search-query construction for
 * one Nigerian state. Importable by tsx checks/tests without booting Nest.
 *
 * Strategy: X search matches TWEET TEXT (not bios), so we search for
 * self-identification phrases ("from Kano", "based in Kano", "Kano indigene")
 * and let the geo classifier read the author's bio + tweet to decide whether
 * the AUTHOR is actually attributable to the place.
 */

/** X web search rejects very long raw queries; stay comfortably under. */
export const MAX_QUERY_CHARS = 400;

/** Self-identification phrase templates ({place} = state or LGA name). */
const STATE_PHRASES = [
  '"from {place}"',
  '"based in {place}"',
  '"{place} indigene"',
  '"live in {place}"',
  '"here in {place}"',
];

const LGA_PHRASES = ['"from {place}"', '"{place} LGA"'];

function orGroup(phrases: string[], place: string): string {
  return `(${phrases.map((p) => p.replaceAll("{place}", place)).join(" OR ")})`;
}

/**
 * Queries for one state: one state-level self-identification query, then
 * LGA-name queries chunked so each stays under MAX_QUERY_CHARS. Retweets are
 * excluded at the source (an RT tells us nothing about its retweeter's home).
 */
export function buildScoutQueries(
  stateName: string,
  lgaNames: string[],
): string[] {
  const queries: string[] = [
    `${orGroup(STATE_PHRASES, stateName)} -filter:retweets`,
  ];

  let group: string[] = [];
  let groupLen = 0;
  const flush = () => {
    if (group.length === 0) return;
    queries.push(`(${group.join(" OR ")}) -filter:retweets`);
    group = [];
    groupLen = 0;
  };

  for (const lga of lgaNames) {
    // Skip LGA names that collide with the state name (e.g. "Bauchi" LGA in
    // Bauchi state) — the state query already covers them.
    if (lga.toLowerCase() === stateName.toLowerCase()) continue;
    const part = orGroup(LGA_PHRASES, lga);
    // +24 covers " OR " joiners + wrapping parens + the retweets filter.
    if (groupLen + part.length + 24 > MAX_QUERY_CHARS) flush();
    group.push(part);
    groupLen += part.length + 4;
  }
  flush();

  return queries;
}
