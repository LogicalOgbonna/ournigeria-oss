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
  /** Officials created by the independent cases below; cleaned in afterAll. */
  const extraOfficialIds: string[] = [];

  async function mkOfficial(name: string) {
    const o = await prisma.nigerianOfficial.create({
      data: { name: `Zzz Anchor ${name} ${tag}`, slug: `zzz-anchor-${name}-${tag}` }, select: { id: true },
    });
    extraOfficialIds.push(o.id);
    return o.id;
  }

  beforeAll(async () => {
    candidateId = (await prisma.nigerianOfficial.create({
      data: { name: `Zzz Anchor Cand ${tag}`, slug: `zzz-anchor-cand-${tag}` }, select: { id: true },
    })).id;
    mateId = (await prisma.nigerianOfficial.create({
      data: { name: `Zzz Anchor Mate ${tag}`, slug: `zzz-anchor-mate-${tag}` }, select: { id: true },
    })).id;
  });

  afterAll(async () => {
    const officials = [candidateId, mateId, ...extraOfficialIds];
    await prisma.officialElection.deleteMany({ where: { officialId: { in: officials } } });
    await prisma.nigerianOfficial.deleteMany({ where: { id: { in: officials } } });
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
  const ctx = (result: "pending" | "won" | "withdrawn", confidence: "high" | "medium" | "low" = "high") =>
    ({ result, reviewedBy: "test", sourceType: "manual" as const, confidence });

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
    expect(cand?.winnerName).toBe(`Zzz Anchor Cand ${tag}`);
    expect(await prisma.officialElection.count({ where: { officialId: candidateId, year: 2099 } })).toBe(1);
    // the mate row is never 'won'; it stays pending unless the ticket is withdrawn
    const mate = await prisma.officialElection.findUnique({ where: { id: second.mateElectionId! } });
    expect(mate?.result).toBe("pending");
    expect(mate?.winnerName).toBeNull();
  });

  it("withdrawn marks both rows withdrawn and clears the winner name", async () => {
    const res = await prisma.$transaction((tx) => ensureTicketElections(tx, ticket(), ctx("withdrawn")));
    const rows = await prisma.officialElection.findMany({ where: { id: { in: [res.candidateElectionId!, res.mateElectionId!] } }, select: { result: true, winnerName: true } });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.result === "withdrawn")).toBe(true);
    expect(rows.every((r) => r.winnerName === null)).toBe(true);
  });

  it("returns null ids when the ticket has no linked officials", async () => {
    const res = await prisma.$transaction((tx) => ensureTicketElections(tx, { ...ticket(), candidateOfficialId: null, runningMateOfficialId: null }, ctx("pending")));
    expect(res).toEqual({ candidateElectionId: null, mateElectionId: null });
  });

  it("never touches the general-election row of the same race", async () => {
    const officialId = await mkOfficial("collide");
    const general = await prisma.officialElection.create({
      data: { officialId, electionType: "gubernatorial", isPrimary: false, year: 2099, partyAcronym: "APC", stateCode: "lagos", result: "lost" },
      select: { id: true },
    });
    const res = await prisma.$transaction((tx) =>
      ensureTicketElections(tx, { ...ticket(), candidateOfficialId: officialId, runningMateOfficialId: null }, ctx("won")),
    );
    expect(res.candidateElectionId).not.toBe(general.id);
    expect((await prisma.officialElection.findUniqueOrThrow({ where: { id: general.id } })).result).toBe("lost");
    const primary = await prisma.officialElection.findUniqueOrThrow({ where: { id: res.candidateElectionId! } });
    expect(primary).toMatchObject({ isPrimary: true, result: "won" });
  });

  it("does not downgrade provenance on an existing row", async () => {
    const officialId = await mkOfficial("provenance");
    const before = await prisma.officialElection.create({
      data: {
        officialId, electionType: "gubernatorial", isPrimary: true, year: 2099, partyAcronym: "APC",
        stateCode: "lagos", result: "pending", reviewStatus: "disputed", confidence: "high", sourceType: "agent",
      },
    });
    const res = await prisma.$transaction((tx) =>
      ensureTicketElections(tx, { ...ticket(), candidateOfficialId: officialId, runningMateOfficialId: null }, ctx("won", "low")),
    );
    expect(res.candidateElectionId).toBe(before.id);
    const after = await prisma.officialElection.findUniqueOrThrow({ where: { id: before.id } });
    expect(after).toMatchObject({ reviewStatus: "disputed", confidence: "high", sourceType: "agent", result: "won" });
    expect(after.reviewedBy).toBe(before.reviewedBy);
    expect(after.lastVerifiedAt).not.toEqual(before.lastVerifiedAt);
  });

  it("keeps a scope column the ticket does not carry", async () => {
    const officialId = await mkOfficial("scope");
    const seeded = await prisma.officialElection.create({
      data: { officialId, electionType: "senatorial", isPrimary: true, year: 2099, partyAcronym: "APC", stateCode: "lagos", constituencyCode: "sen_lagos_lagos_west", result: "pending" },
      select: { id: true },
    });
    await prisma.$transaction((tx) =>
      ensureTicketElections(tx, { ...ticket(), electionType: "senatorial", candidateOfficialId: officialId, runningMateOfficialId: null }, ctx("won")),
    );
    const after = await prisma.officialElection.findUniqueOrThrow({ where: { id: seeded.id } });
    expect(after.constituencyCode).toBe("sen_lagos_lagos_west");
    expect(after.stateCode).toBe("lagos");
  });

  it("creates no mate row for a race that has no running mate", async () => {
    const officialId = await mkOfficial("senate-cand");
    const mate = await mkOfficial("senate-mate");
    const res = await prisma.$transaction((tx) =>
      ensureTicketElections(tx, { ...ticket(), electionType: "senatorial", candidateOfficialId: officialId, runningMateOfficialId: mate }, ctx("won")),
    );
    expect(res.mateElectionId).toBeNull();
    expect(await prisma.officialElection.count({ where: { officialId: mate } })).toBe(0);
  });

  it("prefers the anchor id the campaign already points at", async () => {
    const officialId = await mkOfficial("known-anchor");
    const known = await prisma.officialElection.create({
      data: { officialId, electionType: "gubernatorial", isPrimary: true, year: 2099, partyAcronym: "PDP", stateCode: "lagos", result: "pending" },
      select: { id: true },
    });
    const res = await prisma.$transaction((tx) =>
      ensureTicketElections(
        tx,
        { ...ticket(), partyAcronym: "APC", candidateOfficialId: officialId, runningMateOfficialId: null, officialElectionId: known.id },
        ctx("won"),
      ),
    );
    expect(res.candidateElectionId).toBe(known.id);
    expect(await prisma.officialElection.count({ where: { officialId } })).toBe(1);
    const after = await prisma.officialElection.findUniqueOrThrow({ where: { id: known.id } });
    expect(after).toMatchObject({ result: "won", partyAcronym: "PDP" });
  });

  it("creates the row unreviewed when the caller says so (bulk import)", async () => {
    const officialId = await mkOfficial("unreviewed");
    const res = await prisma.$transaction((tx) =>
      ensureTicketElections(
        tx,
        { ...ticket(), candidateOfficialId: officialId, runningMateOfficialId: null },
        { ...ctx("pending"), sourceType: "import", reviewStatus: "unreviewed" },
      ),
    );
    const row = await prisma.officialElection.findUniqueOrThrow({ where: { id: res.candidateElectionId! } });
    expect(row.reviewStatus).toBe("unreviewed");
    expect(row.sourceType).toBe("import");
  });

  it("refuses to downgrade won → pending by default, and allows it with the flag", async () => {
    const officialId = await mkOfficial("downgrade");
    const won = await prisma.$transaction((tx) =>
      ensureTicketElections(tx, { ...ticket(), candidateOfficialId: officialId, runningMateOfficialId: null }, ctx("won")),
    );
    // Default: a re-import / draft re-save must not erase the recorded win.
    await prisma.$transaction((tx) =>
      ensureTicketElections(tx, { ...ticket(), candidateOfficialId: officialId, runningMateOfficialId: null }, ctx("pending")),
    );
    const kept = await prisma.officialElection.findUniqueOrThrow({ where: { id: won.candidateElectionId! } });
    expect(kept.result).toBe("won");
    expect(kept.winnerName).toBe(`Zzz Anchor Cand ${tag}`);

    // unpublish opts in explicitly.
    await prisma.$transaction((tx) =>
      ensureTicketElections(
        tx,
        { ...ticket(), candidateOfficialId: officialId, runningMateOfficialId: null },
        { ...ctx("pending"), allowResultDowngrade: true },
      ),
    );
    const after = await prisma.officialElection.findUniqueOrThrow({ where: { id: won.candidateElectionId! } });
    expect(after.result).toBe("pending");
    expect(after.winnerName).toBeNull();
  });

  it("maps every ticketed race to its mate type", () => {
    expect(MATE_ELECTION_TYPE.presidential).toBe("vice_presidential");
    expect(MATE_ELECTION_TYPE.gubernatorial).toBe("deputy_gubernatorial");
    expect(MATE_ELECTION_TYPE.lga_chairman).toBe("lga_vice_chairman");
    expect(MATE_ELECTION_TYPE.senatorial).toBeNull();
  });
});
