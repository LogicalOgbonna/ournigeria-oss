import { describe, expect, it, vi } from "vitest";
import { DraftDigestNotifierService } from "../scheduler/draft-digest-notifier.service.js";

// 13:00 WAT — inside the active window, so digests send.
const DAYTIME = new Date("2026-07-11T12:00:00Z");
// 04:00 WAT — inside the quiet window, so digests are suppressed.
const QUIET = new Date("2026-07-11T03:00:00Z");

function makeService(drafts: any[]) {
  const prisma = {
    $queryRaw: vi.fn().mockResolvedValue(drafts),
    socialPost: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  } as any;
  const telegram = {
    notify: vi.fn().mockResolvedValue(true),
  } as any;
  const config = {
    get: vi
      .fn()
      .mockReturnValue("https://spending-dashboard.arinze.online/dashboard/social"),
  } as any;
  return {
    svc: new DraftDigestNotifierService(prisma, telegram, config),
    prisma,
    telegram,
  };
}

describe("DraftDigestNotifierService", () => {
  it("claims unnotified drafts and sends one Telegram digest", async () => {
    const { svc, telegram } = makeService([
      {
        id: "11111111-1111-1111-1111-111111111111",
        post_type: "reply",
        content: "Please verify this councillor seat.",
        review_status: "recommended",
        agent_confidence: 0.92,
        in_reply_to_user: "citizen",
        in_reply_to_id: "1900000000000000001",
        quoted_tweet_id: null,
        trigger_topic: "ward seat",
        source: "roam",
        created_at: new Date("2026-07-11T00:00:00Z"),
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        post_type: "quote",
        content: "This allocation needs local accountability.",
        review_status: "pending",
        agent_confidence: 0.7,
        in_reply_to_user: null,
        in_reply_to_id: null,
        quoted_tweet_id: "1900000000000000002",
        trigger_topic: "faac",
        source: "roam",
        created_at: new Date("2026-07-11T00:01:00Z"),
      },
    ]);

    await expect(svc.execute(DAYTIME)).resolves.toEqual({ notified: 2 });

    expect(telegram.notify).toHaveBeenCalledTimes(1);
    const message = telegram.notify.mock.calls[0][0] as string;
    expect(message).toContain("2 X drafts are ready for review");
    expect(message).toContain("1 recommended");
    expect(message).toContain("@citizen");
    expect(message).toContain("Open the dashboard queue");
  });

  it("includes a one-tap Post on X intent link per draft", async () => {
    const { svc, telegram } = makeService([
      {
        id: "11111111-1111-1111-1111-111111111111",
        post_type: "reply",
        content: "Verify this seat.",
        review_status: "recommended",
        agent_confidence: 0.92,
        in_reply_to_user: "citizen",
        in_reply_to_id: "1900000000000000001",
        quoted_tweet_id: null,
        trigger_topic: "ward seat",
        source: "roam",
        created_at: new Date("2026-07-11T00:00:00Z"),
      },
    ]);

    await svc.execute(DAYTIME);

    const message = telegram.notify.mock.calls[0][0] as string;
    // reply intent must carry the parent tweet id so the reply threads correctly
    expect(message).toContain("x.com/intent/tweet");
    expect(message).toContain("in_reply_to=1900000000000000001");
    expect(message).toContain("Post on X");
  });

  it("suppresses the digest during quiet hours (does not touch the DB)", async () => {
    const { svc, prisma, telegram } = makeService([
      {
        id: "11111111-1111-1111-1111-111111111111",
        post_type: "reply",
        content: "Verify this seat.",
        review_status: "recommended",
        agent_confidence: 0.92,
        in_reply_to_user: "citizen",
        in_reply_to_id: "1900000000000000001",
        quoted_tweet_id: null,
        trigger_topic: "ward seat",
        source: "roam",
        created_at: new Date("2026-07-11T00:00:00Z"),
      },
    ]);

    await expect(svc.execute(QUIET)).resolves.toEqual({ notified: 0 });

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(telegram.notify).not.toHaveBeenCalled();
  });

  it("does not notify when there are no newly claimed drafts", async () => {
    const { svc, telegram } = makeService([]);

    await expect(svc.execute(DAYTIME)).resolves.toEqual({ notified: 0 });

    expect(telegram.notify).not.toHaveBeenCalled();
  });

  it("releases claimed drafts when Telegram delivery fails", async () => {
    const { svc, prisma, telegram } = makeService([
      {
        id: "11111111-1111-1111-1111-111111111111",
        post_type: "reply",
        content: "Please verify this councillor seat.",
        review_status: "recommended",
        agent_confidence: 0.92,
        in_reply_to_user: "citizen",
        in_reply_to_id: "1900000000000000001",
        quoted_tweet_id: null,
        trigger_topic: "ward seat",
        source: "roam",
        created_at: new Date("2026-07-11T00:00:00Z"),
      },
    ]);
    telegram.notify.mockResolvedValue(false);

    await expect(svc.execute(DAYTIME)).resolves.toEqual({ notified: 0 });

    expect(prisma.socialPost.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["11111111-1111-1111-1111-111111111111"] },
        status: "drafted",
        reviewStatus: { in: ["pending", "recommended"] },
      },
      data: { telegramNotifiedAt: null },
    });
  });
});
