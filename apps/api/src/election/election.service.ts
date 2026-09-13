import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { Prisma, PrismaService } from "@ournigeria/database";
import { getSettingBool } from "../config/settings-store";
import { GeoSeatResolver, SeatScope } from "./geo-seat-resolver";
import { ELECTION_TYPE_OFFICE, Office, OFFICE_ELECTION_TYPE, OFFICE_LABEL, OFFICE_ORDER } from "./office-map";

export interface BallotCandidate {
  officialId: string; name: string; slug: string | null; imageUrl: string | null;
  partyAcronym: string | null; partyName: string | null;
}
export interface BallotRace {
  office: Office; seatLabel: string; seatCode: string | null;
  resolved: boolean; hasData: boolean; candidates: BallotCandidate[];
}

export interface GateRace {
  office: Office;
  year: number;            // CYCLE year (E1.2) — may differ from date's calendar year after a postponement
  date: string;            // "YYYY" | "YYYY-MM" | "YYYY-MM-DD" per datePrecision (D4/D10.3)
  label: string | null;
  states: string[];
  constituencies: string[];
  lgas: string[];          // composite "<state>/<bare-lga>"
  excludeStates: string[];
}
export interface ElectionGateResponse { enabled: boolean; races: GateRace[]; }

const GATE_ENABLED_KEY = "elections.gate_enabled";

interface GateRow {
  slug: string; office: string; year: number;
  electionDate: Date | null; datePrecision: string; label: string | null;
  stateCode: string | null; constituencyCode: string | null; lgaCode: string | null; wardCode: string | null;
  excludedStates: { stateCode: string }[];
  lga: { stateCode: string } | null;
}

function startOfTodayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Precision-aware period end: day = that day, month = last day of month, year (or NULL date) = Dec 31 of the cycle year. */
function periodEnd(r: GateRow): number {
  const d = r.electionDate;
  if (!d || r.datePrecision === "year") return Date.UTC(r.year, 11, 31);
  if (r.datePrecision === "month") return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
  return d.getTime();
}

/** Sibling-round ordering (E1.5): a NULL date sorts as Dec 31 of the cycle year. */
function sortDate(r: GateRow): number {
  return r.electionDate ? r.electionDate.getTime() : Date.UTC(r.year, 11, 31);
}

/** D10.7/E1.5: rounds sharing (office, scope) collapse to the earliest upcoming — the next poll. */
function nextPollPerScope(rows: GateRow[]): GateRow[] {
  const best = new Map<string, GateRow>();
  for (const r of rows) {
    const key = [r.office, r.stateCode, r.constituencyCode, r.lgaCode, r.wardCode].join("|");
    const cur = best.get(key);
    if (!cur || sortDate(r) < sortDate(cur) || (sortDate(r) === sortDate(cur) && r.slug < cur.slug)) best.set(key, r);
  }
  return [...best.values()];
}

/** Races follow the constitutional ballot order (president → governor →
 *  senate → hor → state assembly → LGA → councillor); the poll date only
 *  breaks ties within the same office. */
function raceRank(r: GateRow): number {
  const idx = OFFICE_ORDER.indexOf(ELECTION_TYPE_OFFICE[r.office]);
  return idx === -1 ? OFFICE_ORDER.length : idx;
}

function gateDate(r: GateRow): string {
  const d = r.electionDate;
  if (!d || r.datePrecision === "year") return String(r.year);
  if (r.datePrecision === "month") return d.toISOString().slice(0, 7);
  return d.toISOString().slice(0, 10);
}

/** lga_code is "<state>_<bare-lga>" (state codes may themselves contain "_", so strip by the row's state). */
function lgaComposite(r: GateRow): string {
  const lgaCode = r.lgaCode!;
  const state = r.stateCode ?? r.lga?.stateCode;
  if (!state) return lgaCode;
  const bare = lgaCode.startsWith(`${state}_`) ? lgaCode.slice(state.length + 1) : lgaCode;
  return `${state}/${bare}`;
}

const CONF_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

@Injectable()
export class ElectionService {
  private readonly logger = new Logger(ElectionService.name);
  /** E1.1: last-known-good gate served with 200 on DB failure, so downstream caches never store errors. */
  private gateSnapshot: ElectionGateResponse | null = null;

  constructor(private prisma: PrismaService, private resolver: GeoSeatResolver) {}

