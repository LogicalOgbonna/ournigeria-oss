import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseGate, applicableRaces, isElectionEnabledFor, resolveBallot,
  getElectionGate, __resetGateCache, isRaceUpcoming,
} from "./election-gate";

function flagsBody(payload: unknown) {
  return { flags: { "election-gate": { enabled: true, metadata: { payload } } } };
}

test("parseGate: disabled/absent => enabled false, empty races", () => {
  assert.deepEqual(parseGate({ flags: { "election-gate": { enabled: false } } }), { enabled: false, races: [] });
  assert.deepEqual(parseGate({}), { enabled: false, races: [] });
});

test("parseGate: parses races (object and JSON-string payload), fills scope defaults", () => {
  const payload = { races: [{ office: "governor", date: "2026-08-08", label: "Osun", states: ["osun"] }] };
  const want = { enabled: true, races: [{ office: "governor", date: "2026-08-08", label: "Osun", states: ["osun"], constituencies: [], lgas: [], excludeStates: [] }] };
  assert.deepEqual(parseGate(flagsBody(payload)), want);
  assert.deepEqual(parseGate(flagsBody(JSON.stringify(payload))), want);
});

test("parseGate: drops malformed races (bad office, bad/absent date) but keeps valid ones", () => {
  const g = parseGate(flagsBody({ races: [
    { office: "governor", date: "2027-02-27" },
    { office: "not_an_office", date: "2027-02-27" },
    { office: "president", date: "nonsense" },
    { office: "councillor", date: "2027-02" },
  ] }));
  assert.equal(g.races.length, 2);
  assert.deepEqual(g.races.map((r) => r.office), ["governor", "councillor"]);
});

const NOW = new Date("2026-08-01T00:00:00Z");
function gate(races: any[]) { return { enabled: true, races: races.map((r) => ({ constituencies: [], lgas: [], excludeStates: [], states: [], ...r })) }; }

test("parseRace: national office (president) has its scope lists neutralized", () => {
  const g = parseGate({ flags: { "election-gate": { enabled: true, metadata: { payload: { races: [
    { office: "president", date: "2027-02-27", states: ["osun"], excludeStates: ["lagos"], constituencies: ["x"], lgas: ["a/b"] },
  ] } } } } });
  assert.deepEqual(g.races[0], { office: "president", date: "2027-02-27", label: undefined, states: [], constituencies: [], lgas: [], excludeStates: [] });
});

test("isRaceUpcoming: future/this-month true, past false, YYYY-MM active through month", () => {
  assert.equal(isRaceUpcoming("2027-02-27", NOW), true);
  assert.equal(isRaceUpcoming("2025-11-08", NOW), false);
  assert.equal(isRaceUpcoming("2026-08", NOW), true);
  assert.equal(isRaceUpcoming("2026-07", NOW), false);
  assert.equal(isRaceUpcoming("nonsense", NOW), false);
});

test("applicableRaces: empty scope = all voters; excludeStates removes; past dropped", () => {
  const g = gate([
    { office: "president", date: "2027-02-27" },
    { office: "governor", date: "2027-02-27", excludeStates: ["osun"] },
    { office: "governor", date: "2026-08-08", states: ["osun"] },
    { office: "governor", date: "2025-11-08", states: ["anambra"] },
  ]);
  const osun = applicableRaces(g, { state: "osun" }, NOW).map((r) => `${r.office}@${r.date}`);
  assert.deepEqual(osun.sort(), ["governor@2026-08-08", "president@2027-02-27"]);
  const lagos = applicableRaces(g, { state: "lagos" }, NOW).map((r) => r.office).sort();
  assert.deepEqual(lagos, ["governor", "president"]);
});

test("applicableRaces: populated scope restricts; state cascades; composite lga; constituency leaf", () => {
  const g = gate([
    { office: "state_assembly", date: "2027-03-01", constituencies: ["os-ha-01"] },
    { office: "lga_chairman", date: "2027-03-01", lgas: ["kwara/ifelodun"] },
    { office: "governor", date: "2027-03-01", states: ["osun"] },
  ]);
  assert.equal(applicableRaces(g, { state: "osun" }, NOW).some((r) => r.office === "governor"), true);
  assert.equal(applicableRaces(g, { state: "osun", lga: "ife_central" }, NOW).some((r) => r.office === "governor"), true);
  assert.equal(applicableRaces(g, { state: "kwara", lga: "ifelodun" }, NOW).some((r) => r.office === "lga_chairman"), true);
  assert.equal(applicableRaces(g, { state: "osun", lga: "ifelodun" }, NOW).some((r) => r.office === "lga_chairman"), false);
  assert.equal(applicableRaces(g, { state: "osun", constituency: "os-ha-01" }, NOW).some((r) => r.office === "state_assembly"), true);
});

