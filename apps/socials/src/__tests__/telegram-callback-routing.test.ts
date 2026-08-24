import { describe, it, expect, vi } from "vitest";
import { routeCallback, extractTweetId } from "../telegram-relay/telegram-post-callback.service.js";

function deps() {
  return {
    replyQueue: { markPosted: vi.fn().mockResolvedValue({}), reject: vi.fn().mockResolvedValue({}) },
    prisma: { socialPost: {
      findUnique: vi.fn().mockResolvedValue({ id: "p1", status: "drafted",
        telegramPostChatId: "c1", telegramPostMessageId: "m1" }),
      update: vi.fn().mockResolvedValue({}),
    } },
    reconciler: { reconcile: vi.fn().mockResolvedValue("verified") },
    bot: { editCard: vi.fn(), answer: vi.fn() },
    systemAdminId: "sys", self: { selfHandle: "bot", selfRestId: "42" },
  };
}

describe("extractTweetId", () => {
  it("pulls the status id from an x.com/twitter.com url", () => {
    expect(extractTweetId("done https://x.com/ournigeria/status/1899?s=20")).toBe("1899");
    expect(extractTweetId("https://twitter.com/x/status/42")).toBe("42");
    expect(extractTweetId("no url here")).toBeNull();
  });
});

describe("routeCallback", () => {
  it("posted → markPosted + reconcile + answer", async () => {
    const d = deps();
    await routeCallback({ data: "posted:p1", from: "@dan", id: "cq1" }, d as any);
    expect(d.replyQueue.markPosted).toHaveBeenCalledWith("p1", "sys", undefined, "@dan");
    expect(d.reconciler.reconcile).toHaveBeenCalledWith("p1", d.self);
    expect(d.bot.answer).toHaveBeenCalledWith("cq1");
  });
  it("no-ops on an already-published row (cross-surface guard) but still answers", async () => {
    const d = deps();
    d.prisma.socialPost.findUnique.mockResolvedValue({ id: "p1", status: "published" });
    await routeCallback({ data: "posted:p1", from: "@dan", id: "cq1" }, d as any);
    expect(d.replyQueue.markPosted).not.toHaveBeenCalled();
    expect(d.bot.answer).toHaveBeenCalled();
  });
  it("reject → reject()", async () => {
    const d = deps();
    await routeCallback({ data: "reject:p1", from: "@dan", id: "cq1" }, d as any);
    expect(d.replyQueue.reject).toHaveBeenCalledWith("p1", "sys", "@dan");
  });
  it("claim → stamps claimedBy, does not post", async () => {
    const d = deps();
    await routeCallback({ data: "claim:p1", from: "@dan", id: "cq1" }, d as any);
    expect(d.prisma.socialPost.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ telegramClaimedBy: "@dan" }),
    }));
    expect(d.replyQueue.markPosted).not.toHaveBeenCalled();
  });
});
