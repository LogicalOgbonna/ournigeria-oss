import type { SlatePerson } from "@/components/civic/SlateCard";
import type {
  TicketArtwork,
  TicketParty,
  TicketPerson,
} from "@/components/civic/CandidateTicket";
import type { SlateRow } from "@/app/_component/PartySlatePanel";
import { OFFICE_ORDER } from "@/lib/election-ballot";
import {
  FALLBACK_PRESIDENTIAL_YEAR,
  isRaceUpcoming,
  presidentialYear,
  raceCoversGeo,
  type ElectionGate,
  type Office,
  type Race,
  type RaceScope,
} from "@/lib/election-gate";

/**
 * The homepage hero's ballot, built from the `GET /api/election/gate` payload.
 *
 * The gate's races decide what the contest dropdown offers — the homepage is
 * national, so it advertises every live race in the country, including
 * state-scoped ones (an off-cycle governorship is national news even if only
 * one state votes in it). Candidates are real: the presidential field from
 * `GET /api/campaigns`, down-ballot fields from `GET /api/election/ballot`.
 * The hero components stay pure and prop-driven.
 */

/** One candidate (plus running mate) on the rail. */
export interface RailCandidate {
  readonly id: string;
  readonly candidate: TicketPerson;
  readonly mate?: TicketPerson | null;
  readonly party: TicketParty;
  /** Poster headline override, when the surname alone reads wrong. */
  readonly shortName?: string;
  /** This ticket's authored Figma geometry, if it has one. */
  readonly art?: TicketArtwork;
}

/** One contest — a rail's worth of candidates, and its dropdown entry. */
export interface HomeRace {
  /** Stable identity for dropdown selection/keys. Office alone is NOT unique:
   *  two governorships in different states are different contests. */
  readonly id: string;
  readonly office: string;
  readonly label: string;
  readonly candidates: readonly RailCandidate[];
  /**
   * The gate race's geo scope, when it has one. The homepage HTML is one
   * ISR snapshot for every visitor, so geo-scoped races ship in the payload
   * and the client hides them from viewers they don't cover (see
   * `racesForViewer`). Absent = nationwide.
   */
  readonly scope?: RaceScope;
}

/** A single party's full slate for the viewer's location. */
export interface HomePartySlate {
  readonly party: TicketParty;
  readonly featured: RailCandidate;
  /** Pre-grouped by tier — the panel draws a rule between rows. */
  readonly rows: readonly SlateRow[];
}

/** Dropdown label, poster title, slate tier, and campaigns `election_type` per office. */
const OFFICE_META: Record<Office, { label: string; title: string; tier: string; type: string }> = {
  president: { label: "Presidential", title: "President", tier: "Federal", type: "presidential" },
  governor: { label: "Gubernatorial", title: "Governor", tier: "State", type: "gubernatorial" },
  senate: { label: "Senatorial", title: "Senator", tier: "Federal", type: "senatorial" },
  hor: { label: "House of Representatives", title: "House of Representatives", tier: "Federal", type: "house_of_reps" },
  state_assembly: { label: "State Assembly", title: "Member, House of Assembly", tier: "State", type: "state_assembly" },
  lga_chairman: { label: "LGA Chairmanship", title: "LGA Chairman", tier: "Local", type: "lga_chairman" },
  councillor: { label: "Councillorship", title: "Councillor", tier: "Local", type: "councilor" },
};

/**
 * The dropdown entry for a race. A geo-scoped race uses its payload label
 * ("Osun Governorship" says which state; "Gubernatorial" wouldn't), while a
 * nationwide race keeps the office name — its payload label describes the
 * whole election day ("2027 General Election"), not this contest.
 */
function raceLabel(race: Race): string {
  const scoped =
    race.states.length > 0 || race.constituencies.length > 0 || race.lgas.length > 0;
  return (scoped && race.label) || OFFICE_META[race.office].label;
}

