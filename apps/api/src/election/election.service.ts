import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService } from "@ournigeria/database";
import { GeoSeatResolver, SeatScope } from "./geo-seat-resolver";
import { Office, OFFICE_ELECTION_TYPE, OFFICE_LABEL } from "./office-map";

export interface BallotCandidate {
  officialId: string; name: string; slug: string | null; imageUrl: string | null;
  partyAcronym: string | null; partyName: string | null;
}
export interface BallotRace {
  office: Office; seatLabel: string; seatCode: string | null;
  resolved: boolean; hasData: boolean; candidates: BallotCandidate[];
}

const CONF_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

@Injectable()
export class ElectionService {
  constructor(private prisma: PrismaService, private resolver: GeoSeatResolver) {}

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
