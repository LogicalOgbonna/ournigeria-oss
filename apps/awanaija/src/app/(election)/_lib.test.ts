import { test } from "node:test";
import assert from "node:assert/strict";
import { countdownFor, daysToGoFor } from "./_lib";
import { __resetGateCache, type ElectionGate } from "@/lib/election-gate";

// A gate carrying the seeded INEC presidential row (day precision) by default.
function gate(overrides: Partial<ElectionGate["races"][number]> = {}, enabled = true): ElectionGate {
  return {
    enabled,
    races: [{
      office: "president", year: 2027, date: "2027-01-16",
      states: [], constituencies: [], lgas: [], excludeStates: [],
      ...overrides,
    }],
  };
}

test("countdownFor: day-precision date => real countdown (seeded INEC 2027-01-16)", () => {
  assert.equal(countdownFor(gate(), 2027, new Date("2027-01-01T00:00:00Z")), 15);
  assert.equal(countdownFor(gate(), 2027, new Date("2027-01-16T23:59:00Z")), 0);
});

test("countdownFor: polling day in the past clamps to 0, never negative", () => {
  assert.equal(countdownFor(gate(), 2027, new Date("2027-03-01T00:00:00Z")), 0);
});

test("countdownFor: month/year precision => null — no fake precision", () => {
  assert.equal(countdownFor(gate({ date: "2027-01" }), 2027, new Date("2026-08-01T00:00:00Z")), null);
  assert.equal(countdownFor(gate({ date: "2027" }), 2027, new Date("2026-08-01T00:00:00Z")), null);
});

test("countdownFor: unknown cycle, no presidential race, or gate off => null", () => {
  const now = new Date("2026-08-01T00:00:00Z");
  assert.equal(countdownFor(gate(), 2031, now), null); // cycle the gate doesn't carry
  assert.equal(countdownFor(gate({ office: "governor" }), 2027, now), null);
  assert.equal(countdownFor(gate({}, false), 2027, now), null);
  assert.equal(countdownFor({ enabled: true, races: [] }, 2027, now), null);
});

test("countdownFor: postponed cycle — date's calendar year may differ from the cycle year", () => {
  // A Dec-2026 poll postponed into Jan 2027 keeps year 2026 (E1.2); the
  // countdown is keyed on the cycle year, the date is just the target.
  const g = gate({ year: 2026, date: "2027-01-09" });
  assert.equal(countdownFor(g, 2026, new Date("2026-12-31T00:00:00Z")), 9);
  assert.equal(countdownFor(g, 2027, new Date("2026-12-31T00:00:00Z")), null);
});

test("daysToGoFor: resolves through getElectionGate from the gate endpoint", async (t) => {
  __resetGateCache();
  t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify(gate()), { status: 200, headers: { "content-type": "application/json" } }));
  try {
    assert.equal(await daysToGoFor(2027, new Date("2027-01-01T00:00:00Z")), 15);
    assert.equal(await daysToGoFor(2031, new Date("2027-01-01T00:00:00Z")), null);
  } finally {
    __resetGateCache();
  }
});

test("daysToGoFor: gate unreachable => null, not a stale hardcoded date", async (t) => {
  __resetGateCache();
  t.mock.method(globalThis, "fetch", async () => { throw new Error("down"); });
  try {
    assert.equal(await daysToGoFor(2027), null);
  } finally {
    __resetGateCache();
  }
});
