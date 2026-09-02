import { describe, it, expect, vi } from "vitest";
import { ScoutedHandleRepo } from "../platforms/twitter/scout/scouted-handle.repo.js";

function repoWith(rowsByTier: Array<Array<{ id: string }>>) {
  let call = 0;
  const findMany = vi.fn().mockImplementation(() => {
    const rows = rowsByTier[call] ?? [];
    call++;
    return Promise.resolve(rows);
  });
  const prisma = { socialsScoutedHandle: { findMany } } as any;
  return { repo: new ScoutedHandleRepo(prisma), findMany };
}

describe("ScoutedHandleRepo.pickForLocation", () => {
  it("walks ward → LGA → state tiers and dedupes across them", async () => {
    const { repo, findMany } = repoWith([
      [{ id: "w1" }], // ward tier
      [{ id: "w1" }, { id: "l1" }], // lga tier (w1 duplicated)
      [{ id: "s1" }], // state tier
    ]);
    const picked = await repo.pickForLocation({
      stateCode: "kano",
      lgaCode: "kano_dala",
      wardCode: "kano_dala_w01",
      limit: 3,
      cooldownDays: 14,
    });
    expect(picked.map((p) => p.id)).toEqual(["w1", "l1", "s1"]);
    expect(findMany).toHaveBeenCalledTimes(3);
    // Tier 1 filters on the ward, tier 2 on the LGA, tier 3 on the state.
    expect(findMany.mock.calls[0][0].where.wardCode).toBe("kano_dala_w01");
    expect(findMany.mock.calls[1][0].where.lgaCode).toBe("kano_dala");
    expect(findMany.mock.calls[2][0].where.stateCode).toBe("kano");
  });

  it("stops querying once the limit is reached", async () => {
    const { repo, findMany } = repoWith([[{ id: "w1" }, { id: "w2" }]]);
    const picked = await repo.pickForLocation({
      stateCode: "kano",
      lgaCode: "kano_dala",
      wardCode: "kano_dala_w01",
      limit: 2,
      cooldownDays: 14,
    });
    expect(picked).toHaveLength(2);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("skips the ward/LGA tiers when the seat has no such codes", async () => {
    const { repo, findMany } = repoWith([[{ id: "s1" }]]);
    const picked = await repo.pickForLocation({
      stateCode: "kano",
      limit: 2,
      cooldownDays: 14,
    });
    expect(picked.map((p) => p.id)).toEqual(["s1"]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0][0].where.stateCode).toBe("kano");
  });

  it("only picks active handles past the tagging cooldown", async () => {
    const { repo, findMany } = repoWith([[]]);
    await repo.pickForLocation({ stateCode: "kano", limit: 2, cooldownDays: 14 });
    const where = findMany.mock.calls[0][0].where;
    expect(where.status).toBe("active");
    expect(where.OR[0]).toEqual({ lastTaggedAt: null });
    expect(where.OR[1].lastTaggedAt.lt).toBeInstanceOf(Date);
  });

  it("oversamples the tier pool (so the shuffle has candidates) but returns at most limit", async () => {
    const pool = Array.from({ length: 10 }, (_, i) => ({ id: `h${i}` }));
    const { repo, findMany } = repoWith([pool]);
    const picked = await repo.pickForLocation({
      stateCode: "kano",
      limit: 2,
      cooldownDays: 14,
    });
    expect(findMany.mock.calls[0][0].take).toBe(10); // max(limit*5, 10)
    expect(picked).toHaveLength(2);
  });
});

describe("ScoutedHandleRepo.store manual-row upgrade", () => {
  it("upgrades a manual: row in place instead of duplicating the person", async () => {
    const manualRow = {
      id: "m1",
      restId: "manual:ada_ng",
      handle: "ada_ng",
      status: "opted_out",
    };
    const update = vi.fn().mockResolvedValue({ ...manualRow, restId: "222" });
    const upsert = vi.fn();
    const prisma = {
      socialsScoutedHandle: {
        findFirst: vi.fn().mockResolvedValue(manualRow),
        update,
        upsert,
      },
    } as any;
    const repo = new ScoutedHandleRepo(prisma);
    await repo.store({
      restId: "222",
      handle: "ada_ng",
      name: "Ada",
      bio: "Kano based",
      followers: 400,
      profileImageUrl: null,
      stateCode: "lagos", // model attribution must NOT overwrite operator geo
      lgaCode: null,
      wardCode: null,
      confidence: 0.7,
      evidence: "model guess",
      sourceTweetId: "t1",
      sourceTweetText: "hi",
      lastActiveAt: new Date(),
    });
    expect(upsert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    const data = update.mock.calls[0][0].data;
    expect(data.restId).toBe("222");
    expect(data.followers).toBe(400);
    expect(data.lastActiveAt).toBeInstanceOf(Date); // activity refreshed
    // Operator truth preserved: no geo/confidence/status in the update payload.
    expect(data.stateCode).toBeUndefined();
    expect(data.confidence).toBeUndefined();
    expect(data.status).toBeUndefined();
  });

  it("counts distinct handles tagged in the trailing 24h for the daily cap", async () => {
    const count = vi.fn().mockResolvedValue(7);
    const repo = new ScoutedHandleRepo({
      socialsScoutedHandle: { count },
    } as any);
    expect(await repo.taggedInLastDay()).toBe(7);
    expect(count.mock.calls[0][0].where.lastTaggedAt.gt).toBeInstanceOf(Date);
  });
});

describe("ScoutedHandleRepo.pickForLocation recency gate", () => {
  it("adds an active-within-window filter (manual rows exempt) when activeWithinDays is set", async () => {
    const { repo, findMany } = repoWith([[]]);
    await repo.pickForLocation({
      stateCode: "kano",
      limit: 2,
      cooldownDays: 14,
      activeWithinDays: 30,
    });
    const where = findMany.mock.calls[0][0].where;
    expect(where.AND).toBeDefined();
    const recencyOr = where.AND[0].OR;
    expect(recencyOr[0].lastActiveAt.gte).toBeInstanceOf(Date);
    expect(recencyOr[1].restId).toEqual({ startsWith: "manual:" });
  });

  it("omits the recency filter entirely when activeWithinDays is unset", async () => {
    const { repo, findMany } = repoWith([[]]);
    await repo.pickForLocation({ stateCode: "kano", limit: 2, cooldownDays: 14 });
    expect(findMany.mock.calls[0][0].where.AND).toBeUndefined();
  });
});
