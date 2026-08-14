import { describe, it, expect, vi } from "vitest";
import { ElectionService } from "../election.service";
import { GeoSeatResolver } from "../geo-seat-resolver";

function row(name: string, party: string, confidence = "high") {
  return { officialId: `id-${name}`, partyAcronym: party, confidence,
    official: { id: `id-${name}`, name, slug: name.toLowerCase(), imageUrl: null },
    party: { acronym: party, name: `${party} full` } };
}

describe("ElectionService.getBallot", () => {
  it("per-office years, filters, one-per-party (highest confidence), name-ordered; returns every requested office", async () => {
    const findMany = vi.fn(async ({ where }: any) =>
      where.electionType === "gubernatorial" && where.year === 2026
        ? [row("Bola", "PDP"), row("Ada", "APC", "medium"), row("Ada-hi", "APC", "high")]
        : []);
    const prisma = { officialElection: { findMany }, nigerianState: { findUnique: vi.fn(async () => ({ name: "Osun" })) } } as any;
    const resolver = {
      resolveOne: vi.fn(async (office: string) =>
        office === "governor" ? { office, column: "stateCode", code: "osun", label: "Governor of Osun" }
        : office === "president" ? { office, column: null, code: null, label: "President" }
        : null),
    } as unknown as GeoSeatResolver;

    const res = await new ElectionService(prisma, resolver).getBallot({
      state: "osun", offices: [{ office: "governor", year: 2026 }, { office: "president", year: 2027 }, { office: "hor", year: 2027 }],
    });

    const gw = findMany.mock.calls.find((c) => c[0].where.electionType === "gubernatorial")![0].where;
    expect(gw).toMatchObject({ electionType: "gubernatorial", year: 2026, isPrimary: true, result: "won", stateCode: "osun" });
    expect(gw.confidence).toEqual({ not: "low" });

    const gov = res.races.find((r: any) => r.office === "governor")!;
    expect(gov).toMatchObject({ resolved: true, hasData: true });
    expect(gov.candidates.map((c: any) => `${c.partyAcronym}:${c.name}`)).toEqual(["APC:Ada-hi", "PDP:Bola"]);

    const pres = res.races.find((r: any) => r.office === "president");
    expect(pres).toMatchObject({ resolved: true, hasData: false });
    const pw = findMany.mock.calls.find((c) => c[0].where.electionType === "presidential")![0].where;
    expect(pw.year).toBe(2027); expect(pw.stateCode).toBeUndefined();

    const hor = res.races.find((r: any) => r.office === "hor");
    expect(hor).toMatchObject({ resolved: false, hasData: false, seatCode: null });
    expect(findMany.mock.calls.some((c) => c[0].where.electionType === "house_of_reps")).toBe(false);
  });

  it("#G: isolates a failing office — one bad query does not blank the ballot", async () => {
    const findMany = vi.fn(async ({ where }: any) => { if (where.electionType === "presidential") throw new Error("db"); return []; });
    const prisma = { officialElection: { findMany }, nigerianState: { findUnique: vi.fn(async () => ({ name: "Osun" })) } } as any;
    const resolver = { resolveOne: vi.fn(async (o: string) => ({ office: o, column: o === "president" ? null : "stateCode", code: o === "president" ? null : "osun", label: o })) } as any;
    const res = await new ElectionService(prisma, resolver).getBallot({
      state: "osun", offices: [{ office: "president", year: 2027 }, { office: "governor", year: 2027 }],
    });
    expect(res.races.find((r: any) => r.office === "president")).toMatchObject({ resolved: false, hasData: false });
    expect(res.races.find((r: any) => r.office === "governor")).toBeTruthy();
  });
});
