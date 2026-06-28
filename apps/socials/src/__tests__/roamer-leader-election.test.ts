import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RoamerService } from "../platforms/twitter/roamer/roamer.service.js";

// Small, safe numeric config. emptyPollMs is huge so the idle loop sleeps
// (and never spins) once runWindow returns. The supervisor cadence is
// max(5000, heartbeatStaleMs/2) = 5000ms; tests drive it with fake timers.
const CFG: Record<string, number> = {
  ROAM_WINDOW_MS: 1000,
  ROAM_COOLDOWN_MS: 1000,
  ROAM_RATE_LIMIT_COOLDOWN_MS: 1000,
  ROAM_RATE_LIMIT_ALERT_MS: 1000,
  ROAM_HEARTBEAT_MS: 1000,
  ROAM_HEARTBEAT_STALE_MS: 100,
  ROAM_EMPTY_POLL_MS: 10_000_000,
  ROAM_DAILY_SUMMARY_MS: 10_000_000,
  ROAM_PRUNE_INTERVAL_MS: 10_000_000,
  ROAM_TWEET_SEEN_TTL_DAYS: 30,
};

function makeService(claim: ReturnType<typeof vi.fn>) {
  const config = { get: (k: string) => CFG[k] } as any;

  const sessions = {
    healthCounts: vi
      .fn()
      .mockResolvedValue({ idle: 0, working: 0, auth_failed: 0 }),
    claimRandomIdle: vi.fn().mockResolvedValue(null),
    claimableCount: vi.fn().mockResolvedValue(0),
  } as any;

  const topics = {
    // null → runWindow idles immediately (sleeps emptyPollMs), no heavy work.
    pickStale: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    enabledCount: vi.fn().mockResolvedValue(0),
  } as any;

  const tweets = {} as any;
  const runs = {} as any;

  const release = vi.fn().mockResolvedValue(undefined);
  const state = {
    claim,
    heartbeat: vi.fn().mockResolvedValue(undefined),
    release,
    // null → runWindow's no-topics alert branch is skipped.
    get: vi.fn().mockResolvedValue(null),
    setAlertNoSessions: vi.fn().mockResolvedValue(undefined),
    setAlertNoTopics: vi.fn().mockResolvedValue(undefined),
  } as any;

  const search = {} as any;
  const classifier = {} as any;
  const telegram = { notify: vi.fn().mockResolvedValue(undefined) } as any;

  const svc = new RoamerService(
    config,
    sessions,
    topics,
    tweets,
    runs,
    state,
    search,
    classifier,
    telegram,
  );

  return { svc, state, release };
}

describe("RoamerService leader election (self-healing supervisor)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("retries claim and acquires leadership when the old owner releases", async () => {
    // First claim fails (old node still owns w/ fresh heartbeat), then succeeds.
    const claim = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    const { svc, state } = makeService(claim);

    await svc.onModuleInit();

    // Initial acquire attempt happened and failed.
    expect(state.claim).toHaveBeenCalled();
    const callsAfterInit = state.claim.mock.calls.length;

    // Drive the supervisor through several retry ticks. The cadence is
    // max(5000, heartbeatStaleMs/2) = 5000ms, so advance well past it.
    await vi.advanceTimersByTimeAsync(20_000);

    // It retried.
    expect(state.claim.mock.calls.length).toBeGreaterThan(callsAfterInit);
    expect(state.claim.mock.calls.length).toBeGreaterThan(1);

    // And it now owns the loop.
    const status = await svc.status();
    expect(status.running).toBe(true);
    expect(status.owns).toBe(true);

    await svc.stop();
  });

  it("does not re-acquire after a manual stop (desired=false)", async () => {
    const claim = vi.fn().mockResolvedValue(true);
    const { svc, state, release } = makeService(claim);

    await svc.onModuleInit();
    // Let the loop settle.
    await vi.advanceTimersByTimeAsync(0);

    expect((await svc.status()).owns).toBe(true);

    await svc.stop();
    expect(release).toHaveBeenCalled();

    const callsAfterStop = state.claim.mock.calls.length;

    // Advance well past several supervisor intervals (cadence is 5000ms).
    await vi.advanceTimersByTimeAsync(20_000);

    // Supervisor must NOT re-acquire after a manual stop.
    expect(state.claim.mock.calls.length).toBe(callsAfterStop);
    expect((await svc.status()).owns).toBe(false);
  });
});
