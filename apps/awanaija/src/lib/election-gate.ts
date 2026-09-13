const CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 1_500;

export type Office =
  | "president" | "governor" | "senate" | "hor"
  | "state_assembly" | "lga_chairman" | "councillor";

const OFFICES: readonly Office[] = [
  "president", "governor", "senate", "hor", "state_assembly", "lga_chairman", "councillor",
];

export interface Race {
  office: Office;
  /**
   * The CYCLE year — matches `campaigns.year` and addresses the ballot API.
   * NOT derivable from `date`: a Dec election postponed into January keeps
   * its cycle year while the date's calendar year moves.
   */
  year: number;
  date: string;            // "YYYY" | "YYYY-MM" | "YYYY-MM-DD" per the gate's date precision
  label?: string;
  states: string[];
  constituencies: string[];
  lgas: string[];          // composite "<state>/<lga>"
  excludeStates: string[];
}

export interface ElectionGate {
  enabled: boolean;
  races: Race[];
}

/**
 * The deliberately-off gate. Callers that get `null` from `getElectionGate`
 * (gate UNREACHABLE, nothing stale) and want today's fail-quiet behavior
 * coalesce with this — hiding election UI when the gate is unknown. The
 * homepage is the one caller that treats the two differently (see
 * `buildHomeRaces`): explicit off kills the hero, unknown falls back.
 */
export function offGate(): ElectionGate {
  return { enabled: false, races: [] };
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function isOffice(v: unknown): v is Office {
  return typeof v === "string" && (OFFICES as readonly string[]).includes(v);
}

/** Offices elected nationwide — scope lists (states/constituencies/lgas/excludeStates) don't apply. */
const NATIONAL_OFFICES: ReadonlySet<Office> = new Set(["president"]);

export function parseRace(raw: unknown): Race | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isOffice(r.office)) return null;
  if (typeof r.year !== "number" || !Number.isInteger(r.year) || r.year <= 0) return null;
  if (typeof r.date !== "string" || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(r.date)) return null;
  const race: Race = {
    office: r.office,
    year: r.year,
    date: r.date,
    label: typeof r.label === "string" ? r.label : undefined,
    states: asStringArray(r.states),
    constituencies: asStringArray(r.constituencies),
    lgas: asStringArray(r.lgas),
    excludeStates: asStringArray(r.excludeStates),
  };
  if (NATIONAL_OFFICES.has(race.office)) {
    race.states = [];
    race.constituencies = [];
    race.lgas = [];
    race.excludeStates = [];
  }
  return race;
}

/**
 * Validate a `GET /api/election/gate` response body. Null = not a gate at all
 * (never cached or trusted). A malformed race inside an otherwise valid body
 * is dropped and logged — the rest of the gate stands.
 */
export function parseGate(body: unknown): ElectionGate | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.enabled !== "boolean" || !Array.isArray(b.races)) return null;
  if (!b.enabled) return offGate();
  const races: Race[] = [];
  for (const raw of b.races) {
    const race = parseRace(raw);
    if (race) races.push(race);
    else console.warn(`[election-gate] dropping malformed race: ${JSON.stringify(raw)}`);
  }
  return { enabled: true, races };
}

export interface EntityTarget {
  state?: string;
  lga?: string;
  constituency?: string;
}

/**
 * The cycle every `/elections/<year>/...` URL is keyed on, used until the gate
 * carries the presidential race.
 *
 * It stops being load-bearing the moment a published `president` election row
 * reaches the gate — no code change, just a different answer from the same call.
 */
export const FALLBACK_PRESIDENTIAL_YEAR = 2027;

/**
 * The presidential race's cycle year, straight off the gate. Null when the
 * gate is off or carries no presidential race — callers pair this with
 * `FALLBACK_PRESIDENTIAL_YEAR`.
 *
 * Deliberately ignores whether the race is still upcoming: the year is what
 * addresses the campaign pages, and those outlive the election itself.
 */
export function presidentialYear(gate: ElectionGate): number | null {
  if (!gate.enabled) return null;
  const race = gate.races.find((r) => r.office === "president");
  return race ? race.year : null;
}

/**
 * True if the election date is today or later. Precision-aware: bare-year
 * dates stay active through Dec 31, day-optional dates through their month.
 */
export function isRaceUpcoming(date: string, now: Date): boolean {
  const [y, m, d] = date.split("-").map(Number);
  if (!y) return false;
  const month = m || 12; // bare "YYYY" is active through Dec 31
  const lastDay = d || new Date(y, month, 0).getDate(); // day 0 of next month = last day of this month
  const cutoff = new Date(y, month - 1, lastDay, 23, 59, 59, 999).getTime();
  return now.getTime() <= cutoff;
}

/** A race's geo scope alone — what `raceCoversGeo` actually reads. */
export type RaceScope = Pick<Race, "states" | "constituencies" | "lgas" | "excludeStates">;

