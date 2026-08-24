import { describe, it, expect, vi } from "vitest";
import { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";

describe("saveCapture userTweetsOpHash", () => {
  it("writes user_tweets hash on a material refresh without nulling search hash", async () => {
    const existing = { id: "s1", status: "idle", searchTimelineOpHash: "S", userTweetsOpHash: null };
    const update = vi.fn().mockResolvedValue({});
    const prisma = { socialsBotSession: {
      findUnique: vi.fn().mockResolvedValue(existing), update, create: vi.fn(),
    } } as any;
    const repo = new BotSessionRepo(prisma);
    await repo.saveCapture({
      userName: "bot", path: "SearchTimeline", cookie: "c", csrfToken: "x",
      authorization: "a", xClientTransactionId: "t", xClientUuid: "u",
      userTweetsOpHash: "UT",
    });
    const data = update.mock.calls[0][0].data;
    expect(data.userTweetsOpHash).toBe("UT");
    expect(data.searchTimelineOpHash).toBeUndefined(); // preserve-on-partial
  });
});
