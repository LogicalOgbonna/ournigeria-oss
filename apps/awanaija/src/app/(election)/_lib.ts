import { PRESIDENTIAL_2027 } from "@/lib/presidential-2027";

/**
 * Shared route guards for the `/elections` section.
 *
 * The section has three levels — `/elections`, `/elections/<year>` and
 * `/elections/<year>/<party>` — and every bad segment resolves to the nearest
 * level that exists rather than to a 404. A cycle we don't cover and a cycle
 * that isn't a year are the same question, so they get the same answer.
 */

/**
 * The cycles this section actually covers.
 *
 * Deliberately NOT a range. An open range (`1999..2100`) renders a page for
 * 2043, which is a cycle nobody has data for, while 1800 404s — two different
 * answers to the same question. It is also deliberately not `MOCK_YEARS`
 * (`[2027, 2023, 2019]`), which drives the homepage year picker: 2023 and 2019
 * have no election content behind them, and listing a cycle here without its
 * data ships an empty page.
 *
 * Add a year here only once something renders for it.
 */
export const ELECTION_CYCLES = [2027] as const;

export type ElectionCycle = (typeof ELECTION_CYCLES)[number];

/**
 * The party acronyms fielding a ticket in a cycle — the real list, not a shape
 * check. `parseParty` validates against this so a typo'd or invented acronym
 * redirects instead of rendering a page for a party that isn't standing.
 *
 * De-duplicated: `PRESIDENTIAL_2027` currently carries two NRM tickets
 * (`okereke-gali` and `kabiru-ofordile`). See `ticketsFor` below.
 */
export function partiesIn(year: number): readonly string[] {
  if (year !== 2027) return [];
  return [...new Set(PRESIDENTIAL_2027.map((t) => t.party.acronym))];
}

/**
 * Every ticket standing under one party in a cycle.
 *
 * Normally one. `PRESIDENTIAL_2027` has 19 tickets across 18 acronyms because
 * NRM appears twice, which no party can actually do — an open data question
 * against the 2027 import, tracked in PROGRESS.md. Callers render the first and
 * the extra ticket is unreachable until the source data is corrected; the route
 * shape stays `/elections/<year>/<party>` because 17 of 18 are unambiguous.
 */
export function ticketsFor(year: number, acronym: string) {
  if (year !== 2027) return [];
  return PRESIDENTIAL_2027.filter((t) => t.party.acronym === acronym);
}

/** A covered cycle, or `null` — callers redirect to `/elections`. */
export function parseYear(raw: string): number | null {
  // Guard the string first: `Number("")` is 0 and `Number(" 2027 ")` is 2027,
  // so a bare numeric cast would accept segments that are not four digits.
  if (!/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  return (ELECTION_CYCLES as readonly number[]).includes(year) ? year : null;
}

/**
 * A party standing in `year`, normalised to its canonical casing, or `null` —
 * callers redirect to `/elections/<year>`.
 *
 * Case-insensitive because the URLs are lowercase (`/elections/2027/apc`) while
 * the data is upper (`APC`).
 */
export function parseParty(raw: string, year: number): string | null {
  const wanted = raw.trim().toUpperCase();
  return partiesIn(year).find((acronym) => acronym === wanted) ?? null;
}
