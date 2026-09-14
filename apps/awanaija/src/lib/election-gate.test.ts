import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseGate, parseRace, applicableRaces, isElectionEnabledFor, resolveBallot,
  getElectionGate, __resetGateCache, isRaceUpcoming, presidentialYear,
} from "./election-gate";
import { appEnv } from "./app-env";

// A well-formed `GET /api/election/gate` body.
function gateBody(races: unknown[], enabled = true) {
  return { enabled, races };
}

test("parseGate: a body that isn't a gate is rejected (null), never coerced", () => {
  assert.equal(parseGate(null), null);
  assert.equal(parseGate("nonsense"), null);
  assert.equal(parseGate({}), null);
  assert.equal(parseGate({ enabled: true }), null);
  assert.equal(parseGate({ enabled: "yes", races: [] }), null);
  assert.equal(parseGate({ enabled: true, races: {} }), null);
});

test("parseGate: kill switch off => enabled false, empty races", () => {
  assert.deepEqual(parseGate(gateBody([{ office: "president", year: 2027, date: "2027-01-16" }], false)), {
    enabled: false,
    races: [],
  });
});

test("parseGate: parses races, fills scope defaults, null label => undefined", () => {
  const g = parseGate(gateBody([
    { office: "governor", year: 2026, date: "2026-12-08", label: "Osun Governorship", states: ["osun"], constituencies: [], lgas: [], excludeStates: [] },
    { office: "president", year: 2027, date: "2027-01-16", label: null, states: [], constituencies: [], lgas: [], excludeStates: [] },
  ]));
  assert.deepEqual(g, {
    enabled: true,
    races: [
      { office: "governor", year: 2026, date: "2026-12-08", label: "Osun Governorship", states: ["osun"], constituencies: [], lgas: [], excludeStates: [] },
      { office: "president", year: 2027, date: "2027-01-16", label: undefined, states: [], constituencies: [], lgas: [], excludeStates: [] },
    ],
  });
});

test("parseGate: drops malformed races (bad office/date, missing or non-integer year) and warns per drop", (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const g = parseGate(gateBody([
    { office: "governor", year: 2027, date: "2027-01-16" },
    { office: "not_an_office", year: 2027, date: "2027-01-16" },
    { office: "president", year: 2027, date: "nonsense" },
    { office: "senate", date: "2027-01-16" },              // year missing
    { office: "senate", year: "2027", date: "2027-01-16" }, // year not a number
    { office: "senate", year: 2027.5, date: "2027-01-16" }, // year not an integer
    { office: "councillor", year: 2027, date: "2027-01" },
    { office: "hor", year: 2027, date: "2027" },            // bare year is legal
  ]));
  assert.ok(g);
  assert.deepEqual(g.races.map((r) => r.office), ["governor", "councillor", "hor"]);
  assert.equal(warn.mock.callCount(), 5);
  // The log names the dropped race.
  assert.match(String(warn.mock.calls[0].arguments[0]), /not_an_office/);
});

test("parseRace: national office (president) has its scope lists neutralized", () => {
  const race = parseRace({
    office: "president", year: 2027, date: "2027-01-16",
    states: ["osun"], excludeStates: ["lagos"], constituencies: ["x"], lgas: ["a/b"],
  });
  assert.deepEqual(race, {
    office: "president", year: 2027, date: "2027-01-16", label: undefined,
    states: [], constituencies: [], lgas: [], excludeStates: [],
  });
});

const NOW = new Date("2026-08-01T00:00:00Z");
function gate(races: any[]) {
  return {
    enabled: true,
    races: races.map((r) => ({ year: 2027, constituencies: [], lgas: [], excludeStates: [], states: [], ...r })),
  };
}

