import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionHealthService } from "../platforms/twitter/roamer/session-health.service.js";
import {
  FetchAuthError,
  FetchRateLimitError,
} from "../platforms/twitter/roamer/twitter-search.service.js";

// Proactive detector: independent of the roamer's leader-election loop (which
// dies after blue/green deploys), a periodic sweep probes each idle session
// against X. A 401/403 => the cookies expired => mark auth_failed + alert ops
// the moment it dies. A 429 => the session is ALIVE, just throttled => back off,
// never mark dead, never alert.

const CFG: Record<string, number> = {
  SOCIALS_SESSION_HEALTH_INTERVAL_MS: 900_000,
  ROAM_RATE_LIMIT_COOLDOWN_MS: 1_800_000,
};

function session(id: string, userName: string) {
  return { id, userName, searchTimelineOpHash: `hash-${id}` } as any;
}

function makeService(opts: {
  probeable: any[];
  fetchImpl: (sessionId: string) => Promise<any>;
}) {
  const config = { get: (k: string) => CFG[k] } as any;
  const sessions = {
    listHealthProbeable: vi.fn().mockResolvedValue(opts.probeable),
    markAuthFailed: vi.fn().mockResolvedValue(undefined),
    markRateLimited: vi.fn().mockResolvedValue(undefined),
  } as any;
  const search = {
    fetchSearchTimelinePage: vi
      .fn()
      .mockImplementation((o: { sessionId: string }) =>
        opts.fetchImpl(o.sessionId),
      ),
  } as any;
  const telegram = { notify: vi.fn().mockResolvedValue(undefined) } as any;

  const svc = new SessionHealthService(config, sessions, search, telegram);
  return { svc, sessions, search, telegram };
}

describe("SessionHealthService.checkAll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks expired sessions auth_failed and alerts, leaves live ones alone", async () => {
    const alive = session("a", "alive_bot");
    const dead = session("d", "dead_bot");
    const { svc, sessions, telegram } = makeService({
      probeable: [alive, dead],
      fetchImpl: (id) => {
        if (id === "d") throw new FetchAuthError(403, "auth failed (403)");
        return Promise.resolve({ tweets: [], oldestTweetAt: null, nextCursor: null });
      },
    });

    const res = await svc.checkAll();

    expect(res).toEqual({ probed: 2, expired: 1 });
    expect(sessions.markAuthFailed).toHaveBeenCalledTimes(1);
    expect(sessions.markAuthFailed).toHaveBeenCalledWith(
      "d",
      expect.stringContaining("403"),
    );
    expect(telegram.notify).toHaveBeenCalledTimes(1);
    expect(telegram.notify.mock.calls[0][0]).toContain("dead_bot");
  });

  it("treats a 429 as alive: backs off, never marks dead, never alerts", async () => {
    const throttled = session("t", "throttled_bot");
    const { svc, sessions, telegram } = makeService({
      probeable: [throttled],
      fetchImpl: () => {
        throw new FetchRateLimitError(120, "rate limited (429)");
      },
    });

    const res = await svc.checkAll();

    expect(res).toEqual({ probed: 1, expired: 0 });
    expect(sessions.markAuthFailed).not.toHaveBeenCalled();
    expect(sessions.markRateLimited).toHaveBeenCalledTimes(1);
    expect(telegram.notify).not.toHaveBeenCalled();
  });

  it("does nothing when there are no probeable sessions", async () => {
    const { svc, sessions, telegram } = makeService({
      probeable: [],
      fetchImpl: () => Promise.resolve({ tweets: [] }),
    });

    const res = await svc.checkAll();

    expect(res).toEqual({ probed: 0, expired: 0 });
    expect(sessions.markAuthFailed).not.toHaveBeenCalled();
    expect(telegram.notify).not.toHaveBeenCalled();
  });
});
