import { describe, it, expect, vi } from "vitest";
import { ProposalsService } from "../proposals.service.js";

/**
 * The dashboard proposal listings must be LIFO — most recently submitted first
 * (recent -> oldest). Before this fix the flat admin queue ordered by createdAt
 * "asc" (as a voteScore tiebreaker), so in the default all-zero-vote "submitted"
 * view the OLDEST proposals surfaced first. Plan: .agent/plans/54-*.md
 *
 * These read paths touch only `this.prisma`, so the other constructor deps can
 * be empty stubs.
 */
function makeService(prisma: any) {
  return new ProposalsService(prisma, {} as any, {} as any, {} as any);
}

function findClause(orderBy: any, key: string) {
  const flat = Array.isArray(orderBy) ? orderBy : [orderBy];
  return flat.find((o: Record<string, unknown>) => key in o);
}

describe("Task 1 — flat admin queue (listPending) is pure LIFO", () => {
  it("orders newest-first by createdAt, with no voteScore primary", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      dataProposal: { findMany, count: vi.fn().mockResolvedValue(0) },
    };
    await makeService(prisma).listPending({ status: "submitted", page: 1, limit: 20 });

    const orderBy = findMany.mock.calls[0][0].orderBy;
    expect(findClause(orderBy, "createdAt")?.createdAt).toBe("desc");
    // Primary sort must be recency, not vote score.
    expect(orderBy[0]).toEqual({ createdAt: "desc" });
    expect(findClause(orderBy, "voteScore")).toBeUndefined();
  });
});

describe("Task 3 — seat candidates (getSeatCandidates) break ties newest-first", () => {
  it("orders by voteScore desc then createdAt desc", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      officialPosition: {
        findFirst: vi.fn().mockResolvedValue({
          id: "pos-1",
          officialId: "off-1",
          partyAcronym: null,
          official: { id: "off-1", name: "Seat Holder", slug: "seat-holder", imageUrl: null },
        }),
      },
      dataProposal: { findMany },
    };

    await makeService(prisma).getSeatCandidates({ role: "governor", stateCode: "KW" });

    const orderBy = findMany.mock.calls[0][0].orderBy;
    expect(orderBy).toEqual([{ voteScore: "desc" }, { createdAt: "desc" }]);
  });
});

describe("Task 2 — grouped identify view (listPendingIdentifyGrouped)", () => {
  const seat = {
    id: "pos-A", role: "governor",
    stateCode: "KW", lgaCode: null, wardCode: null, constituencyCode: null,
  };

  function proposal(over: Partial<any>) {
    return {
      id: "x", positionId: "pos-A", officialId: "off-A",
      proposedValue: { type: "identify", name: over.name ?? "Cand" },
      sourceUrl: null, trust: "verified", proposerPhone: null,
      status: "submitted", voteScore: 0, upvoteCount: 0, downvoteCount: 0,
      position: seat, official: { id: "off-A", name: "Seat A" },
      _count: { votes: 0 },
      ...over,
    };
  }

  it("within a seat, equal voteScore breaks newest-first", async () => {
    const older = proposal({ id: "older", name: "Older", createdAt: new Date("2026-01-01T00:00:00Z") });
    const newer = proposal({ id: "newer", name: "Newer", createdAt: new Date("2026-06-01T00:00:00Z") });
    // Returned in arbitrary order — the service must reorder.
    const findMany = vi.fn().mockResolvedValue([older, newer]);
    const prisma = { dataProposal: { findMany } };

    const res = await makeService(prisma).listPendingIdentifyGrouped({ page: 1, limit: 20 });
    const ids = res.data[0].candidates.map((c: any) => c.id);
    expect(ids).toEqual(["newer", "older"]);

    // Fetch itself is newest-first too.
    expect(findMany.mock.calls[0][0].orderBy).toEqual([{ createdAt: "desc" }]);
  });

  it("higher voteScore still wins over recency inside a seat", async () => {
    const newOldScore = proposal({ id: "new-lowscore", name: "New", voteScore: 1, createdAt: new Date("2026-06-01T00:00:00Z") });
    const oldHighScore = proposal({ id: "old-highscore", name: "Old", voteScore: 5, createdAt: new Date("2026-01-01T00:00:00Z") });
    const findMany = vi.fn().mockResolvedValue([newOldScore, oldHighScore]);
    const prisma = { dataProposal: { findMany } };

    const res = await makeService(prisma).listPendingIdentifyGrouped({ page: 1, limit: 20 });
    const ids = res.data[0].candidates.map((c: any) => c.id);
    expect(ids).toEqual(["old-highscore", "new-lowscore"]);
  });
});