test("isRaceUpcoming: future/this-month true, past false, YYYY-MM through month, YYYY through Dec 31", () => {
  assert.equal(isRaceUpcoming("2027-02-27", NOW), true);
  assert.equal(isRaceUpcoming("2025-11-08", NOW), false);
  assert.equal(isRaceUpcoming("2026-08", NOW), true);
  assert.equal(isRaceUpcoming("2026-07", NOW), false);
  assert.equal(isRaceUpcoming("2026", NOW), true);   // bare year: active through Dec 31
  assert.equal(isRaceUpcoming("2026", new Date("2026-12-31T12:00:00")), true);
  assert.equal(isRaceUpcoming("2025", NOW), false);
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

test("presidentialYear: reads the cycle year off the presidential race", () => {
  const g = parseGate(gateBody([
    { office: "governor", year: 2028, date: "2028-03-11" },
    { office: "president", year: 2031, date: "2031-02-14" },
  ]))!;
  assert.equal(presidentialYear(g), 2031);
});

test("presidentialYear: postponed election keeps its cycle year (year 2026, date in 2027)", () => {
  const g = parseGate(gateBody([{ office: "president", year: 2026, date: "2027-01-05" }]))!;
  assert.equal(presidentialYear(g), 2026);
});

test("presidentialYear: null when the gate is off, or carries no presidential race", () => {
  assert.equal(presidentialYear({ enabled: false, races: [] }), null);
  assert.equal(presidentialYear(parseGate(gateBody([]))!), null);
  const noPrez = parseGate(gateBody([{ office: "senate", year: 2031, date: "2031-02-14" }]))!;
  assert.equal(presidentialYear(noPrez), null);
});

test("presidentialYear: a past presidential race still names the cycle", () => {
  // The year addresses the campaign pages, which outlive the election.
  const g = parseGate(gateBody([{ office: "president", year: 1999, date: "1999-02-27" }]))!;
  assert.equal(presidentialYear(g), 1999);
});

// --- getElectionGate: fetch policy + two-layer fail-stale (D11/E1.1) ---

const OFF2 = { enabled: false, races: [] };
const GOOD_BODY = gateBody([{ office: "governor", year: 2026, date: "2026-12-08", states: ["osun"] }]);

function saveEnvVars(t: any, ...names: string[]) {
  const prev = names.map((n) => [n, process.env[n]] as const);
  t.after(() => {
    for (const [n, v] of prev) {
      if (v === undefined) delete process.env[n];
      else process.env[n] = v;
    }
  });
}

function resp(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body } as unknown as Response;
}

test("getElectionGate: GETs our gate endpoint through the Next data cache (revalidate 60)", async (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_API_URL");
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/";
  __resetGateCache();
  let url = ""; let init: any = null;
  const fake = async (u: string, i?: RequestInit) => { url = u; init = i; return resp(GOOD_BODY); };
  const g = (await getElectionGate(fake))!;
  assert.equal(g.enabled, true);
  assert.equal(g.races[0].office, "governor");
  assert.equal(url, "https://api.example.test/api/election/gate");
  assert.equal(init?.method, undefined); // plain GET
  assert.deepEqual(init?.next, { revalidate: 60, tags: ["election-gate"] });
});

test("getElectionGate: defaults to localhost:3000 without NEXT_PUBLIC_API_URL", async (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_API_URL");
  delete process.env.NEXT_PUBLIC_API_URL;
  __resetGateCache();
  let url = "";
  await getElectionGate(async (u: string) => { url = u; return resp(GOOD_BODY); });
  assert.equal(url, "http://localhost:3000/api/election/gate");
});

test("getElectionGate: every call goes to the fetch — the tagged Next data cache is the speed layer, not an L1 TTL (on-demand revalidation must bite immediately)", async (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_API_URL");
  __resetGateCache();
  let calls = 0;
  const fake = async () => { calls++; return resp(GOOD_BODY); };
  const g = (await getElectionGate(fake))!;
  assert.equal(g.enabled, true);
  await getElectionGate(fake);
  assert.equal(calls, 2); // no happy-path memory cache
});

test("getElectionGate: non-2xx with no L1 => null (UNKNOWN, not off), and NEVER cached (next call refetches)", async (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_API_URL");
  __resetGateCache();
  let calls = 0;
  const fail = async () => { calls++; return resp("", false); };
  // Decision C: unreachable-with-nothing-stale is UNKNOWN (null) — a
  // different fact from the kill switch's deliberate {enabled:false}.
  assert.equal(await getElectionGate(fail), null);
  assert.equal(await getElectionGate(fail), null);
  assert.equal(calls, 2);
});

test("getElectionGate: an explicit enabled:false response IS trusted — the kill switch speaking", async (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_API_URL");
  __resetGateCache();
  let calls = 0;
  const off = async () => { calls++; return resp({ enabled: false, races: [] }); };
  assert.deepEqual(await getElectionGate(off), OFF2);
  assert.deepEqual(await getElectionGate(off), OFF2);
  assert.equal(calls, 2); // fetched each time; the data cache dedupes in prod
});

test("getElectionGate: non-2xx serves the stale L1 gate; recovery refreshes it", async (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_API_URL");
  __resetGateCache();
  t.mock.timers.enable({ apis: ["Date"] });
  let calls = 0;
  const good = (await getElectionGate(async () => { calls++; return resp(GOOD_BODY); }))!;
  assert.ok(good);
  assert.equal(good.races.length, 1);

  const stale = await getElectionGate(async () => { calls++; return resp("", false); });
  assert.deepEqual(stale, good); // failure serves the last good gate
  assert.equal(calls, 2);

  const recovered = await getElectionGate(async () => {
    calls++;
    return resp(gateBody([{ office: "president", year: 2027, date: "2027-01-16" }]));
  });
  assert.equal(recovered!.races[0].office, "president");
  assert.equal(calls, 3);
});

test("getElectionGate: invalid body or thrown fetch is never trusted — stale L1 if present, else off", async (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_API_URL");
  __resetGateCache();
  // No L1 yet: invalid body => UNKNOWN (null), never a fabricated gate.
  assert.equal(await getElectionGate(async () => resp({ not: "a gate" })), null);
  assert.equal(await getElectionGate(async () => { throw new Error("network down"); }), null);

  const good = await getElectionGate(async () => resp(GOOD_BODY));
  assert.deepEqual(await getElectionGate(async () => resp({ not: "a gate" })), good);
  assert.deepEqual(await getElectionGate(async () => { throw new Error("network down"); }), good);
});

// --- environment flag helper (used elsewhere; the gate no longer sends it) ---

test("appEnv: VERCEL_ENV maps production->prod, preview->staging, else dev", (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_APP_ENV", "VERCEL_ENV");
  delete process.env.NEXT_PUBLIC_APP_ENV;

  process.env.VERCEL_ENV = "production";
  assert.equal(appEnv(), "prod");
  process.env.VERCEL_ENV = "preview";
  assert.equal(appEnv(), "staging");
  process.env.VERCEL_ENV = "development";
  assert.equal(appEnv(), "dev");
  delete process.env.VERCEL_ENV;
  assert.equal(appEnv(), "dev");
});

test("appEnv: NEXT_PUBLIC_APP_ENV overrides VERCEL_ENV; junk values are ignored", (t) => {
  saveEnvVars(t, "NEXT_PUBLIC_APP_ENV", "VERCEL_ENV");
  process.env.VERCEL_ENV = "production";

  process.env.NEXT_PUBLIC_APP_ENV = "staging";
  assert.equal(appEnv(), "staging");
  process.env.NEXT_PUBLIC_APP_ENV = "bogus";
  assert.equal(appEnv(), "prod"); // falls through to VERCEL_ENV
});
