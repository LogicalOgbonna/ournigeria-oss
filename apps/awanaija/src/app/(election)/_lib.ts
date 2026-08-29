import { PRESIDENTIAL_2027 } from "@/lib/presidential-2027";

/**
 * Shared by the `/elections` routes. Not a route — the `_` prefix keeps the file
 * private to the segment, and Next only routes reserved filenames anyway.
 *
 * Two jobs: the countdown/coverage helpers the holding page needs, and the
 * segment guards that decide whether a URL renders at all.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:3000/api";

/**
 * Polling day per cycle.
 *
 * TODO(election-date): confirm against INEC before the 2027 cycle. PROGRESS.md
 * records 2027-02-20 for the presidential/NASS poll, but a live PostHog gate
 * payload carries 2027-02-27. Every countdown is only as right as this map.
 *
 * Only the current cycle is listed. A year that isn't here gets no countdown
 * rather than a wrong one.
 */
const POLLING_DAY: Readonly<Record<number, number>> = {
  2027: Date.UTC(2027, 1, 20),
};

/** Days until that cycle's polling day, or null if we don't know the date. */
export function daysToGoFor(year: number): number | null {
  const target = POLLING_DAY[year];
  if (target === undefined) return null;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((target - today) / 86_400_000));
}

/** Same shape and fallback the homepage's coverage tiles use. */
export async function getCoverage(revalidate: number): Promise<string> {
  const fallback = { states: 36, lgas: 774, wards: 8809 };
  const stats = await fetch(`${API_BASE}/geo/stats`, {
    next: { revalidate },
  } as RequestInit)
    .then((res) => (res.ok ? res.json() : fallback))
    .catch(() => fallback);

  const n = (v: number) => v.toLocaleString("en-NG");
  return `${stats.states ?? 36} states + FCT · ${n(stats.lgas ?? 774)} LGAs · ${n(stats.wards ?? 8809)} wards`;
}

/**
 * The cycles this section actually covers.
 *
 * Deliberately a list, not a range. An open range (`1999..2100`) renders a page
 * for 2043 — a cycle nobody has data for — while 1800 404s: two different
 * answers to the same question. It is also deliberately not `MOCK_YEARS`
 * (`[2027, 2023, 2019]`), which drives the homepage year picker: 2023 and 2019
 * have no election content behind them, and listing a cycle here without its
 * data ships an empty page.
 *
 * Add a year only once something renders for it.
 */
export const ELECTION_CYCLES = [2027] as const;

export type ElectionCycle = (typeof ELECTION_CYCLES)[number];

/**
 * The party acronyms fielding a ticket in a cycle — the real list, not a shape
 * check, so a typo'd or invented acronym redirects instead of rendering a page
 * for a party that isn't standing.
 *
 * De-duplicated: `PRESIDENTIAL_2027` currently carries two NRM tickets
 * (`okereke-gali` and `kabiru-ofordile`). See `ticketsFor`.
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
 * A party standing in `year`, in the upper-case form the rest of the app uses
 * for party URLs (`/parties/APC`), or `null` — callers redirect to
 * `/elections/<year>`.
 *
 * This is validated against the real field rather than the acronym's shape. The
 * shape-only version was right while these were holding pages — it meant a real
 * party could never 404 because the API blinked — but the field is a local
 * constant now, so there is no API to blink and no reason to accept `/XYZ`.
 *
 * Case-insensitive on the way in so a lower-case link still resolves.
 */
export function parseParty(raw: string, year: number): string | null {
  const wanted = decodeURIComponent(raw).trim().toUpperCase();
  return partiesIn(year).find((acronym) => acronym === wanted) ?? null;
}
