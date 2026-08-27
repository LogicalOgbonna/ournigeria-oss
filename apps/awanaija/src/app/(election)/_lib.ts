/**
 * Shared by the election holding pages. Not a route — the `_` prefix keeps the
 * file private to the segment, and Next only routes reserved filenames anyway.
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
 * A four-digit cycle we're willing to address, or null. Anything else 404s
 * rather than rendering a holding page for `/elections/99999` and friends.
 */
export function parseYear(raw: string): number | null {
  if (!/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  return year >= 1999 && year <= 2100 ? year : null;
}

/**
 * A party acronym in the shape the rest of the app uses (`/parties/APC`), or
 * null. Shape only: the holding page deliberately doesn't reach for the party
 * list, so it can't 404 a real party because the API blinked. Worth validating
 * against the real list once this page has content behind it.
 */
export function parseParty(raw: string): string | null {
  const party = decodeURIComponent(raw).trim();
  return /^[A-Za-z][A-Za-z0-9-]{1,15}$/.test(party) ? party.toUpperCase() : null;
}
