import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { ensureTicketElections, MATE_ELECTION_TYPE } from "../election-anchor";

describe("ensureTicketElections", () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const tag = Date.now().toString(36);
  let candidateId: string;
  let mateId: string;

  beforeAll(async () => {
    candidateId = (await prisma.nigerianOfficial.create({
      data: { name: `Zzz Anchor Cand ${tag}`, slug: `zzz-anchor-cand-${tag}` }, select: { id: true },
    })).id;
    mateId = (await prisma.nigerianOfficial.create({
      data: { name: `Zzz Anchor Mate ${tag}`, slug: `zzz-anchor-mate-${tag}` }, select: { id: true },
    })).id;
  });

  afterAll(async () => {
    await prisma.officialElection.deleteMany({ where: { officialId: { in: [candidateId, mateId] } } });
    await prisma.nigerianOfficial.deleteMany({ where: { id: { in: [candidateId, mateId] } } });
    await prisma.$disconnect();
    await pool.end();
  });

  const ticket = () => ({
    electionType: "gubernatorial",
    year: 2099,
    partyAcronym: "APC",
    stateCode: "lagos",
    constituencyCode: null,
    lgaCode: null,
    candidateOfficialId: candidateId,
    candidateName: `Zzz Anchor Cand ${tag}`,
    runningMateOfficialId: mateId,
    runningMateName: `Zzz Anchor Mate ${tag}`,
  });
  const ctx = (result: "pending" | "won" | "withdrawn") => ({ result, reviewedBy: "test", sourceType: "manual" as const, confidence: "high" });

  it("creates a primary row for the candidate and a deputy row for the mate, pending", async () => {
    const res = await prisma.$transaction((tx) => ensureTicketElections(tx, ticket(), ctx("pending")));
    const cand = await prisma.officialElection.findUnique({ where: { id: res.candidateElectionId! } });
    expect(cand).toMatchObject({ electionType: "gubernatorial", isPrimary: true, result: "pending", stateCode: "lagos", partyAcronym: "APC" });
    const mate = await prisma.officialElection.findUnique({ where: { id: res.mateElectionId! } });
    expect(mate).toMatchObject({ electionType: "deputy_gubernatorial", isPrimary: false, result: "pending" });
  });

  it("is idempotent and updates the result on a second call", async () => {
    const first = await prisma.$transaction((tx) => ensureTicketElections(tx, ticket(), ctx("pending")));
    const second = await prisma.$transaction((tx) => ensureTicketElections(tx, ticket(), ctx("won")));
    expect(second.candidateElectionId).toBe(first.candidateElectionId);
    const cand = await prisma.officialElection.findUnique({ where: { id: second.candidateElectionId! } });
    expect(cand?.result).toBe("won");
    expect(await prisma.officialElection.count({ where: { officialId: candidateId, year: 2099 } })).toBe(1);
    // the mate row is never 'won'; it stays pending unless the ticket is withdrawn
    const mate = await prisma.officialElection.findUnique({ where: { id: second.mateElectionId! } });
    expect(mate?.result).toBe("pending");
  });

  it("withdrawn marks both rows withdrawn", async () => {
    const res = await prisma.$transaction((tx) => ensureTicketElections(tx, ticket(), ctx("withdrawn")));
    const rows = await prisma.officialElection.findMany({ where: { id: { in: [res.candidateElectionId!, res.mateElectionId!] } }, select: { result: true } });
    expect(rows.map((r) => r.result)).toEqual(["withdrawn", "withdrawn"]);
  });

  it("returns null ids when the ticket has no linked officials", async () => {
    const res = await prisma.$transaction((tx) => ensureTicketElections(tx, { ...ticket(), candidateOfficialId: null, runningMateOfficialId: null }, ctx("pending")));
    expect(res).toEqual({ candidateElectionId: null, mateElectionId: null });
  });

  it("maps every ticketed race to its mate type", () => {
    expect(MATE_ELECTION_TYPE.presidential).toBe("vice_presidential");
    expect(MATE_ELECTION_TYPE.gubernatorial).toBe("deputy_gubernatorial");
    expect(MATE_ELECTION_TYPE.lga_chairman).toBe("lga_vice_chairman");
    expect(MATE_ELECTION_TYPE.senatorial).toBeNull();
  });
});