/** The two fetches `buildHomeRaces` needs, injected so tests run without a network. */
export interface HomeBallotSources {
  presidential: (year: number) => Promise<readonly RailCandidate[]>;
  /**
   * Public campaign tickets for one race scope, already mapped to rail
   * posters (`toRailCandidate` — running mate, poster art, brand color).
   * Campaigns are the ticket source of truth: this is where dashboard
   * uploads (poster_candidate / poster_mate) actually live, which the old
   * ballot-endpoint source could never show.
   */
  tickets: (params: {
    type: string;
    year: number;
    state?: string;
    constituency?: string;
    lga?: string;
  }) => Promise<readonly RailCandidate[]>;
}

/**
 * The races on offer, straight off the gate.
 *
 * One `HomeRace` PER GATE RACE, in payload order — never merged by office:
 * the Osun and Enugu governorships are different contests with different
 * scopes, and a viewer must only ever see the one that covers them (the
 * server already dedupes sibling rounds of the SAME office+scope, D10.7).
 * A race the API has no candidates for still gets its dropdown entry: an
 * empty rail is the truth ("no confirmed candidates yet"), a missing entry
 * looks like a bug.
 *
 * Gate semantics (decision C, 2026-09-13):
 * - `{enabled: false}` is the KILL SWITCH speaking deliberately — zero races,
 *   NO presidential fallback; the page renders no hero at all.
 * - `null` (gate unreachable, nothing stale) falls back to the presidential
 *   race — an API blip must never blank the homepage.
 * - `{enabled: true}` with no upcoming/published races also falls back: that
 *   is the pre-launch state (rows seeded, nothing published yet), and the
 *   presidential field is live product either way.
 */
export async function buildHomeRaces(
  gate: ElectionGate | null,
  sources: HomeBallotSources,
  now: Date = new Date(),
): Promise<{ races: HomeRace[]; year: number; years: number[] }> {
  if (gate && !gate.enabled) {
    return { races: [], year: FALLBACK_PRESIDENTIAL_YEAR, years: [] };
  }
  // Ballot order: office rank first (the gate already emits this order; the
  // stable re-sort keeps the dropdown right even across API deploy skew).
  // Within an office, the gate's order — earlier poll first — is preserved.
  const officeRank = (o: Office) => {
    const i = OFFICE_ORDER.indexOf(o);
    return i === -1 ? OFFICE_ORDER.length : i;
  };
  const upcoming = gate
    ? gate.races
        .filter((r) => isRaceUpcoming(r.date, now))
        .sort((a, b) => officeRank(a.office) - officeRank(b.office))
    : [];
  const year = (gate ? presidentialYear(gate) : null) ?? FALLBACK_PRESIDENTIAL_YEAR;
  // Same contract as the tickets source: an unreachable campaigns API is an
  // empty rail, never a crashed homepage. This is also what static builds hit
  // (CI/prerender run with no API) — the page must still export.
  const presidential = await sources.presidential(year).catch(() => [] as readonly RailCandidate[]);

  const races: HomeRace[] = [];
  for (const race of upcoming) {
    const scoped =
      race.states.length > 0 ||
      race.constituencies.length > 0 ||
      race.lgas.length > 0 ||
      race.excludeStates.length > 0;
    const scope: RaceScope | undefined = scoped
      ? {
          states: race.states,
          constituencies: race.constituencies,
          lgas: race.lgas,
          excludeStates: race.excludeStates,
        }
      : undefined;
    // Content-derived so the same payload yields the same id across renders.
    const id = [
      race.office,
      race.year,
      ...race.states,
      ...race.constituencies,
      ...race.lgas,
    ].join(":") || race.office;

    const candidates: RailCandidate[] = [];
    if (race.office === "president") {
      candidates.push(...presidential);
    } else {
      // One tickets query per scope entry; an unscoped down-ballot race
      // queries the whole race type for the cycle. Gate lga composites are
      // "state/lga"; campaigns store the DB code "state_lga".
      const queries: { state?: string; constituency?: string; lga?: string }[] = [
        ...race.states.map((state) => ({ state })),
        ...race.constituencies.map((constituency) => ({ constituency })),
        ...race.lgas.map((l) => ({ lga: l.replace("/", "_") })),
      ];
      if (queries.length === 0) queries.push({});
      for (const q of queries) {
        try {
          candidates.push(
            // Cycle year, not the date's calendar year — campaigns key on it.
            ...(await sources.tickets({ type: OFFICE_META[race.office].type, year: race.year, ...q })),
          );
        } catch {
          // An unreachable campaigns endpoint yields an empty rail, same as
          // the presidential field's contract — never a crashed homepage.
        }
      }
    }
    races.push({ id, office: race.office, label: raceLabel(race), candidates, scope });
  }

  if (!races.some((r) => r.office === "president")) {
    races.unshift({
      id: `president:${year}`,
      office: "president",
      label: OFFICE_META.president.label,
      candidates: presidential,
    });
  }

  const years = [...new Set(upcoming.map((r) => r.year))].sort(
    (a, b) => b - a,
  );
  return { races, year, years: years.length > 0 ? years : [year] };
}

