import { test } from "node:test";
import assert from "node:assert/strict";
import { pivotByParty, officeYearsForState } from "./election-ballot";

const cand = (name: string, party: string) => ({ officialId: name, name, slug: name.toLowerCase(), imageUrl: null, partyAcronym: party, partyName: `${party} full` });
const race = (office: string, cands: any[]) => ({ office, seatLabel: office, seatCode: office, resolved: true, hasData: cands.length > 0, candidates: cands });

test("pivotByParty groups candidates by party, ordered by slate size then major-party priority", () => {
  const races = [
    race("president", [cand("Atiku", "PDP"), cand("Tinubu", "APC"), cand("Obi", "LP")]),
    race("governor", [cand("Ada", "APC"), cand("Bola", "PDP")]),
  ] as any;
  const parties = pivotByParty(races);
  assert.deepEqual(parties.map((p) => p.acronym), ["APC", "PDP", "LP"]);
  const apc = parties.find((p) => p.acronym === "APC")!;
  assert.deepEqual(apc.slate.map((s) => `${s.office}:${s.candidate.name}`), ["president:Tinubu", "governor:Ada"]);
});

test("officeYearsForState maps applicable races to office:year pairs (per-office year)", () => {
  const gate = { enabled: true, races: [
    { office: "president", date: "2027-02-27", states: [], constituencies: [], lgas: [], excludeStates: [] },
    { office: "governor", date: "2026-08-08", states: ["osun"], constituencies: [], lgas: [], excludeStates: [] },
    { office: "governor", date: "2025-11-08", states: ["anambra"], constituencies: [], lgas: [], excludeStates: [] },
  ] } as any;
  const now = new Date("2026-01-01T00:00:00Z");
  const oy = officeYearsForState(gate, "osun", now).sort((a, b) => a.office.localeCompare(b.office));
  assert.deepEqual(oy, [{ office: "governor", year: 2026 }, { office: "president", year: 2027 }]);
});
