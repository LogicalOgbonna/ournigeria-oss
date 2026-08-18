import { describe, it, expect, vi, beforeEach } from "vitest";
import { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";
import type { PrismaService } from "@ournigeria/database";

function makeRepo(existing: unknown) {
  const create = vi.fn(async ({ data }: { data: unknown }) => ({ id: "new", ...(data as object) }));
  const update = vi.fn(async ({ data }: { data: unknown }) => ({ id: "up", ...(data as object) }));
  const findUnique = vi.fn(async () => existing);
  const prisma = {
    socialsBotSession: { create, update, findUnique },
  } as unknown as PrismaService;
  return { repo: new BotSessionRepo(prisma), create, update, findUnique };
}

const BASE = {
  userName: "botA",
  path: "SearchTimeline",
  cookie: "ct0=abc; auth_token=z",
  csrfToken: "abc",
  authorization: "Bearer x",
  xClientTransactionId: "tx",
  xClientUuid: "uuid",
  searchTimelineOpHash: "SEARCH1",
};

describe("BotSessionRepo.saveCapture", () => {
  it("creates a new row as idle with cleared roamer state", async () => {
    const { repo, create } = makeRepo(null);
    await repo.saveCapture(BASE);
    expect(create).toHaveBeenCalledOnce();
    const data = create.mock.calls[0][0].data;
    expect(data.status).toBe("idle");
    expect(data.consecutiveErrors).toBe(0);
    expect(data.cooldownUntil).toBeNull();
    expect(data.searchTimelineOpHash).toBe("SEARCH1");
  });

  it("revives an auth_failed row (resets status/cooldown/errors)", async () => {
    const { repo, update } = makeRepo({ id: "e1", status: "auth_failed" });
    await repo.saveCapture(BASE);
    const data = update.mock.calls[0][0].data;
    expect(data.status).toBe("idle");
    expect(data.consecutiveErrors).toBe(0);
    expect(data.cooldownUntil).toBeNull();
    expect(data.lastError).toBeNull();
  });

  it("material-refreshes an idle row WITHOUT touching roamer state", async () => {
    const { repo, update } = makeRepo({ id: "e1", status: "idle" });
    await repo.saveCapture(BASE);
    const data = update.mock.calls[0][0].data;
    expect(data.cookie).toBe(BASE.cookie);
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("cooldownUntil");
    expect(data).not.toHaveProperty("consecutiveErrors");
    expect(data).not.toHaveProperty("lastError");
  });

  it("material-refreshes a working row WITHOUT flipping it to idle", async () => {
    const { repo, update } = makeRepo({ id: "e1", status: "working" });
    await repo.saveCapture(BASE);
    const data = update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("status");
  });

  it("write-only capture sets createTweetOpHash and does NOT null read hashes", async () => {
    const { repo, update } = makeRepo({ id: "e1", status: "idle" });
    await repo.saveCapture({ ...BASE, searchTimelineOpHash: undefined, createTweetOpHash: "WRITE1" });
    const data = update.mock.calls[0][0].data;
    expect(data.createTweetOpHash).toBe("WRITE1");
    expect(data).not.toHaveProperty("searchTimelineOpHash");
    expect(data).not.toHaveProperty("tweetDetailOpHash");
  });
});
