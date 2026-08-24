import { describe, it, expect, vi, beforeEach } from "vitest";
import { TopicsController } from "../platforms/twitter/controllers/topics.controller.js";
import { FetchAuthError } from "../platforms/twitter/roamer/twitter-search.service.js";

// The dashboard "pull topics" preview (POST /v1/topics/test-query) is the ONLY
// way an operator discovers a dead X session today. Before the fix it threw the
// auth error to the UI but left the session `idle` in the DB and never alerted —
// so nothing was recorded and ops got no signal. These tests lock in that a
// 401/403 during a preview marks the session auth_failed AND fires a Telegram
// alert, and does NOT flip the dead session back to idle.

const SESSION = {
  id: "sess-1",
  userName: "botacct",
  searchTimelineOpHash: "hash123",
} as any;

function makeController(opts: {
  fetchImpl: () => Promise<any>;
}) {
  const topics = {} as any;
  const sessions = {
    claimRandomIdle: vi.fn().mockResolvedValue(SESSION),
    markAuthFailed: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
  } as any;
  const search = {
    fetchSearchTimelinePage: vi.fn().mockImplementation(opts.fetchImpl),
  } as any;
  const telegram = {
    notify: vi.fn().mockResolvedValue(undefined),
  } as any;

  const controller = new TopicsController(topics, sessions, search, telegram);
  return { controller, sessions, search, telegram };
}

describe("TopicsController.testQuery — session expiry detection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks the session auth_failed and alerts ops when X returns 401/403", async () => {
    const { controller, sessions, telegram } = makeController({
      fetchImpl: () => {
        throw new FetchAuthError(401, "auth failed (401)");
      },
    });

    await expect(
      controller.testQuery({ query: "nigeria budget" }),
    ).rejects.toBeInstanceOf(FetchAuthError);

    expect(sessions.markAuthFailed).toHaveBeenCalledTimes(1);
    expect(sessions.markAuthFailed).toHaveBeenCalledWith(
      SESSION.id,
      expect.stringContaining("401"),
    );
    expect(telegram.notify).toHaveBeenCalledTimes(1);
    // A dead session must NOT be released back to idle (that hid the failure).
    expect(sessions.release).not.toHaveBeenCalled();
  });

  it("releases the session (idle) and does not alert on a successful preview", async () => {
    const { controller, sessions, telegram } = makeController({
      fetchImpl: () =>
        Promise.resolve({ tweets: [], oldestTweetAt: null, nextCursor: null }),
    });

    const res = await controller.testQuery({ query: "nigeria budget" });

    expect(res.sessionUserName).toBe(SESSION.userName);
    expect(sessions.markAuthFailed).not.toHaveBeenCalled();
    expect(telegram.notify).not.toHaveBeenCalled();
    expect(sessions.release).toHaveBeenCalledTimes(1);
  });
});
