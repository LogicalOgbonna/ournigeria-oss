import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProposalsService } from "../proposals.service";

// The DB stores House-of-Reps positions as role "rep" (361 rows in prod, zero
// "representative"), and every geo/parties read path queries `equals: "rep"`.
// The identify seat flow must therefore normalize BOTH client spellings to
// "rep" — normalizing to "representative" makes the canonical-seat dedupe blind
// to every existing rep (duplicate officials) and writes positions no widget
// can see (the "Unknown House of Reps" row never resolves).

const OFFICIAL_ID = "11111111-1111-1111-1111-111111111111";
const POSITION_ID = "22222222-2222-2222-2222-222222222222";
const PROPOSAL_ID = "33333333-3333-3333-3333-333333333333";

function makeTx() {
  return {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    officialPosition: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: POSITION_ID, officialId: OFFICIAL_ID }),
    },
    nigerianOfficial: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: OFFICIAL_ID }),
    },
    dataProposal: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: PROPOSAL_ID }),
    },
  };
}

function makePrisma(tx: ReturnType<typeof makeTx>) {
  return {
    dataProposal: { count: vi.fn().mockResolvedValue(0) },
    activityLog: { create: vi.fn().mockResolvedValue({}) },
    officialPosition: { findFirst: vi.fn().mockResolvedValue(null) },
    $queryRawUnsafe: vi.fn().mockResolvedValue([{}]),
    $transaction: vi.fn(async (fn: any) => fn(tx)),
  } as any;
}

function makeService(prisma: any) {
  return new ProposalsService(
    prisma,
    { isStoredUrl: () => true } as any,
    { recomputeCompleteness: vi.fn().mockResolvedValue(undefined) } as any,
    { notifyNewProposal: vi.fn().mockResolvedValue(undefined) } as any,
  );
}

describe("identify: House of Reps role spelling", () => {
  let tx: ReturnType<typeof makeTx>;
  let prisma: any;
  let svc: ProposalsService;

  beforeEach(() => {
    tx = makeTx();
    prisma = makePrisma(tx);
    svc = makeService(prisma);
  });

  for (const clientRole of ["rep", "representative"]) {
    it(`identify(role="${clientRole}") looks up and writes the seat as "rep"`, async () => {
      await svc.identify({
        proposerPhone: null,
        proposerIp: "1.2.3.4",
        trust: "anonymous",
        name: "Test Rep",
        role: clientRole,
        stateCode: "abia",
        constituencyCode: "fed_abia_aba_north_aba_south",
      });

      // Canonical-seat dedupe must be able to see the existing "rep" rows.
      const dedupeCalls = tx.officialPosition.findFirst.mock.calls.map((c) => c[0].where.role);
      expect(dedupeCalls.length).toBeGreaterThan(0);
      for (const role of dedupeCalls) expect(role).toBe("rep");

      // The created position must use the spelling the geo widgets query.
      expect(tx.officialPosition.create).toHaveBeenCalledTimes(1);
      expect(tx.officialPosition.create.mock.calls[0][0].data.role).toBe("rep");
    });

    it(`getSeatCandidates(role="${clientRole}") queries canonical positions as "rep"`, async () => {
      await svc.getSeatCandidates({
        role: clientRole,
        stateCode: "abia",
        constituencyCode: "fed_abia_aba_north_aba_south",
      });

      expect(prisma.officialPosition.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.officialPosition.findFirst.mock.calls[0][0].where.role).toBe("rep");
    });
  }
});
