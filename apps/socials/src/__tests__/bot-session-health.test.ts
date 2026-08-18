import { describe, it, expect, vi } from "vitest";
import { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";
import type { PrismaService } from "@ournigeria/database";

function makeRepo(rows: unknown[]) {
  const findMany = vi.fn(async () => rows);
  const prisma = { socialsBotSession: { findMany } } as unknown as PrismaService;
  return new BotSessionRepo(prisma);
}

const ROW = {
  userName: "BotA",
  path: "SearchTimeline",
  status: "idle",
  consecutiveErrors: 2,
  cooldownUntil: null,
  searchTimelineOpHash: "S1",
  tweetDetailOpHash: null,
  createTweetOpHash: null,
  cookie: "SECRET", csrfToken: "SECRET", authorization: "SECRET",
};

describe("BotSessionRepo.healthFor", () => {
  it("returns a slim shape with NO secrets", async () => {
    const repo = makeRepo([ROW]);
    const out = await repo.healthFor();
    expect(out[0]).not.toHaveProperty("cookie");
    expect(out[0]).not.toHaveProperty("csrfToken");
    expect(out[0]).not.toHaveProperty("authorization");
    expect(out[0].userName).toBe("BotA");
  });

  it("needsRelogin only when status is auth_failed", async () => {
    const repo = makeRepo([
      { ...ROW, status: "idle" },
      { ...ROW, userName: "BotB", status: "auth_failed" },
    ]);
    const out = await repo.healthFor();
    expect(out.find((r) => r.userName === "BotA")!.needsRelogin).toBe(false);
    expect(out.find((r) => r.userName === "BotB")!.needsRelogin).toBe(true);
  });

  it("needsSearchHash when the search hash is null", async () => {
    const repo = makeRepo([{ ...ROW, searchTimelineOpHash: null }]);
    const out = await repo.healthFor();
    expect(out[0].needsSearchHash).toBe(true);
  });

  it("filters by handles case-insensitively", async () => {
    const repo = makeRepo([ROW, { ...ROW, userName: "BotB" }]);
    const out = await repo.healthFor(["bota"]);
    expect(out).toHaveLength(1);
    expect(out[0].userName).toBe("BotA");
  });
});