  async gate(): Promise<ElectionGateResponse> {
    if (!getSettingBool(GATE_ENABLED_KEY, undefined, true)) {
      this.logger.log(JSON.stringify({ event: "election_gate_serve", enabled: false, races: 0 }));
      return { enabled: false, races: [] };
    }

    let rows: GateRow[];
    try {
      rows = await this.prisma.election.findMany({
        where: { published: true, status: { in: ["scheduled", "postponed"] } },
        include: { excludedStates: true, lga: { select: { stateCode: true } } },
      });
    } catch (err) {
      if (this.gateSnapshot) {
        this.logger.warn(JSON.stringify({
          event: "election_gate_stale_serve", enabled: this.gateSnapshot.enabled,
          races: this.gateSnapshot.races.length, error: err instanceof Error ? err.message : String(err),
        }));
        return this.gateSnapshot;
      }
      throw new ServiceUnavailableException("election gate unavailable");
    }

    const today = startOfTodayUtc();
    const races = nextPollPerScope(rows.filter((r) => periodEnd(r) >= today))
      .sort((a, b) => raceRank(a) - raceRank(b) || sortDate(a) - sortDate(b))
      .map((r) => this.serializeRace(r))
      .filter((r): r is GateRace => r !== null);

    const response: ElectionGateResponse = { enabled: true, races };
    this.gateSnapshot = response;
    this.logger.log(JSON.stringify({ event: "election_gate_serve", enabled: true, races: races.length }));
    return response;
  }

  private serializeRace(r: GateRow): GateRace | null {
    const office = ELECTION_TYPE_OFFICE[r.office];
    if (!office) {
      this.logger.warn(JSON.stringify({ event: "election_gate_race_dropped", slug: r.slug, office: r.office }));
      return null;
    }
    return {
      office, year: r.year, date: gateDate(r), label: r.label,
      states: r.stateCode ? [r.stateCode] : [],
      constituencies: r.constituencyCode ? [r.constituencyCode] : [],
      lgas: r.lgaCode ? [lgaComposite(r)] : [],
      excludeStates: r.excludedStates.map((e) => e.stateCode),
    };
  }

  async getBallot(params: {
    state: string; lga?: string; ward?: string; offices: { office: Office; year: number }[];
  }): Promise<{ races: BallotRace[] }> {
    const stateName = params.offices.some((o) => o.office === "governor")
      ? (await this.prisma.nigerianState.findUnique({ where: { code: params.state } }))?.name ?? params.state
      : params.state;

    const races = await Promise.all(
      params.offices.map(async ({ office, year }) => {
        try {
          return await this.raceFor(office, year, params, stateName);
        } catch {
          // #G: one bad seat query must not blank the whole ballot
          return { office, seatLabel: OFFICE_LABEL[office], seatCode: null, resolved: false, hasData: false, candidates: [] };
        }
      }),
    );
    return { races };
  }

  private async raceFor(
    office: Office, year: number,
    loc: { state: string; lga?: string; ward?: string }, stateName: string,
  ): Promise<BallotRace> {
    const scope = await this.resolver.resolveOne(office, loc.state, stateName, loc.lga, loc.ward);
    if (!scope) {
      return { office, seatLabel: OFFICE_LABEL[office], seatCode: null, resolved: false, hasData: false, candidates: [] };
    }
    const candidates = await this.candidatesFor(office, year, scope);
    return { office, seatLabel: scope.label, seatCode: scope.code, resolved: true, hasData: candidates.length > 0, candidates };
  }

  private async candidatesFor(office: Office, year: number, scope: SeatScope): Promise<BallotCandidate[]> {
    const where = {
      electionType: OFFICE_ELECTION_TYPE[office],
      year, isPrimary: true, result: "won", confidence: { not: "low" },
      ...(scope.column && scope.code ? { [scope.column]: scope.code } : {}),
    } as Prisma.OfficialElectionWhereInput;

    const rows = await this.prisma.officialElection.findMany({ where, include: { official: true, party: true } });

    const best = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      const key = r.partyAcronym ?? `__${r.officialId}`;
      const cur = best.get(key);
      if (!cur || (CONF_RANK[r.confidence] ?? 0) > (CONF_RANK[cur.confidence] ?? 0)) best.set(key, r);
    }
    return [...best.values()]
      .sort((a, b) => (a.official?.name ?? "").localeCompare(b.official?.name ?? ""))
      .map((r) => ({
        officialId: r.officialId, name: r.official?.name ?? "", slug: r.official?.slug ?? null,
        imageUrl: r.official?.imageUrl ?? null, partyAcronym: r.partyAcronym ?? null, partyName: r.party?.name ?? null,
      }));
  }
}
