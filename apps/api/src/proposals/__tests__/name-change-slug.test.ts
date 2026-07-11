import { describe, it, expect, vi } from "vitest";
import { ProposalsService } from "../proposals.service.js";

/**
 * Bug: approving a "name" correction updated nigerian_officials.name but left the
 * slug tied to the OLD name, so the public URL (/officials/<slug>) never followed
 * the rename. Fix: on a name correction, regenerate the unique slug from the new
 * name, record the old slug in official_slug_aliases (so old URLs 308-redirect),
 * and never rename in place for a *succession* (that mints a new official).
 *
 * Plan: .agent/plans/55-official-name-change-slug-and-succession.md
 *
 * approve() touches this.prisma only, so the other constructor deps are stubs.
 * $transaction runs its callback against the same mock so we don't care whether
 * the write happens on `this.prisma` or on a `tx` handle.
 */
function makeService(prisma: any) {
  const imageStorage = { isStoredUrl: () => false } as any;
  const officialsService = { recomputeCompleteness: vi.fn().mockResolvedValue(undefined) } as any;
  const notifier = { notifyNewProposal: vi.fn().mockResolvedValue(undefined) } as any;
  return new ProposalsService(prisma, imageStorage, officialsService, notifier);
}

function makePrisma(over: Partial<any> = {}) {
  const prisma: any = {
    dataProposal: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(0),
    },
    nigerianOfficial: {
      update: vi.fn().mockResolvedValue({}),
      // no slug collisions → slug is the plain slugified new name
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ officialType: "elected" }),
      create: vi.fn().mockResolvedValue({ id: "off-new" }),
    },
    officialSlugAlias: {
      upsert: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    officialPosition: {
      update: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "pos-new" }),
    },
    officialPartyAffiliation: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "aff-new" }),
    },
    activityLog: { create: vi.fn().mockResolvedValue({}) },
  };
  prisma.$transaction = vi.fn(async (fn: any) => fn(prisma));
  return { ...prisma, ...over };
}

describe("approve() name correction — regenerates slug + records old-slug alias", () => {
  it("updates the official slug to match the new name", async () => {
    const prisma = makePrisma();
    prisma.dataProposal.findUnique.mockResolvedValue({
      id: "p1",
      officialId: "off-1",
      positionId: null,
      status: "submitted",
      targetField: "name",
      proposedValue: { value: "Bisong Effiom" }, // correction (no type:"identify")
      official: { id: "off-1", name: "Abang Out", slug: "abang-out", imageUrl: null },
    });

    await makeService(prisma).approve("p1", "admin-1");

    // The official-level update must carry a regenerated slug, not just the name.
    const updateCalls = prisma.nigerianOfficial.update.mock.calls;
    const slugWrite = updateCalls.find((c: any) => c[0]?.data?.slug !== undefined);
    expect(slugWrite, "expected nigerianOfficial.update to set a new slug").toBeTruthy();
    expect(slugWrite[0].data.slug).toBe("bisong-effiom");
  });

  it("preserves the old slug as an alias so old URLs can redirect", async () => {
    const prisma = makePrisma();
    prisma.dataProposal.findUnique.mockResolvedValue({
      id: "p1",
      officialId: "off-1",
      positionId: null,
      status: "submitted",
      targetField: "name",
      proposedValue: { value: "Bisong Effiom" },
      official: { id: "off-1", name: "Abang Out", slug: "abang-out", imageUrl: null },
    });

    await makeService(prisma).approve("p1", "admin-1");

    const upsertArg = prisma.officialSlugAlias.upsert.mock.calls[0]?.[0];
    const createArg = prisma.officialSlugAlias.create.mock.calls[0]?.[0];
    const recorded = upsertArg?.create ?? createArg?.data;
    expect(recorded, "expected an official_slug_aliases row for the old slug").toBeTruthy();
    expect(recorded.slug).toBe("abang-out");
    expect(recorded.officialId).toBe("off-1");
  });
});

