import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHomeRaces, buildPartySlates, racesForViewer, type RailCandidate } from "./home-ballot";
import type { ElectionGate } from "./election-gate";

const NOW = new Date("2026-09-12T12:00:00Z");

function gateWith(races: Partial<ElectionGate["races"][number]>[]): ElectionGate {
  return {
    enabled: true,
    races: races.map((r) => ({
      office: "president",
      year: 2027,
      date: "2027-02-27",
      states: [],
      constituencies: [],
      lgas: [],
      excludeStates: [],
      ...r,
    })) as ElectionGate["races"],
  };
}

const rail = (id: string, name: string, acronym: string, office = "President"): RailCandidate => ({
  id,
  candidate: { name, office, imageUrl: null },
  party: { acronym, name: acronym, logoUrl: null },
});

const PRESIDENTIAL = [rail("tinubu", "Bola Tinubu", "APC"), rail("obi", "Peter Obi", "NDC")];

function sources(tickets: RailCandidate[] = [], calls: unknown[] = []) {
  return {
    presidential: async () => PRESIDENTIAL,
    tickets: async (params: unknown) => {
      calls.push(params);
      return tickets;
    },
  };
}

// The gate endpoint's payload for today's live races.
const LIVE_GATE = gateWith([
  { office: "president", year: 2027, date: "2027-01-16", label: "2027 General Election" },
  { office: "governor", year: 2026, date: "2026-12-08", label: "Osun Governorship", states: ["osun"] },
]);

const OSUN_TICKETS: RailCandidate[] = [
  {
    ...rail("ademola-adeleke", "Ademola Adeleke", "PDP", "Governor"),
    mate: { name: "Kola Adewusi", office: "Deputy Governor", imageUrl: "https://cdn/mate.webp" },
  },
  rail("u2", "Gboyega Oyetola", "APC", "Governor"),
];

test("buildHomeRaces: the dropdown mirrors the gate payload, with real candidates per race", async () => {
  const calls: unknown[] = [];
  const { races, year, years } = await buildHomeRaces(LIVE_GATE, sources(OSUN_TICKETS, calls), NOW);

  assert.deepEqual(
    races.map((r) => ({ office: r.office, label: r.label })),
    [
      // Nationwide race keeps the office name — its payload label names the
      // whole election day, not the contest.
      { office: "president", label: "Presidential" },
      // State-scoped race uses its payload label, which says which state.
      { office: "governor", label: "Osun Governorship" },
    ],
  );
  assert.deepEqual(races[0].candidates, PRESIDENTIAL);
  assert.deepEqual(calls, [{ type: "gubernatorial", year: 2026, state: "osun" }]);
  assert.deepEqual(
    races[1].candidates.map((c) => ({ id: c.id, name: c.candidate.name, party: c.party.acronym })),
    [
      { id: "ademola-adeleke", name: "Ademola Adeleke", party: "PDP" },
      { id: "u2", name: "Gboyega Oyetola", party: "APC" },
    ],
  );
  // The ticket source carries the running mate — the whole point of reading
  // campaigns instead of the mate-less ballot endpoint.
  assert.deepEqual(races[1].candidates[0].mate, {
    name: "Kola Adewusi",
    office: "Deputy Governor",
    imageUrl: "https://cdn/mate.webp",
  });
  assert.equal(year, 2027);
  assert.deepEqual(years, [2027, 2026]);
});

test("buildHomeRaces: explicit enabled:false is the kill switch — zero races, NO presidential fallback (decision C)", async () => {
  const { races, year, years } = await buildHomeRaces(
    { enabled: false, races: [] },
    sources(),
    NOW,
  );
  assert.deepEqual(races, []);
  assert.equal(year, 2027); // links still need a cycle to point at
  assert.deepEqual(years, []);
});

test("buildHomeRaces: null gate (unreachable, nothing stale) => presidential fallback with the fallback year", async () => {
  const { races, year, years } = await buildHomeRaces(null, sources(), NOW);
  assert.deepEqual(races.map((r) => ({ office: r.office, label: r.label })), [
    { office: "president", label: "Presidential" },
  ]);
  assert.deepEqual(races[0].candidates, PRESIDENTIAL);
  assert.equal(year, 2027);
  assert.deepEqual(years, [2027]);
});