test("isElectionEnabledFor: lit iff >=1 applicable race; master off => false", () => {
  const g = gate([{ office: "governor", date: "2027-02-27", states: ["osun"] }]);
  assert.equal(isElectionEnabledFor(g, { state: "osun" }, NOW), true);
  assert.equal(isElectionEnabledFor(g, { state: "lagos" }, NOW), false);
  assert.equal(isElectionEnabledFor({ enabled: false, races: g.races }, { state: "osun" }, NOW), false);
  const past = gate([{ office: "governor", date: "2025-01-01", states: ["osun"] }]);
  assert.equal(isElectionEnabledFor(past, { state: "osun" }, NOW), false);
});

test("resolveBallot: status by location depth (needs_location vs resolved)", () => {
  const g = gate([
    { office: "president", date: "2027-02-27" },
    { office: "governor", date: "2027-02-27" },
    { office: "lga_chairman", date: "2027-02-27" },
    { office: "councillor", date: "2027-02-27" },
  ]);
  const stateOnly = resolveBallot(g, { stateCode: "osun" }, NOW);
  const byOffice = Object.fromEntries(stateOnly.map((r) => [r.race.office, r.status]));
  assert.equal(byOffice.president, "resolved");
  assert.equal(byOffice.governor, "resolved");
  assert.equal(byOffice.lga_chairman, "needs_location");
  assert.equal(byOffice.councillor, "needs_location");

  const full = resolveBallot(g, { stateCode: "osun", lgaCode: "ife_central", wardCode: "w1" }, NOW);
  assert.equal(full.every((r) => r.status === "resolved"), true);
});

test("resolveBallot: surfaces a constituency-scoped race when the voter's constituency code matches", () => {
  const g = gate([{ office: "state_assembly", date: "2027-03-01", constituencies: ["os-ha-01"] }]);
  const withCode = resolveBallot(g, { stateCode: "osun", constituencyCodes: { state: "os-ha-01" } }, NOW);
  assert.equal(withCode.some((r) => r.race.office === "state_assembly"), true);
  const without = resolveBallot(g, { stateCode: "osun" }, NOW);
  assert.equal(without.some((r) => r.race.office === "state_assembly"), false);
});

const OFF2 = { enabled: false, races: [] };
function saveToken(t: any) { const prev = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN; t.after(() => { process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = prev; }); }
function resp(body: unknown, ok = true) { return { ok, status: ok ? 200 : 500, json: async () => body } as unknown as Response; }

test("getElectionGate: missing token => OFF, no fetch", async (t) => {
  saveToken(t); delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN; __resetGateCache();
  let calls = 0; const fake = async () => { calls++; return resp({}); };
  assert.deepEqual(await getElectionGate(fake), OFF2);
  assert.equal(calls, 0);
});

test("getElectionGate: success => parsed races + 60s cache", async (t) => {
  saveToken(t); process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_x"; __resetGateCache();
  let calls = 0;
  const body = { flags: { "election-gate": { enabled: true, metadata: { payload: { races: [{ office: "governor", date: "2027-02-27", states: ["osun"] }] } } } } };
  const fake = async () => { calls++; return resp(body); };
  const g = await getElectionGate(fake);
  assert.equal(g.enabled, true); assert.equal(g.races[0].office, "governor");
  await getElectionGate(fake);
  assert.equal(calls, 1);
});

test("getElectionGate: non-ok => OFF and negatively cached", async (t) => {
  saveToken(t); process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_x"; __resetGateCache();
  let calls = 0; const fail = async () => { calls++; return resp("", false); };
  assert.deepEqual(await getElectionGate(fail), OFF2);
  await getElectionGate(fail);
  assert.equal(calls, 1);
});

test("getElectionGate: negative cache expires after 10s and recovers", async (t) => {
  saveToken(t); process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_x"; __resetGateCache();
  t.mock.timers.enable({ apis: ["Date"] });
  let calls = 0; const fail = async () => { calls++; return resp("", false); };
  assert.deepEqual(await getElectionGate(fail), OFF2);
  await getElectionGate(fail);
  assert.equal(calls, 1);
  t.mock.timers.tick(10_001);
  const ok = async () => { calls++; return resp({ flags: { "election-gate": { enabled: true, metadata: { payload: { races: [] } } } } }); };
  const g = await getElectionGate(ok);
  assert.equal(g.enabled, true); assert.equal(calls, 2);
});
