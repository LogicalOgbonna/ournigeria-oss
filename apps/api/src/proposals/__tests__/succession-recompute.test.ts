import { describe, it, expect, vi } from "vitest";
import { ProposalsService } from "../proposals.service";

/**
 * Approving a succession ("new person holds the seat") mints a NEW official row.
 * The approve() epilogue recomputes completeness for proposal.officialId — the
 * PREDECESSOR — and applySuccession's return value (the successor id) was
 * discarded at the call site. The successor kept its creation-time stored score
 * forever: an impossible value for a row that has at least a name + position
 * (true score >= 2/14), displayed as-is by /api/officials because a Prisma
 * Decimal(0) is truthy and skips the legacy fallback.
 */
const OID = "11111111-1111-1111-1111-111111111111";
const NEW_OID = "55555555-5555-5555-5555-555555555555";
const PID = "33333333-3333-3333-3333-333333333333";
const POSID = "22222222-2222-2222-2222-222222222222";
const ADMIN = "44444444-4444-4444-4444-444444444444";

const successionProposal = {
  id: PID,
  officialId: OID,
  positionId: POSID,
  status: "submitted",
  targetField: "name",
  sourceUrl: null,
  createdAt: new Date("2026-07-01"),
  proposedValue: { value: "New Holder", nameChangeKind: "succession" },
  official: { id: OID, name: "Old Holder", slug: "old-holder", imageUrl: null },
};

function makeSvc() {
  const officialCreate = vi.fn(async ({ data }: any) => ({ id: NEW_OID, ...data }));
  const tx = {
    officialPosition: {
      findUnique: vi.fn(async () => ({
        id: POSID, officialId: OID, role: "governor", appointmentType: "elected",
        stateCode: "lagos", constituencyCode: null, lgaCode: null, wardCode: null,
      })),
      findFirst: vi.fn(),
      update: vi.fn(async () => ({})),
      create: vi.fn(async ({ data }: any) => ({ id: "pos-new", ...data })),
    },
    nigerianOfficial: {
      findUnique: vi.fn(async () => ({ officialType: "elected" })),
      findMany: vi.fn(async () => []), // slug uniqueness probe
      create: officialCreate,
    },
    activityLog: { create: vi.fn(async () => ({})) },
  } as any;
  const prisma = {
    dataProposal: {
      findUnique: vi.fn().mockResolvedValue(successionProposal),
      update: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({})),
    },
    nigerianOfficial: { update: vi.fn(async () => ({})) },
    officialPosition: { update: vi.fn(async () => ({})) },
    activityLog: { create: vi.fn(async () => ({})) },
    $transaction: vi.fn(async (fn: any) => fn(tx)),
  } as any;
  const officialsService = { recomputeCompleteness: vi.fn().mockResolvedValue(undefined) };
  const svc = new ProposalsService(
    prisma,
    { isStoredUrl: () => true } as any,
    officialsService as any,
    { notifyNewProposal: vi.fn() } as any,
  );
  return { svc, prisma, tx, officialsService, officialCreate };
}

describe("approve() succession completeness", () => {
  it("recomputes completeness for the NEW official, not just the predecessor", async () => {
    const { svc, officialsService } = makeSvc();
    await svc.approve(PID, ADMIN);
    expect(officialsService.recomputeCompleteness).toHaveBeenCalledWith(NEW_OID);
  });

  it("does not hardcode a stored score of 0 on the successor row", async () => {
    const { svc, officialCreate } = makeSvc();
    await svc.approve(PID, ADMIN);
    expect(officialCreate).toHaveBeenCalled();
    const data = officialCreate.mock.calls[0][0].data;
    // NULL ("not yet computed") is honest; a stored 0 is a lie the profile
    // endpoint displays verbatim. recompute() writes the real value right after.
    expect(data.completenessScore ?? null).toBeNull();
  });
});
