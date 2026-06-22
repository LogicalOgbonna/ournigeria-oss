import { describe, it, expect, vi, beforeEach } from "vitest";
import { XOauthService, XOauthError } from "../platforms/twitter/x-oauth.service.js";

function createMockTokens() {
  return {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
}

const config = {
  get: (k: string) =>
    ({
      X_OAUTH2_CLIENT_ID: "cid",
      X_OAUTH2_CLIENT_SECRET: "secret",
      X_OAUTH2_REDIRECT_URI: "http://localhost:3005/v1/x-oauth/callback",
      SOCIALS_DASHBOARD_URL: "http://localhost:3004/dashboard/social",
    })[k],
};

/**
 * Test subclass: replaces the three X-SDK seams with deterministic fakes so we
 * exercise the real state-machine (store / validate / prune / persist) without
 * the network. `linkState` lets a test control the state value handed out.
 */
class TestXOauthService extends XOauthService {
  linkState = "state-1";
  exchangeImpl: (code: string, verifier: string) => Promise<{ accessToken: string; refreshToken?: string }> =
    async () => ({ accessToken: "AT", refreshToken: "RT" });
  fetchUsernameImpl: (token: string) => Promise<string> = async () => "awanigeria";

  protected makeAuthLink() {
    return {
      url: `https://twitter.com/i/oauth2/authorize?state=${this.linkState}`,
      codeVerifier: `verifier-for-${this.linkState}`,
      state: this.linkState,
    };
  }
  protected exchangeCode(code: string, verifier: string) {
    return this.exchangeImpl(code, verifier);
  }
  protected fetchUsername(token: string) {
    return this.fetchUsernameImpl(token);
  }
}

describe("XOauthService", () => {
  let tokens: ReturnType<typeof createMockTokens>;
  let svc: TestXOauthService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    tokens = createMockTokens();
    svc = new TestXOauthService(config as any, tokens as any);
  });

  it("startAuthorization returns a url and registers exactly one pending state", () => {
    const { url } = svc.startAuthorization();
    expect(url).toContain("oauth2/authorize");
    // completing with the issued state must succeed (proves it was stored)
    expect((svc as any).pending.size).toBe(1);
  });

  it("completeAuthorization rejects an unknown state", async () => {
    await expect(svc.completeAuthorization("code", "nope")).rejects.toBeInstanceOf(
      XOauthError,
    );
    expect(tokens.save).not.toHaveBeenCalled();
  });

  it("completeAuthorization rejects (and prunes) an expired state", async () => {
    vi.useFakeTimers();
    svc.startAuthorization(); // state-1, expires in 10 min
    vi.advanceTimersByTime(11 * 60 * 1000);
    await expect(svc.completeAuthorization("code", "state-1")).rejects.toMatchObject({
      reason: "invalid_or_expired_state",
    });
    expect(tokens.save).not.toHaveBeenCalled();
    expect((svc as any).pending.size).toBe(0);
  });

  it("happy path: exchanges, fetches handle, persists pair+username, clears pending", async () => {
    svc.startAuthorization(); // state-1
    const out = await svc.completeAuthorization("the-code", "state-1");
    expect(out.username).toBe("awanigeria");
    expect(tokens.save).toHaveBeenCalledWith({
      accessToken: "AT",
      refreshToken: "RT",
      username: "awanigeria",
    });
    expect((svc as any).pending.size).toBe(0);
  });

  it("persists the token pair even when the handle fetch fails (no re-consent needed)", async () => {
    // The code is single-use and already exchanged here — a transient v2.me()
    // failure must NOT discard the valid connection.
    svc.fetchUsernameImpl = async () => {
      throw new Error("rate limited");
    };
    svc.startAuthorization(); // state-1
    const out = await svc.completeAuthorization("the-code", "state-1");
    expect(out.username).toBe("");
    // tokens saved before the handle fetch, with no username overwrite
    expect(tokens.save).toHaveBeenCalledWith({
      accessToken: "AT",
      refreshToken: "RT",
    });
    expect(tokens.save).toHaveBeenCalledTimes(1);
    expect((svc as any).pending.size).toBe(0);
  });

  it("rejects when X returns no refresh token (missing offline.access)", async () => {
    svc.exchangeImpl = async () => ({ accessToken: "AT" }); // no refreshToken
    svc.startAuthorization();
    await expect(svc.completeAuthorization("c", "state-1")).rejects.toMatchObject({
      reason: "no_refresh_token",
    });
    expect(tokens.save).not.toHaveBeenCalled();
  });

  it("maps an exchange throw to exchange_failed", async () => {
    svc.exchangeImpl = async () => {
      throw new Error("code already used");
    };
    svc.startAuthorization();
    await expect(svc.completeAuthorization("c", "state-1")).rejects.toMatchObject({
      reason: "exchange_failed",
    });
  });

  it("getStatus reflects repo load", async () => {
    tokens.load.mockResolvedValueOnce(null);
    expect(await svc.getStatus()).toEqual({
      connected: false,
      username: null,
      rotatedAt: null,
    });

    const rotatedAt = new Date("2026-06-20T00:00:00Z");
    tokens.load.mockResolvedValueOnce({
      accessToken: "AT",
      refreshToken: "RT",
      username: "awanigeria",
      rotatedAt,
    });
    expect(await svc.getStatus()).toEqual({
      connected: true,
      username: "awanigeria",
      rotatedAt,
    });
  });

  it("disconnect clears the token row", async () => {
    await svc.disconnect();
    expect(tokens.clear).toHaveBeenCalledOnce();
  });

  it("dashboardReturn appends status params to the dashboard url", () => {
    expect(svc.dashboardReturn({ x_connected: "awanigeria" })).toBe(
      "http://localhost:3004/dashboard/social?x_connected=awanigeria",
    );
  });
});
