const FLAG_KEY = "election-gate";
const CACHE_TTL_MS = 60_000;
const NEGATIVE_CACHE_TTL_MS = 10_000;

export type Office =
  | "president" | "governor" | "senate" | "hor"
  | "state_assembly" | "lga_chairman" | "councillor";

const OFFICES: readonly Office[] = [
  "president", "governor", "senate", "hor", "state_assembly", "lga_chairman", "councillor",
];

export interface Race {
  office: Office;
  date: string;            // ISO YYYY-MM-DD (day optional: YYYY-MM)
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

function offGate(): ElectionGate {
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

function parseRace(raw: unknown): Race | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isOffice(r.office)) return null;
  if (typeof r.date !== "string" || !/^\d{4}-\d{2}(-\d{2})?$/.test(r.date)) return null;
  const race: Race = {
    office: r.office,
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

/** Parse a PostHog /flags response (v2 `flags` shape or legacy `featureFlags` shape). */
export function parseGate(body: any): ElectionGate {
  const v2 = body?.flags?.[FLAG_KEY];
  const enabled =
    typeof v2?.enabled === "boolean" ? v2.enabled : Boolean(body?.featureFlags?.[FLAG_KEY]);
  if (!enabled) return offGate();

  let rawPayload: unknown = v2?.metadata?.payload ?? body?.featureFlagPayloads?.[FLAG_KEY];
  if (typeof rawPayload === "string") {
    try { rawPayload = JSON.parse(rawPayload); } catch { rawPayload = null; }
  }
  const p = (rawPayload && typeof rawPayload === "object") ? (rawPayload as Record<string, unknown>) : {};
  const races = Array.isArray(p.races)
    ? p.races.map(parseRace).filter((r): r is Race => r !== null)
    : [];
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
 * The gate is off in every environment today, so `presidentialYear()` has
 * nothing to read and this is what ships. It stops being load-bearing the
 * moment a `president` race is added to the flag payload — no code change,
 * just a different answer from the same call.
 */
export const FALLBACK_PRESIDENTIAL_YEAR = 2027;

/**
 * The year the presidential race is held in, straight off the gate. Null when
 * the gate is off or carries no presidential race, which is every environment
 * right now — callers pair this with `FALLBACK_PRESIDENTIAL_YEAR`.
 *
 * Deliberately ignores whether the race is still upcoming: the year is what
 * addresses the campaign pages, and those outlive the election itself.
 */
export function presidentialYear(gate: ElectionGate): number | null {
  if (!gate.enabled) return null;
  const race = gate.races.find((r) => r.office === "president");
  if (!race) return null;
  const year = Number(race.date.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

/** True if the election date is today or later. Day-optional dates stay active through their month. */
export function isRaceUpcoming(date: string, now: Date): boolean {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m) return false;
  const lastDay = d || new Date(y, m, 0).getDate(); // day 0 of next month = last day of this month
  const cutoff = new Date(y, m - 1, lastDay, 23, 59, 59, 999).getTime();
  return now.getTime() <= cutoff;
}

/** Does this race apply to a voter/target in the given geo? Empty scope = all voters, minus excludeStates. */
function raceCoversGeo(race: Race, geo: EntityTarget): boolean {
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

let cache: { at: number; ttl: number; gate: ElectionGate } | null = null;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export async function getElectionGate(fetchImpl: FetchLike = fetch): Promise<ElectionGate> {
  if (cache && Date.now() - cache.at < cache.ttl) return cache.gate;

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  if (!token) return offGate();

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 800);
  try {
    const res = await fetchImpl(`${host.replace(/\/$/, "")}/flags/?v=2`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: token, distinct_id: "awanaija-server" }),
      signal: ctl.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      cache = { at: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS, gate: offGate() };
      return cache.gate;
    }
    const gate = parseGate(await res.json());
    cache = { at: Date.now(), ttl: CACHE_TTL_MS, gate };
    return gate;
  } catch {
    cache = { at: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS, gate: offGate() };
    return cache.gate;
  } finally {
    clearTimeout(timer);
  }
}

/** Test seam: reset the in-memory cache. */
export function __resetGateCache() { cache = null; }