test("buildHomeRaces: enabled gate with nothing published => presidential fallback (pre-launch state)", async () => {
  const { races } = await buildHomeRaces({ enabled: true, races: [] }, sources(), NOW);
  assert.deepEqual(races.map((r) => r.office), ["president"]);
  assert.deepEqual(races[0].candidates, PRESIDENTIAL);
});

test("buildHomeRaces: past races drop off; lga scope maps to the DB code; tickets errors mean an empty rail, not a crash", async () => {
  const calls: unknown[] = [];
  const gate = gateWith([
    { office: "governor", year: 2026, date: "2026-08-08", label: "Ekiti Governorship", states: ["ekiti"] }, // past
    { office: "lga_chairman", year: 2026, date: "2026-11-14", label: "Kwara LGA Polls", lgas: ["kwara/ifelodun"] },
  ]);
  const failing = {
    presidential: async () => PRESIDENTIAL,
    tickets: async (params: unknown) => {
      calls.push(params);
      throw new Error("api down");
    },
  };
  const { races } = await buildHomeRaces(gate, failing, NOW);

  assert.deepEqual(calls, [{ type: "lga_chairman", year: 2026, lga: "kwara_ifelodun" }]);
  // president prepended as fallback entry; the LGA race stays listed with an empty rail
  assert.deepEqual(races.map((r) => ({ office: r.office, label: r.label, n: r.candidates.length })), [
    { office: "president", label: "Presidential", n: 2 },
    { office: "lga_chairman", label: "Kwara LGA Polls", n: 0 },
  ]);
});

test("buildPartySlates: featured = presidential ticket, rows = down-ballot by tier", async () => {
  const { races } = await buildHomeRaces(LIVE_GATE, sources(OSUN_TICKETS), NOW);
  const slates = buildPartySlates(races);

  assert.deepEqual(slates.map((s) => s.party.acronym), ["APC", "NDC", "PDP"]);

  const apc = slates[0];
  assert.equal(apc.featured.id, "tinubu"); // presidential ticket, not the Osun candidate
  assert.deepEqual(apc.rows.map((r) => ({ id: r.id, people: r.people.map((p) => p.name) })), [
    { id: "state", people: ["Gboyega Oyetola"] },
  ]);
  assert.equal(apc.rows[0].people[0].office, "Osun Governorship");

  const pdp = slates[2];
  assert.equal(pdp.featured.id, "ademola-adeleke"); // no presidential ticket — first candidate leads
  const ndc = slates[1];
  assert.deepEqual(ndc.rows, []); // presidential-only party: featured card, no down-ballot rows
});

test("racesForViewer: geo-scoped races only show for viewers they cover", async () => {
  const { races } = await buildHomeRaces(LIVE_GATE, sources(OSUN_TICKETS), NOW);
  const labels = (v: ReturnType<typeof racesForViewer>) => v.map((r) => r.label);

  // No persisted location (and SSR): nationwide races only.
  assert.deepEqual(labels(racesForViewer(races, {})), ["Presidential"]);
  // Adamawa viewer (the screenshot case): Osun race hidden.
  assert.deepEqual(labels(racesForViewer(races, { stateCode: "adamawa", lgaCode: "adamawa_demsa" })), [
    "Presidential",
  ]);
  // Osun viewer: the governorship appears, with or without an LGA.
  assert.deepEqual(labels(racesForViewer(races, { stateCode: "osun" })), [
    "Presidential",
    "Osun Governorship",
  ]);
  assert.deepEqual(labels(racesForViewer(races, { stateCode: "osun", lgaCode: "osun_ede-north" })), [
    "Presidential",
    "Osun Governorship",
  ]);
});

test("racesForViewer: lga-scoped race matches via the composite code, DB prefix stripped", async () => {
  const gate = gateWith([
    { office: "lga_chairman", year: 2026, date: "2026-11-14", label: "Ifelodun Chairmanship", lgas: ["kwara/ifelodun"] },
  ]);
  const { races } = await buildHomeRaces(gate, sources(), NOW);
  const chairmanship = racesForViewer(races, { stateCode: "kwara", lgaCode: "kwara_ifelodun" });
  assert.ok(chairmanship.some((r) => r.label === "Ifelodun Chairmanship"));
  const otherLga = racesForViewer(races, { stateCode: "kwara", lgaCode: "kwara_asa" });
  assert.ok(!otherLga.some((r) => r.label === "Ifelodun Chairmanship"));
});

