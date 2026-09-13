import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ElectionService } from "../election.service";
import { GeoSeatResolver } from "../geo-seat-resolver";
import { clearSettings, setSetting } from "../../config/settings-store";

const resolver = { resolveOne: vi.fn() } as unknown as GeoSeatResolver;

function evt(over: Record<string, unknown> = {}) {
  return {
    id: "e1", slug: "2027-presidential", office: "presidential", year: 2027, round: "general",
    electionDate: null as Date | null, datePrecision: "year", label: null as string | null,
    stateCode: null, constituencyCode: null, lgaCode: null, wardCode: null,
    status: "scheduled", published: true, excludedStates: [] as { stateCode: string }[], lga: null,
    ...over,
  };
}

function service(rows: unknown[] | (() => unknown[])) {
  const findMany = vi.fn(async (args: any) => (typeof rows === "function" ? rows() : rows));
  const prisma = { election: { findMany } } as any;
  return { svc: new ElectionService(prisma, resolver), findMany };
}

describe("ElectionService.gate", () => {
  beforeEach(() => {
    clearSettings();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    clearSettings();
  });

  it("serializes the full race shape (incl. cycle year) and queries only published scheduled/postponed rows", async () => {
    const { svc, findMany } = service([
      evt({ electionDate: new Date("2027-01-16"), datePrecision: "day", label: "2027 General Election" }),
    ]);
    const res = await svc.gate();
    expect(res).toEqual({
      enabled: true,
      races: [{
        office: "president", year: 2027, date: "2027-01-16", label: "2027 General Election",
        states: [], constituencies: [], lgas: [], excludeStates: [],
      }],
    });
    // unpublished / concluded / cancelled rows are excluded at the query
    expect(findMany.mock.calls[0][0].where).toEqual({
      published: true, status: { in: ["scheduled", "postponed"] },
    });
  });

  it("kill switch off => enabled false, races empty, no DB hit", async () => {
    setSetting("elections.gate_enabled", "false");
    const { svc, findMany } = service([evt()]);
    expect(await svc.gate()).toEqual({ enabled: false, races: [] });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("emits dates per precision: year from the year column, month as YYYY-MM, day as YYYY-MM-DD", async () => {
    const { svc } = service([
      evt({ slug: "a", office: "presidential", year: 2027, electionDate: null, datePrecision: "year" }),
      evt({ slug: "b", office: "gubernatorial", stateCode: "osun", year: 2026, electionDate: new Date("2026-11-01"), datePrecision: "month" }),
      evt({ slug: "c", office: "gubernatorial", stateCode: "ekiti", year: 2026, electionDate: new Date("2026-12-08"), datePrecision: "day" }),
    ]);
    const res = await svc.gate();
    const dates = Object.fromEntries(res.races.map((r) => [r.states[0] ?? "national", r.date]));
    expect(dates).toEqual({ national: "2027", osun: "2026-11", ekiti: "2026-12-08" });
  });

  it("E1.2 postponed: year stays the cycle year even when the date crossed into the next calendar year", async () => {
    const { svc } = service([
      evt({ office: "gubernatorial", stateCode: "osun", year: 2026, electionDate: new Date("2027-01-05"), datePrecision: "day", status: "postponed" }),
    ]);
    const res = await svc.gate();
    expect(res.races).toHaveLength(1);
    expect(res.races[0].year).toBe(2026);
    expect(res.races[0].date).toBe("2027-01-05");
  });

  it("precision-aware upcoming filter: period-end >= today (day = that day, month = end of month, year = Dec 31)", async () => {
    // today (fake) = 2026-06-15
    const { svc } = service([
      evt({ slug: "past-day", office: "gubernatorial", stateCode: "a", year: 2026, electionDate: new Date("2026-06-14"), datePrecision: "day" }),
      evt({ slug: "today-day", office: "gubernatorial", stateCode: "b", year: 2026, electionDate: new Date("2026-06-15"), datePrecision: "day" }),
      evt({ slug: "this-month", office: "gubernatorial", stateCode: "c", year: 2026, electionDate: new Date("2026-06-01"), datePrecision: "month" }),
      evt({ slug: "last-month", office: "gubernatorial", stateCode: "d", year: 2026, electionDate: new Date("2026-05-01"), datePrecision: "month" }),
      evt({ slug: "this-year", office: "gubernatorial", stateCode: "e", year: 2026, electionDate: null, datePrecision: "year" }),
      evt({ slug: "last-year", office: "gubernatorial", stateCode: "f", year: 2025, electionDate: null, datePrecision: "year" }),
    ]);
    const res = await svc.gate();
    expect(res.races.map((r) => r.states[0]).sort()).toEqual(["b", "c", "e"]);
  });

  it("sibling ordering: a NULL date sorts as Dec 31 of its year — the dated earlier round wins", async () => {
    const { svc } = service([
      evt({ slug: "year-only", office: "gubernatorial", stateCode: "osun", year: 2026, electionDate: null, datePrecision: "year" }),
      evt({ slug: "dated", office: "gubernatorial", stateCode: "osun", year: 2026, round: "rerun", electionDate: new Date("2026-11-15"), datePrecision: "day" }),
    ]);
    const res = await svc.gate();
    expect(res.races).toHaveLength(1);
    expect(res.races[0].date).toBe("2026-11-15");
  });

  it("sibling-round dedupe: same office+scope emits only the earliest upcoming; a different scope is a different race", async () => {
    const { svc } = service([
      evt({ slug: "general", office: "gubernatorial", stateCode: "osun", year: 2026, electionDate: new Date("2026-12-08"), datePrecision: "day" }),
      evt({ slug: "supp", office: "gubernatorial", stateCode: "osun", year: 2026, round: "supplementary", electionDate: new Date("2027-01-15"), datePrecision: "day" }),
      evt({ slug: "ekiti", office: "gubernatorial", stateCode: "ekiti", year: 2026, electionDate: new Date("2026-12-08"), datePrecision: "day" }),
    ]);
    const res = await svc.gate();
    expect(res.races.map((r) => `${r.states[0]}:${r.date}`).sort()).toEqual(["ekiti:2026-12-08", "osun:2026-12-08"]);
  });

  it("races follow ballot order: office rank first, date only breaks ties within an office", async () => {
    const { svc } = service([
      evt({ id: "g1", slug: "osun", office: "gubernatorial", stateCode: "osun", year: 2026, electionDate: new Date("2026-12-08"), datePrecision: "day" }),
      evt({ id: "p1", slug: "pres", office: "presidential", year: 2027, electionDate: new Date("2027-01-16"), datePrecision: "day" }),
      evt({ id: "s1", slug: "sen", office: "senatorial", year: 2027, electionDate: new Date("2027-01-16"), datePrecision: "day" }),
      evt({ id: "g2", slug: "enugu", office: "gubernatorial", stateCode: "enugu", year: 2027, electionDate: new Date("2027-03-01"), datePrecision: "day" }),
    ]);
    const res = await svc.gate();
    // President leads even though the Osun poll is months earlier.
    expect(res.races.map((r) => r.office)).toEqual(["president", "governor", "governor", "senate"]);
    // Within the same office, the earlier poll comes first.
    expect(res.races.slice(1, 3).map((r) => r.states[0])).toEqual(["osun", "enugu"]);
  });

  it("maps election_excluded_states to excludeStates", async () => {
    const { svc } = service([
      evt({ office: "senatorial", year: 2027, excludedStates: [{ stateCode: "osun" }, { stateCode: "ekiti" }] }),
    ]);
    const res = await svc.gate();
    expect(res.races[0].office).toBe("senate");
    expect(res.races[0].excludeStates).toEqual(["osun", "ekiti"]);
  });

  it('emits lgas as "state/bare-lga", stripping the state prefix even when the state code has underscores', async () => {
    const { svc } = service([
      evt({ slug: "l1", office: "lga_chairman", stateCode: "abia", lgaCode: "abia_aba_north", year: 2026, electionDate: new Date("2026-10-03"), datePrecision: "day" }),
      evt({ slug: "l2", office: "lga_chairman", stateCode: null, lgaCode: "cross_river_akamkpa", lga: { stateCode: "cross_river" }, year: 2026, electionDate: new Date("2026-10-03"), datePrecision: "day" }),
    ]);
    const res = await svc.gate();
    expect(res.races.map((r) => r.lgas[0]).sort()).toEqual(["abia/aba_north", "cross_river/akamkpa"]);
  });

  it("E1.1: serves the last-known-good snapshot with 200 on DB failure, refreshes after recovery, 503 when no snapshot", async () => {
    let mode: "ok" | "fail" | "recovered" = "ok";
    const { svc } = service(() => {
      if (mode === "fail") throw new Error("db down");
      return mode === "ok"
        ? [evt({ electionDate: new Date("2027-01-16"), datePrecision: "day" })]
        : [evt({ electionDate: new Date("2027-02-20"), datePrecision: "day" })];
    });

    const good = await svc.gate();
    expect(good.races[0].date).toBe("2027-01-16");

    mode = "fail";
    expect(await svc.gate()).toEqual(good); // stale snapshot, no throw

    mode = "recovered";
    expect((await svc.gate()).races[0].date).toBe("2027-02-20"); // snapshot refreshed

    // fresh service, no snapshot yet => 503
    const { svc: fresh } = service(() => { throw new Error("db down"); });
    await expect(fresh.gate()).rejects.toMatchObject({ status: 503 });
  });
});