/** The viewer's persisted location, as `usePersistedLocation` shapes it. */
export interface ViewerGeo {
  readonly stateCode?: string | null;
  readonly lgaCode?: string | null;
}

/**
 * The races this viewer's ballot actually carries: nationwide races always,
 * geo-scoped ones only when they cover the viewer's persisted location. No
 * location yet (or SSR) means nationwide races only — a scoped race appears
 * the moment the viewer picks a state it covers.
 *
 * DB LGA codes are state-prefixed (`kwara_ifelodun`) while gate payloads use
 * the composite `kwara/ifelodun`; the prefix is stripped here so the two meet.
 */
export function racesForViewer(
  races: readonly HomeRace[],
  viewer: ViewerGeo,
): HomeRace[] {
  const state = viewer.stateCode || undefined;
  let lga = viewer.lgaCode || undefined;
  if (state && lga && lga.startsWith(`${state}_`)) lga = lga.slice(state.length + 1);
  return races.filter((r) => !r.scope || raceCoversGeo(r.scope, { state, lga }));
}

/**
 * True when at least one race actually has candidates to show. A hero with
 * entries but zero cards everywhere (campaigns API empty/unreachable, or a
 * viewer geo-filtered down to candidate-less races) reads as broken — the
 * page shows the AskHero pitch instead.
 */
export function hasBallotContent(races: readonly HomeRace[]): boolean {
  return races.some((r) => r.candidates.length > 0);
}

const TIER_ORDER = ["Federal", "State", "Local"];

/**
 * One slate per party, pivoted from the same races the rail shows — feeds the
 * parties view and its party pill. `featured` is the party's presidential
 * ticket when it has one, else its first candidate anywhere on the ballot;
 * the rows are its down-ballot candidates grouped by tier.
 */
export function buildPartySlates(races: readonly HomeRace[]): HomePartySlate[] {
  interface Acc {
    party: TicketParty;
    featured: RailCandidate | null;
    byTier: Map<string, SlatePerson[]>;
    size: number;
  }
  const byParty = new Map<string, Acc>();

  for (const race of races) {
    const meta = OFFICE_META[race.office as Office];
    for (const c of race.candidates) {
      const acr = c.party.acronym || "IND";
      let acc = byParty.get(acr);
      if (!acc) {
        acc = { party: c.party, featured: null, byTier: new Map(), size: 0 };
        byParty.set(acr, acc);
      }
      acc.size++;
      if (race.office === "president") {
        acc.featured = acc.featured ?? c;
        continue; // the featured card carries the presidential ticket
      }
      const tier = meta?.tier ?? "Federal";
      if (!acc.byTier.has(tier)) acc.byTier.set(tier, []);
      acc.byTier.get(tier)!.push({
        id: c.id,
        name: c.candidate.name,
        office: race.label,
        tier,
        imageUrl: c.candidate.imageUrl ?? null,
      });
      acc.featured = acc.featured ?? c;
    }
  }

  return [...byParty.values()]
    .filter((acc): acc is Acc & { featured: RailCandidate } => acc.featured !== null)
    .sort((a, b) => b.size - a.size || a.party.acronym.localeCompare(b.party.acronym))
    .map((acc) => ({
      party: acc.party,
      featured: acc.featured,
      rows: TIER_ORDER.filter((t) => acc.byTier.has(t)).map((tier) => {
        const people = acc.byTier.get(tier)!;
        return { id: tier.toLowerCase(), columns: Math.min(3, people.length), people };
      }),
    }));
}