test("racesForViewer: excludeStates carves a viewer out of a nationwide race", async () => {
  const gate = gateWith([
    { office: "senate", date: "2027-02-27", label: "Senate", excludeStates: ["osun"] },
  ]);
  const { races } = await buildHomeRaces(gate, sources(), NOW);
  const senate = (v: { office: string }[]) => v.some((r) => r.office === "senate");
  assert.ok(senate(racesForViewer(races, { stateCode: "kano" })));
  assert.ok(!senate(racesForViewer(races, { stateCode: "osun" })));
  // Scoped only by exclusions => still nationwide for the location-less viewer.
  assert.ok(senate(racesForViewer(races, {})));
});

test("buildHomeRaces: a postponed election queries the ballot with its CYCLE year, not the date's calendar year", async () => {
  const calls: unknown[] = [];
  // Dec-2026 governorship postponed into Jan 2027: year stays 2026 (campaigns key on it).
  const gate = gateWith([
    { office: "governor", year: 2026, date: "2027-01-05", label: "Osun Governorship", states: ["osun"] },
  ]);
  const { races, years } = await buildHomeRaces(gate, sources(OSUN_TICKETS, calls), NOW);

  assert.deepEqual(calls, [{ type: "gubernatorial", year: 2026, state: "osun" }]);
  assert.ok(races.some((r) => r.label === "Osun Governorship"));
  assert.deepEqual(years, [2026]); // the cycle year, not 2027 off the date
});

test("buildHomeRaces: a bare-year date is upcoming through Dec 31 and still keys the ballot by race.year", async () => {
  const calls: unknown[] = [];
  const gate = gateWith([
    { office: "governor", year: 2026, date: "2026", label: "Osun Governorship", states: ["osun"] },
  ]);
  const { races } = await buildHomeRaces(gate, sources(OSUN_TICKETS, calls), NOW); // NOW = Sep 2026

  assert.deepEqual(calls, [{ type: "gubernatorial", year: 2026, state: "osun" }]);
  assert.ok(races.some((r) => r.label === "Osun Governorship"));
});

test("REPRO: two same-office races in different states stay SEPARATE — an Enugu viewer must never see 'Osun Governorship'", async () => {
  const gate = gateWith([
    { office: "governor", year: 2026, date: "2026-12-08", label: "Osun Governorship", states: ["osun"] },
    { office: "governor", year: 2027, date: "2027", label: "Enugu Governorship", states: ["enugu"] },
  ]);
  const { races } = await buildHomeRaces(gate, sources(), NOW);

  // Two distinct contests => two distinct entries, each with its own scope.
  assert.equal(races.filter((r) => r.office === "governor").length, 2);

  const enuguViewer = racesForViewer(races, { stateCode: "enugu" });
  assert.deepEqual(enuguViewer.map((r) => r.label).sort(), ["Enugu Governorship", "Presidential"]);
  const osunViewer = racesForViewer(races, { stateCode: "osun" });
  assert.deepEqual(osunViewer.map((r) => r.label).sort(), ["Osun Governorship", "Presidential"]);
});

test("buildHomeRaces: dropdown follows ballot order regardless of gate payload order", async () => {
  const gate = gateWith([
    { office: "senate", year: 2027, date: "2027-01-16", label: "Senate" },
    { office: "governor", year: 2026, date: "2026-12-08", label: "Osun Governorship", states: ["osun"] },
    { office: "president", year: 2027, date: "2027-01-16", label: "2027 General Election" },
    { office: "hor", year: 2027, date: "2027-01-16", label: "House" },
  ]);
  const { races } = await buildHomeRaces(gate, sources(), NOW);
  assert.deepEqual(races.map((r) => r.office), ["president", "governor", "senate", "hor"]);
});

test("buildHomeRaces: a throwing presidential source (no API at build time) still exports — empty rail, no crash", async () => {
  const failing = {
    presidential: async () => {
      throw new TypeError("fetch failed");
    },
    tickets: async () => [] as RailCandidate[],
  };
  const { races } = await buildHomeRaces(null, failing, NOW); // gate also unreachable, like CI
  assert.deepEqual(races.map((r) => ({ office: r.office, n: r.candidates.length })), [
    { office: "president", n: 0 },
  ]);
});
