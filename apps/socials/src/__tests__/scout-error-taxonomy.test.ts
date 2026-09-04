import { describe, it, expect, vi } from "vitest";
import { ScoutService } from "../platforms/twitter/scout/scout.service.js";
import {
  FetchAuthError,
  FetchRateLimitError,
  type RawTweet,
} from "../platforms/twitter/roamer/twitter-search.service.js";

const CFG: Record<string, number> = {
  SOCIALS_SCOUT_WINDOW_MS: 60_000,
  SOCIALS_SCOUT_MAX_CLASSIFY: 40,
  SOCIALS_SCOUT_MIN_CONFIDENCE: 0.6,
  SOCIALS_SCOUT_MAX_PAGES_PER_QUERY: 1,
  SOCIALS_SCOUT_MAX_AGE_DAYS: 30,
};

function rawTweet(over: Partial<RawTweet>): RawTweet {
  return {
    id: "t1",
    text: "Proud Kano indigene",
    lang: "en",
    replyCount: 0,
    quoteCount: 0,
    retweetCount: 0,
    likeCount: 0,
    isQuote: false,
    isReply: false,
    isRetweet: false,
    inReplyToId: null,
    conversationId: null,
    quotedText: null,
    quotedAuthorHandle: null,
    tweetCreatedAt: new Date(),
    authorRestId: "u1",
    authorScreenName: "ada_ng",
    authorName: "Ada",
    authorBio: "Kano based",
    authorFollowers: 1200,
    authorProfileImageUrl: null,
    authorLocation: "Kano, Nigeria",
    ...over,
  };
}

function makeService(opts: { tweets: RawTweet[]; maxClassify?: number }) {
  const config = {
    get: (k: string) =>
      k === "SOCIALS_SCOUT_MAX_CLASSIFY" && opts.maxClassify !== undefined
        ? opts.maxClassify
        : CFG[k],
  } as any;
  const runRow = { id: "run1", windowDate: new Date(), windowHour: 8 };
  const prisma = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRawUnsafe: vi
      .fn()
      .mockResolvedValue([{ state_code: "kano", name: "Kano" }]),
    socialsScoutRun: {
      findUnique: vi.fn().mockResolvedValue(runRow),
      findUniqueOrThrow: vi.fn().mockResolvedValue(runRow),
      update: vi.fn().mockResolvedValue(runRow),
    },
    socialsScoutState: { update: vi.fn().mockResolvedValue({}) },
    nigerianLga: { findMany: vi.fn().mockResolvedValue([]) },
    nigerianState: {
      findMany: vi.fn().mockResolvedValue([{ code: "kano" }]),
    },
  } as any;
  const sessions = {
    claimRandomIdle: vi.fn().mockResolvedValue({
      id: "s1",
      userName: "bot1",
      searchTimelineOpHash: "hash",
    }),
    reapStuckWorking: vi.fn().mockResolvedValue(0),
    release: vi.fn().mockResolvedValue(undefined),
    markAuthFailed: vi.fn().mockResolvedValue(undefined),
    markRateLimited: vi.fn().mockResolvedValue(undefined),
  } as any;
  const search = {
    fetchSearchTimelinePage: vi.fn().mockResolvedValue({
      tweets: opts.tweets,
      nextCursor: null,
      oldestTweetAt: null,
    }),
  } as any;
  const classifier = {
    classify: vi.fn().mockResolvedValue({
      isNigerian: true,
      stateSlug: "kano",
      lgaName: null,
      wardName: null,
      confidence: 0.8,
      evidence: "bio says Kano",
    }),
  } as any;
  const handles = {
    knownRestIds: vi.fn().mockResolvedValue(new Set()),
    refreshSighting: vi.fn().mockResolvedValue(undefined),
    store: vi.fn().mockResolvedValue({}),
    resolveLgaCode: vi.fn().mockResolvedValue(null),
    resolveWardCode: vi.fn().mockResolvedValue(null),
    countsByState: vi.fn().mockResolvedValue([]),
  } as any;
  const settings = { getScoutEnabled: vi.fn().mockResolvedValue(true) } as any;
  const telegram = { notify: vi.fn().mockResolvedValue(undefined) } as any;

  const svc = new ScoutService(
    config,
    prisma,
    sessions,
    search,
    classifier,
    handles,
    settings,
    telegram,
  );
  return { svc, prisma, sessions, search, classifier, handles, telegram };
}

/** stopReason recorded on the run's finish update. */
function finishedReason(prisma: any): string | undefined {
  const finish = prisma.socialsScoutRun.update.mock.calls.find(
    (c: any[]) => c[0]?.data?.stopReason,
  );
  return finish?.[0].data.stopReason;
}

describe("ScoutService window error taxonomy", () => {
  it("marks the session auth-failed, alerts Telegram, and does not double-release", async () => {
    const { svc, prisma, sessions, search, telegram } = makeService({
      tweets: [],
    });
    search.fetchSearchTimelinePage.mockRejectedValue(
      new FetchAuthError(401, "401 from SearchTimeline"),
    );
    await svc.runNow();
    expect(sessions.markAuthFailed).toHaveBeenCalledWith(
      "s1",
      "401 from SearchTimeline",
    );
    // markAuthFailed already parked the session; a release on top would
    // clobber the auth-failed state with a 60s cooldown.
    expect(sessions.release).not.toHaveBeenCalled();
    expect(telegram.notify).toHaveBeenCalledWith(
      expect.stringContaining("bot1"),
    );
    expect(finishedReason(prisma)).toBe("auth_failed");
  });

  it("cools the session down for retry-after on a rate limit", async () => {
    const { svc, prisma, sessions, search } = makeService({ tweets: [] });
    search.fetchSearchTimelinePage.mockRejectedValue(
      new FetchRateLimitError(120, "429 from SearchTimeline"),
    );
    await svc.runNow();
    expect(sessions.markRateLimited).toHaveBeenCalledWith(
      "s1",
      120_000,
      "429 from SearchTimeline",
    );
    expect(sessions.release).not.toHaveBeenCalled();
    expect(finishedReason(prisma)).toBe("rate_limited");
  });

  it("stops at the classify cap and records classify_cap", async () => {
    const { svc, prisma, classifier, handles } = makeService({
      tweets: [
        rawTweet({ id: "t1", authorRestId: "u1", authorScreenName: "a1" }),
        rawTweet({ id: "t2", authorRestId: "u2", authorScreenName: "a2" }),
        rawTweet({ id: "t3", authorRestId: "u3", authorScreenName: "a3" }),
      ],
      maxClassify: 1,
    });
    await svc.runNow();
    expect(classifier.classify).toHaveBeenCalledTimes(1);
    expect(handles.store).toHaveBeenCalledTimes(1);
    expect(finishedReason(prisma)).toBe("classify_cap");
  });
});
