import { describe, it, expect, vi } from "vitest";
import { TweetIdReconciler } from "../telegram-relay/tweet-id-reconciler.service.js";

function make() {
  const socialPost = {
    findUnique: vi.fn().mockResolvedValue({
      id: "p1", content: "Kano budget up 12%", postType: "reply",
      inReplyToId: "555", quotedTweetId: null,
      dispatchedAt: new Date("2026-08-17T09:59:00Z"), status: "published",
    }),
    update: vi.fn().mockResolvedValue({}),
  };
  const sessions = {
    pickForReadByHandle: vi.fn().mockResolvedValue({ id: "s1", userTweetsOpHash: "UT" }),
  };
  const reader = { fetchUserTweets: vi.fn().mockResolvedValue([
    { id: "T9", text: "Kano budget up 12%", createdAt: new Date("2026-08-17T10:00:00Z"),
      inReplyToId: "555", isQuote: false },
  ]) };
  const config = { get: (k: string) => (k === "SOCIALS_RECONCILE_MAX_TRIES" ? 5 : 15000) };
  const r = new TweetIdReconciler({ socialPost } as any, sessions as any, reader as any, config as any);
  return { r, socialPost, sessions, reader };
}

describe("TweetIdReconciler", () => {
  it("back-fills externalId + reconcile_status=verified on match, never touching status/publishedAt", async () => {
    const { r, socialPost } = make();
    const res = await r.reconcile("p1", { selfHandle: "bot", selfRestId: "42" }, async () => {});
    expect(res).toBe("verified");
    const data = socialPost.update.mock.calls[0][0].data;
    expect(data.externalId).toBe("T9");
    expect(data.reconcileStatus).toBe("verified");
    expect(data.status).toBeUndefined();
    expect(data.publishedAt).toBeUndefined();
  });

  it("marks unverified when no session carries a UserTweets hash", async () => {
    const { r, socialPost, sessions } = make();
    sessions.pickForReadByHandle.mockResolvedValue(null);
    const res = await r.reconcile("p1", { selfHandle: "bot", selfRestId: "42" }, async () => {});
    expect(res).toBe("unverified");
    expect(socialPost.update.mock.calls.at(-1)[0].data.reconcileStatus).toBe("unverified");
  });
});
