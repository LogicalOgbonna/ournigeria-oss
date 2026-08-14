import { applicableRaces, ElectionGate, Office } from "./election-gate";

export interface BallotCandidate {
  officialId: string; name: string; slug: string | null; imageUrl: string | null;
  partyAcronym: string | null; partyName: string | null;
}
export interface BallotRace {
  office: Office; seatLabel: string; seatCode: string | null;
  resolved: boolean; hasData: boolean; candidates: BallotCandidate[];
}
export interface PartySlateItem { office: Office; seatLabel: string; candidate: BallotCandidate; }
export interface PartySlate { acronym: string; name: string; slate: PartySlateItem[]; }

const OFFICE_ORDER: Office[] = ["president", "governor", "senate", "hor", "state_assembly", "lga_chairman", "councillor"];
const PARTY_PRIORITY = ["APC", "PDP", "LP", "NNPP", "ADC", "SDP", "APGA", "NDC", "Accord"];

export function pivotByParty(races: BallotRace[]): PartySlate[] {
  const byParty = new Map<string, PartySlate>();
  for (const race of races) {
    for (const c of race.candidates) {
      const acr = c.partyAcronym ?? "IND";
      if (!byParty.has(acr)) byParty.set(acr, { acronym: acr, name: c.partyName ?? acr, slate: [] });
      byParty.get(acr)!.slate.push({ office: race.office, seatLabel: race.seatLabel, candidate: c });
    }
  }
  for (const p of byParty.values()) {
    p.slate.sort((a, b) => OFFICE_ORDER.indexOf(a.office) - OFFICE_ORDER.indexOf(b.office));
  }
  const pri = (a: string) => { const i = PARTY_PRIORITY.indexOf(a); return i === -1 ? PARTY_PRIORITY.length : i; };
  return [...byParty.values()].sort((a, b) =>
    b.slate.length - a.slate.length || pri(a.acronym) - pri(b.acronym) || a.acronym.localeCompare(b.acronym),
  );
}

export function officeYearsForState(gate: ElectionGate, stateCode: string, now: Date): { office: Office; year: number }[] {
  const seen = new Set<Office>();
  const out: { office: Office; year: number }[] = [];
  for (const r of applicableRaces(gate, { state: stateCode }, now)) {
    if (seen.has(r.office)) continue;
    seen.add(r.office);
    out.push({ office: r.office, year: Number(r.date.slice(0, 4)) });
  }
  return out;
}
