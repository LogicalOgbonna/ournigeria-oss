import { describe, it, expect, vi } from "vitest";
import { ScoutService } from "../platforms/twitter/scout/scout.service.js";
import type { RawTweet } from "../platforms/twitter/roamer/twitter-search.service.js";

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
    ...over,
  };
}

function makeService(opts: {
  tweets: RawTweet[];
  knownRestIds?: string[];
  geo?: unknown;
}) {
  const config = { get: (k: string) => CFG[k] } as any;
  const runRow = { id: "run1", windowDate: new Date(), windowHour: 8 };
  const prisma = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRawUnsafe: vi
      .fn()
      .mockResolvedValue([{ state_code: "kano", name: "Kano" }]),
    socialsScoutRun: {
      findUnique: vi.fn().mockResolvedValue(runRow),
      findUniqueOrThrow: vi.fn().mockResolvedValue({ ...runRow, stopReason: "window_elapsed" }),
      update: vi.fn().mockResolvedValue(runRow),
    },
    socialsScoutState: { update: vi.fn().mockResolvedValue({}) },
    nigerianLga: { findMany: vi.fn().mockResolvedValue([]) },
    nigerianState: {
      findMany: vi.fn().mockResolvedValue([{ code: "kano" }, { code: "lagos" }]),
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
  } as any;
  const search = {
    fetchSearchTimelinePage: vi.fn().mockResolvedValue({
      tweets: opts.tweets,
      nextCursor: null,
      oldestTweetAt: null,
    }),
  } as any;
  const classifier = {
    classify: vi.fn().mockResolvedValue(
      opts.geo ?? {
        isNigerian: true,
        stateSlug: "kano",
        lgaName: null,
        wardName: null,
        confidence: 0.8,
        evidence: "bio says Kano",
      },
    ),
  } as any;
  const handles = {
    knownRestIds: vi
      .fn()
      .mockResolvedValue(new Set(opts.knownRestIds ?? [])),
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
  return { svc, prisma, sessions, classifier, handles };
}

describe("ScoutService window", () => {
  it("classifies a fresh author and stores a confident state attribution", async () => {
    const { svc, handles, sessions } = makeService({
      tweets: [rawTweet({})],
    });
    const result = await svc.runNow();
    expect(result.claimed).toBe(true);
    expect(handles.store).toHaveBeenCalledWith(
      expect.objectContaining({
        restId: "u1",
        handle: "ada_ng",
        stateCode: "kano",
        confidence: 0.8,
        // Human-in-loop: scouted rows are NOT taggable until an operator
        // activates them from the dashboard.
        status: "pending",
        // Activity proxy = the discovering tweet's timestamp.
        lastActiveAt: expect.any(Date),
      }),
    );
    expect(sessions.release).toHaveBeenCalled();
  });

  it("skips authors whose latest tweet is older than the recency window", async () => {
    const stale = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days
    const { svc, classifier, handles } = makeService({
      tweets: [rawTweet({ tweetCreatedAt: stale })],
    });
    await svc.runNow();
    // No classify, no store — an inactive account never enters the pool.
    expect(classifier.classify).not.toHaveBeenCalled();
    expect(handles.store).not.toHaveBeenCalled();
  });

  it("leaves the state's rotation stamp untouched when no session is claimable", async () => {
    const { svc, prisma, sessions } = makeService({ tweets: [] });
    sessions.claimRandomIdle.mockResolvedValue(null);
    await svc.runNow();
    // lastRunAt must NOT be stamped — the state did zero work and should stay
    // at the head of the rotation for the next window.
    const stamped = prisma.socialsScoutState.update.mock.calls.some(
      (c: any[]) => c[0]?.data?.lastRunAt,
    );
    expect(stamped).toBe(false);
    const finish = prisma.socialsScoutRun.update.mock.calls.find(
      (c: any[]) => c[0]?.data?.stopReason,
    );
    expect(finish?.[0].data.stopReason).toBe("no_session");
  });

  it("refreshes known authors instead of re-classifying them", async () => {
    const { svc, classifier, handles } = makeService({
      tweets: [rawTweet({})],
      knownRestIds: ["u1"],
    });
    await svc.runNow();
    expect(classifier.classify).not.toHaveBeenCalled();
    expect(handles.refreshSighting).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ handle: "ada_ng" }),
    );
    expect(handles.store).not.toHaveBeenCalled();
  });

  it("drops low-confidence and stateless attributions", async () => {
    const { svc, handles } = makeService({
      tweets: [rawTweet({})],
      geo: {
        isNigerian: true,
        stateSlug: null,
        lgaName: null,
        wardName: null,
        confidence: 0.9,
        evidence: "no state signal",
      },
    });
    await svc.runNow();
    expect(handles.store).not.toHaveBeenCalled();
  });

  it("dedupes authors within a window (one classification per author)", async () => {
    const { svc, classifier } = makeService({
      tweets: [rawTweet({ id: "t1" }), rawTweet({ id: "t2" })],
    });
    await svc.runNow();
    expect(classifier.classify).toHaveBeenCalledTimes(1);
  });

  it("cron does nothing while the scout_enabled setting is off", async () => {
    const { svc, prisma } = makeService({ tweets: [] });
    (svc as any).settings.getScoutEnabled.mockResolvedValue(false);
    await svc.runScheduledWindow();
    // Disabled means NO window claim — the ledger row must not be burned.
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it("does not run when another node owns the window", async () => {
    const { svc, prisma, sessions } = makeService({ tweets: [] });
    prisma.$executeRaw.mockResolvedValue(0); // claim lost
    const result = await svc.runNow();
    expect(result.claimed).toBe(false);
    expect(sessions.claimRandomIdle).not.toHaveBeenCalled();
  });
});