describe("approve() name succession — new officeholder, do NOT rename in place", () => {
  it("ends the incumbent position and mints a new official instead of renaming", async () => {
    const prisma = makePrisma();
    prisma.dataProposal.findUnique.mockResolvedValue({
      id: "p2",
      officialId: "off-old",
      positionId: "pos-seat",
      status: "submitted",
      targetField: "name",
      sourceUrl: "https://example.gov.ng/inauguration",
      proposedValue: { value: "Bisong Effiom", nameChangeKind: "succession" },
      official: { id: "off-old", name: "Abang Out", slug: "abang-out", imageUrl: null },
    });
    prisma.officialPosition.findUnique.mockResolvedValue({
      id: "pos-seat",
      officialId: "off-old",
      role: "governor",
      appointmentType: "elected",
      status: "active",
      stateCode: "CR",
      constituencyCode: null,
      lgaCode: null,
      wardCode: null,
    });

    await makeService(prisma).approve("p2", "admin-1");

    // Incumbent seat ended, not renamed.
    const ended = prisma.officialPosition.update.mock.calls.find(
      (c: any) => c[0]?.data?.status === "ended",
    );
    expect(ended, "expected the incumbent position to be ended").toBeTruthy();
    expect(ended[0].where.id).toBe("pos-seat");
    expect(ended[0].data.endReason).toBe("term_end");

    // A brand-new official was created for the successor.
    const created = prisma.nigerianOfficial.create.mock.calls[0]?.[0];
    expect(created, "expected a new official to be created").toBeTruthy();
    expect(created.data.name).toBe("Bisong Effiom");
    expect(created.data.slug).toBe("bisong-effiom");

    // The old official's name must be untouched (no in-place rename to the new name).
    const renamedOld = prisma.nigerianOfficial.update.mock.calls.find(
      (c: any) => c[0]?.where?.id === "off-old" && c[0]?.data?.name === "Bisong Effiom",
    );
    expect(renamedOld, "old official must NOT be renamed on a succession").toBeFalsy();
  });

  it("uses the submitted effective date for the new term start and predecessor end", async () => {
    const prisma = makePrisma();
    prisma.dataProposal.findUnique.mockResolvedValue({
      id: "p3",
      officialId: "off-old",
      positionId: "pos-seat",
      status: "submitted",
      targetField: "name",
      sourceUrl: null,
      proposedValue: { value: "Bisong Effiom", nameChangeKind: "succession", effectiveDate: "2025-05-29" },
      official: { id: "off-old", name: "Abang Out", slug: "abang-out", imageUrl: null },
    });
    prisma.officialPosition.findUnique.mockResolvedValue({
      id: "pos-seat", officialId: "off-old", role: "governor", appointmentType: "elected",
      status: "active", stateCode: "CR", constituencyCode: null, lgaCode: null, wardCode: null,
    });

    await makeService(prisma).approve("p3", "admin-1");

    const ended = prisma.officialPosition.update.mock.calls.find((c: any) => c[0]?.data?.status === "ended");
    const newPos = prisma.officialPosition.create.mock.calls[0]?.[0];
    const iso = (d: Date) => new Date(d).toISOString().slice(0, 10);
    expect(iso(ended[0].data.endDate)).toBe("2025-05-29");
    expect(iso(newPos.data.startDate)).toBe("2025-05-29");
  });
});

describe("approve() party change — defection records a dated affiliation, not an in-place overwrite", () => {
  it("closes the open affiliation, adds a new one, and updates the seat party", async () => {
    const prisma = makePrisma();
    prisma.dataProposal.findUnique.mockResolvedValue({
      id: "p4",
      officialId: "off-1",
      positionId: "pos-1",
      status: "submitted",
      targetField: "partyAcronym",
      sourceUrl: "https://example.gov.ng/defection",
      proposedValue: { value: "APC", partyChangeKind: "defection", effectiveDate: "2024-07-01" },
      official: { id: "off-1", name: "Defector", slug: "defector", imageUrl: null },
    });
    prisma.officialPosition.findUnique.mockResolvedValue({ id: "pos-1", partyAcronym: "PDP" });

    await makeService(prisma).approve("p4", "admin-1");

    // Prior open affiliation closed as of the defection date.
    const closed = prisma.officialPartyAffiliation.updateMany.mock.calls[0]?.[0];
    expect(closed?.where).toMatchObject({ officialId: "off-1", endDate: null });
    expect(new Date(closed.data.endDate).toISOString().slice(0, 10)).toBe("2024-07-01");

    // A NEW open affiliation for the party defected TO.
    const newAff = prisma.officialPartyAffiliation.create.mock.calls
      .map((c: any) => c[0].data)
      .find((d: any) => d.partyAcronym === "APC");
    expect(newAff, "expected a new affiliation for the new party").toBeTruthy();
    expect(new Date(newAff.startDate).toISOString().slice(0, 10)).toBe("2024-07-01");
    expect(newAff.endDate).toBeNull();

    // Seat's current party updated so "current" views stay right.
    const seatUpdate = prisma.officialPosition.update.mock.calls.find(
      (c: any) => c[0]?.where?.id === "pos-1" && c[0]?.data?.partyAcronym === "APC",
    );
    expect(seatUpdate, "expected the position party to be updated to the new party").toBeTruthy();
  });

  it("a party CORRECTION still updates in place (no affiliation record)", async () => {
    const prisma = makePrisma();
    prisma.dataProposal.findUnique.mockResolvedValue({
      id: "p5",
      officialId: "off-1",
      positionId: "pos-1",
      status: "submitted",
      targetField: "partyAcronym",
      sourceUrl: null,
      proposedValue: { value: "LP", partyChangeKind: "correction" },
      official: { id: "off-1", name: "Wrong Party", slug: "wrong-party", imageUrl: null },
    });

    await makeService(prisma).approve("p5", "admin-1");

    const seatUpdate = prisma.officialPosition.update.mock.calls.find(
      (c: any) => c[0]?.where?.id === "pos-1" && c[0]?.data?.partyAcronym === "LP",
    );
    expect(seatUpdate, "correction should update the seat party in place").toBeTruthy();
    expect(prisma.officialPartyAffiliation.create).not.toHaveBeenCalled();
  });
});