/** Does this race apply to a voter/target in the given geo? Empty scope = all voters, minus excludeStates. */
export function raceCoversGeo(race: RaceScope, geo: EntityTarget): boolean {
  if (geo.state && race.excludeStates.includes(geo.state)) return false;
  const allEmpty =
    race.states.length === 0 && race.constituencies.length === 0 && race.lgas.length === 0;
  if (allEmpty) return true;
  if (geo.state && race.states.includes(geo.state)) return true;                 // state cascades to children
  if (geo.constituency && race.constituencies.includes(geo.constituency)) return true;
  if (geo.state && geo.lga && race.lgas.includes(`${geo.state}/${geo.lga}`)) return true;
  return false;
}

/** All races on the ballot for this geo right now (upcoming + in scope). */
export function applicableRaces(gate: ElectionGate, geo: EntityTarget, now: Date = new Date()): Race[] {
  if (!gate.enabled) return [];
  return gate.races.filter((r) => isRaceUpcoming(r.date, now) && raceCoversGeo(r, geo));
}

/** Gating: a geo is lit iff it has >=1 applicable race. Preserves the (gate, target) call shape. */
export function isElectionEnabledFor(gate: ElectionGate, target: EntityTarget, now: Date = new Date()): boolean {
  return applicableRaces(gate, target, now).length > 0;
}

/** Which location key resolves a voter's seat for each office. */
const OFFICE_LEVEL: Record<Office, "national" | "state" | "lga" | "ward"> = {
  president: "national",
  governor: "state",
  senate: "lga",           // senatorial district derived from LGA
  hor: "lga",              // federal constituency derived from LGA
  lga_chairman: "lga",
  state_assembly: "ward",  // state constituency derived from ward
  councillor: "ward",
};

export interface VoterLocation {
  stateCode?: string;
  lgaCode?: string;
  wardCode?: string;
  constituencyCodes?: { senatorial?: string; federal?: string; state?: string };
}

export type RaceStatus = "resolved" | "no_data" | "needs_location";
export interface ResolvedRace { race: Race; status: RaceStatus; }

/**
 * Per-race resolvability from the voter's known location depth.
 * `resolved` = we have the location key to look up the seat (candidate-data presence, i.e. `no_data`,
 * is determined later by the backend ballot endpoint). `needs_location` = we lack the key (prompt for permission).
 */
export function resolveBallot(gate: ElectionGate, location: VoterLocation, now: Date = new Date()): ResolvedRace[] {
  const geos: EntityTarget[] = [{ state: location.stateCode, lga: location.lgaCode }];
  const cc = location.constituencyCodes;
  if (cc) {
    for (const code of [cc.senatorial, cc.federal, cc.state]) {
      if (code) geos.push({ state: location.stateCode, constituency: code });
    }
  }
  const seen = new Set<Race>();
  const races: Race[] = [];
  for (const g of geos) {
    for (const r of applicableRaces(gate, g, now)) {
      if (!seen.has(r)) {
        seen.add(r);
        races.push(r);
      }
    }
  }
  // NOTE: constituency-code-aware status (resolved when the specific district code is known) is refined in sub-project #2.
  return races.map((race) => {
    const level = OFFICE_LEVEL[race.office];
    const hasKey =
      level === "national" ||
      (level === "state" && !!location.stateCode) ||
      (level === "lga" && !!location.lgaCode) ||
      (level === "ward" && !!location.wardCode);
    return { race, status: hasKey ? "resolved" : "needs_location" };
  });
}

let cache: { at: number; gate: ElectionGate } | null = null;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * The gate, from our own API. Resilience is layered (E1.1): the API serves a
 * last-known-good snapshot with 200 on DB failure, the Next data cache
 * (`revalidate: 60`) is shared across instances and only ever holds good
 * responses, and the in-memory L1 here guards network failures — a non-2xx or
 * invalid body is never trusted as a gate: L1 stale if present, else `null`.
 *
 * `null` means UNKNOWN — the gate was unreachable and nothing stale exists.
 * That is a different fact from `{enabled: false}`, which is the kill switch
 * speaking deliberately. Callers that hide election UI either way coalesce
 * with `offGate()`; the homepage keeps its presidential fallback only for
 * the unknown case.
 */
export async function getElectionGate(fetchImpl: FetchLike = fetch): Promise<ElectionGate | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.gate;

  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${base}/api/election/gate`, {
      signal: ctl.signal,
      next: { revalidate: CACHE_TTL_MS / 1000 },
    } as RequestInit);
    if (!res.ok) return cache?.gate ?? null;
    const gate = parseGate(await res.json());
    if (!gate) return cache?.gate ?? null;
    cache = { at: Date.now(), gate };
    return gate;
  } catch {
    return cache?.gate ?? null;
  } finally {
    clearTimeout(timer);
  }
}

/** Test seam: reset the in-memory cache. */
export function __resetGateCache() { cache = null; }
