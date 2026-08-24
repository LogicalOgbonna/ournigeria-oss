import { describe, it, expect, vi } from "vitest";
import { TelegramPostRelayService } from "../telegram-relay/telegram-post-relay.service.js";

function cfg(map: Record<string, any>) {
  return { get: (k: string) => map[k] } as any;
}

describe("TelegramPostRelayService", () => {
  it("no-ops when relay disabled", async () => {
    const prisma = { $queryRaw: vi.fn() } as any;
    const bot = { sendCard: vi.fn() } as any;
    const s = new TelegramPostRelayService(
      prisma,
      bot,
      cfg({ SOCIALS_TELEGRAM_RELAY_ENABLED: false }),
    );
    expect(await s.execute()).toEqual({ carded: 0 });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("cards each claimed draft and records message id", async () => {
    const claimed = [
      {
        id: "p1",
        post_type: "reply",
        content: "hi",
        in_reply_to_id: "5",
        in_reply_to_user: "jack",
        quoted_tweet_id: null,
        agent_confidence: 0.9,
      },
    ];
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue(claimed),
      socialPost: {
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({}),
      },
    } as any;
    const bot = {
      sendCard: vi.fn().mockResolvedValue({ messageId: "m1", chatId: "c1" }),
    } as any;
    const s = new TelegramPostRelayService(
      prisma,
      bot,
      cfg({
        SOCIALS_TELEGRAM_RELAY_ENABLED: true,
        SOCIALS_POST_CHAT_ID: "c1",
        SOCIALS_X_SELF_HANDLE: "ournigeria",
      }),
    );
    const res = await s.execute(new Date("2026-08-17T12:00:00Z")); // noon WAT-ish, active window
    expect(res.carded).toBe(1);
    expect(bot.sendCard).toHaveBeenCalledTimes(1);
    expect(prisma.socialPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: expect.objectContaining({
          telegramPostMessageId: "m1",
          telegramPostChatId: "c1",
        }),
      }),
    );
  });
});
