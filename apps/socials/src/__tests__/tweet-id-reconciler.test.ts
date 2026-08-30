import { describe, it, expect, vi } from "vitest";
import { TweetIdReconciler } from "../telegram-relay/tweet-id-reconciler.service.js";

function make() {
  const socialPost = {
    findUnique: vi.fn().mockResolvedValue({
      id: "p1", content: "Kano budget up 12%", postType: "reply",
      inReplyToId: "555", quotedTweetId: null,
      dispatchedAt: new Date("2026-08-17T09:59:00Z"), status: "published",
      telegramPostChatId: "-5405315813", telegramPostMessageId: "42", telegramActor: "@dan",
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
  const bot = { editCard: vi.fn().mockResolvedValue(undefined) };
  const config = { get: (k: string) => (k === "SOCIALS_RECONCILE_MAX_TRIES" ? 5 : 15000) };
  const r = new TweetIdReconciler(
    { socialPost } as any, sessions as any, reader as any, bot as any, config as any,
  );
  return { r, socialPost, sessions, reader, bot };
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

  it("edits the card to the verified result (no more permanent 'reconciling…')", async () => {
    const { r, bot } = make();
    await r.reconcile("p1", { selfHandle: "awanigeria", selfRestId: "42" }, async () => {});
    expect(bot.editCard).toHaveBeenCalledTimes(1);
    const [chatId, messageId, text] = bot.editCard.mock.calls[0];
    expect(chatId).toBe("-5405315813");
    expect(messageId).toBe("42");
    expect(text).toContain("verified");
    expect(text).toContain("https://x.com/awanigeria/status/T9");
  });

  it("marks unverified when no session carries a UserTweets hash, and edits the card to prompt paste-URL", async () => {
    const { r, socialPost, sessions, bot } = make();
    sessions.pickForReadByHandle.mockResolvedValue(null);
    const res = await r.reconcile("p1", { selfHandle: "bot", selfRestId: "42" }, async () => {});
    expect(res).toBe("unverified");
    expect(socialPost.update.mock.calls.at(-1)[0].data.reconcileStatus).toBe("unverified");
    const [, , text] = bot.editCard.mock.calls[0];
    expect(text).toContain("reply to this card with the tweet URL");
  });

  it("does not touch the card when the row was never carded", async () => {
    const { r, socialPost, bot } = make();
    socialPost.findUnique.mockResolvedValue({
      id: "p1", content: "x", postType: "reply", inReplyToId: null, quotedTweetId: null,
      dispatchedAt: new Date("2026-08-17T09:59:00Z"),
      telegramPostChatId: null, telegramPostMessageId: null, telegramActor: null,
    });
    await r.reconcile("p1", { selfHandle: "bot", selfRestId: "42" }, async () => {});
    expect(bot.editCard).not.toHaveBeenCalled();
  });
});
