import { getCampaign, getCampaigns, publicTicket, toRailCandidate } from "@/lib/campaigns";
import { getElectionGate, offGate, type ElectionGate } from "@/lib/election-gate";
import type { RailCandidate } from "@/lib/home-ballot";

/**
 * Shared by the `/elections` routes. Not a route — the `_` prefix keeps the file
 * private to the segment, and Next only routes reserved filenames anyway.
 *
 * Two jobs: the countdown/coverage helpers the holding page needs, and the
 * segment guards that decide whether a URL renders at all. The field itself
 * comes from `GET /api/campaigns` (seeded from
 * packages/database/data/campaigns-2027-presidential.json); nothing here is
 * hardcoded except the cycles we cover.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:3000/api";

/**
 * Days until a cycle's presidential polling day, straight off the election
 * gate — the `elections` DB row is the single source of truth for the date
 * (INEC's announced 2027-01-16; the old hardcoded 2027-02-20 and the PostHog
 * payload's 2027-02-27 were both stale). Null when the gate is off, carries
 * no presidential race for the cycle, or only knows the date to year/month
 * precision — no countdown rather than a fake-precise one.
 */
export async function daysToGoFor(year: number, now: Date = new Date()): Promise<number | null> {
  // Unknown gate => no countdown, same as an off gate.
  return countdownFor((await getElectionGate()) ?? offGate(), year, now);
}

/** Pure core of `daysToGoFor`, split out so tests can feed a gate directly. */
export function countdownFor(gate: ElectionGate, year: number, now: Date = new Date()): number | null {
  if (!gate.enabled) return null;
  const race = gate.races.find((r) => r.office === "president" && r.year === year);
  if (!race) return null;
  // Only a day-precision date can honestly count days ("YYYY"/"YYYY-MM" can't).
  const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(race.date);
  if (!full) return null;
  const target = Date.UTC(Number(full[1]), Number(full[2]) - 1, Number(full[3]));
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
 * answers to the same question. It is also deliberately not the homepage year
 * picker's list (derived from the election-gate payload in `home-ballot.ts`):
 * a cycle can be gated on before its election pages have content, and listing
 * a cycle here without its data ships an empty page. Dates are NOT this list's
 * business: the countdown (`daysToGoFor`) reads the gate, so a cycle listed
 * here simply shows no countdown until its race carries a day-precision date.
 *
 * Add a year only once something renders for it.
 */
export const ELECTION_CYCLES = [2027] as const;

export type ElectionCycle = (typeof ELECTION_CYCLES)[number];

/** Every presidential ticket the API has for a cycle, as rail posters. */
export async function presidentialTickets(year: number): Promise<readonly RailCandidate[]> {
  if (!(ELECTION_CYCLES as readonly number[]).includes(year)) return [];
  const campaigns = await getCampaigns({ year, type: "presidential" });
  return campaigns.map(toRailCandidate);
}

/**
 * The party acronyms fielding a ticket in a cycle — the real list, not a shape
 * check, so a typo'd or invented acronym redirects instead of rendering a page
 * for a party that isn't standing. De-duplicated: a party can field rival
 * slates (see `ticketsFor`).
 */
export async function partiesIn(year: number): Promise<readonly string[]> {
  const tickets = await presidentialTickets(year);
  return [...new Set(tickets.map((t) => t.party.acronym))];
}

/**
 * Every ticket standing under one party in a cycle.
 *
 * Normally one. Rival slates from a factional dispute share the acronym, which
 * is why the ticket route is keyed on the ticket slug (`ticketBySlug`) rather
 * than the party. An acronym URL with several tickets renders a chooser.
 */
export async function ticketsFor(year: number, acronym: string): Promise<readonly RailCandidate[]> {
  const tickets = await presidentialTickets(year);
  return tickets.filter((t) => t.party.acronym === acronym);
}

/** The ticket slugs in a cycle — the `/elections/<year>/<ticket>` segments. */
export async function slugsIn(year: number): Promise<readonly string[]> {
  const tickets = await presidentialTickets(year);
  return tickets.map((t) => t.id);
}

/**
 * One ticket by its slug (`tinubu-shettima`, `austin-akobundu`), with its
 * long-form profile when the campaign carries editorial copy and the labels
 * for its race. ANY public ticket the API returns in the cycle resolves —
 * presidential, governorship, senate, House, state assembly, LGA — unlike the
 * rail and the party chooser above, which are presidential by design. Null
 * when the API has no public ticket under that slug in that cycle.
 */
export async function ticketBySlug(
  year: number,
  slug: string,
): Promise<ReturnType<typeof publicTicket>> {
  if (!(ELECTION_CYCLES as readonly number[]).includes(year)) return null;
  const campaign = await getCampaign(slug);
  if (!campaign) return null;
  return publicTicket(campaign, year);
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
 * `/elections/<year>`. Case-insensitive on the way in so a lower-case link
 * still resolves.
 */
export async function parseParty(raw: string, year: number): Promise<string | null> {
  const wanted = decodeURIComponent(raw).trim().toUpperCase();
  return (await partiesIn(year)).find((acronym) => acronym === wanted) ?? null;
}
