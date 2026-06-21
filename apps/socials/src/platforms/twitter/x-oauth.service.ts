import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TwitterApi } from "twitter-api-v2";
import type { SocialsEnvConfig } from "../../config/env.validation.js";
import { XTokenRepo } from "./x-token.repo.js";

/** OAuth2 scopes — offline.access is REQUIRED for a rotating refresh token. */
const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

/** How long a started authorization is allowed to sit before completion. */
const PENDING_TTL_MS = 10 * 60 * 1000;

export interface XConnectionStatus {
  connected: boolean;
  username: string | null;
  rotatedAt: Date | null;
}

/** Thrown when the callback can't be matched/exchanged. Message is user-safe. */
export class XOauthError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "XOauthError";
  }
}

interface PendingFlow {
  codeVerifier: string;
  expiresAt: number;
}

/**
 * Drives the dashboard "Connect X account" OAuth2 Authorization-Code + PKCE
 * flow. The socials API owns both ends of the flow (start + callback); the
 * dashboard only kicks it off and reads status.
 *
 * PKCE state lives in an in-memory map (single live instance behind Traefik,
 * seconds-long flow). If the process restarts mid-handshake the admin just
 * clicks Connect again.
 *
 * X SDK calls are isolated in protected methods so the state-machine logic
 * (store / validate / prune / persist) is unit-testable without the network.
 */
@Injectable()
export class XOauthService {
  private readonly logger = new Logger(XOauthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly dashboardUrl: string;
  private readonly pending = new Map<string, PendingFlow>();

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly tokens: XTokenRepo,
  ) {
    this.clientId = config.get("X_OAUTH2_CLIENT_ID")!;
    this.clientSecret = config.get("X_OAUTH2_CLIENT_SECRET")!;
    this.redirectUri = config.get("X_OAUTH2_REDIRECT_URI")!;
    this.dashboardUrl = config.get("SOCIALS_DASHBOARD_URL")!;
  }

  /** Where the callback bounces the browser back to (with a status param). */
  dashboardReturn(params: Record<string, string>): string {
    const u = new URL(this.dashboardUrl);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return u.toString();
  }

  /** Begin a flow: build the X consent URL and stash its PKCE verifier. */
  startAuthorization(): { url: string } {
    this.prune();
    const { url, codeVerifier, state } = this.makeAuthLink();
    this.pending.set(state, {
      codeVerifier,
      expiresAt: Date.now() + PENDING_TTL_MS,
    });
    this.logger.log("started X authorization flow");
    return { url };
  }

  /** Finish a flow: validate state, exchange code, persist the token pair. */
  async completeAuthorization(
    code: string,
    state: string,
  ): Promise<{ username: string }> {
    this.prune();
    const flow = this.pending.get(state);
    if (!flow) throw new XOauthError("invalid_or_expired_state");
    this.pending.delete(state);
    if (flow.expiresAt < Date.now())
      throw new XOauthError("invalid_or_expired_state");

    let pair: { accessToken: string; refreshToken?: string };
    try {
      pair = await this.exchangeCode(code, flow.codeVerifier);
    } catch (err) {
      this.logger.warn(
        `token exchange failed: ${err instanceof Error ? err.message : err}`,
      );
      throw new XOauthError("exchange_failed");
    }
    if (!pair.refreshToken) throw new XOauthError("no_refresh_token");

    // Persist the (single-use, already-exchanged) token pair BEFORE fetching the
    // handle. If v2.me() blips, we must not discard a valid connection — the code
    // can't be replayed, so losing the pair here would force a full re-consent.
    // The handle is cosmetic (column is nullable); fetch it best-effort and stamp
    // it in afterwards.
    await this.tokens.save({
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
    });

    let username = "";
    try {
      username = await this.fetchUsername(pair.accessToken);
      await this.tokens.save({
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken,
        username,
      });
    } catch (err) {
      this.logger.warn(
        `connected X account but failed to fetch handle: ${
          err instanceof Error ? err.message : err
        }`,
      );
      return { username: "" };
    }
    this.logger.log(`connected X account @${username}`);
    return { username };
  }

  async getStatus(): Promise<XConnectionStatus> {
    const row = await this.tokens.load();
    if (!row) return { connected: false, username: null, rotatedAt: null };
    return {
      connected: true,
      username: row.username,
      rotatedAt: row.rotatedAt,
    };
  }

  async disconnect(): Promise<void> {
    await this.tokens.clear();
    this.logger.log("disconnected X account");
  }

  /** Drop expired pending flows so the map can't grow unbounded. */
  private prune(): void {
    const now = Date.now();
    for (const [state, flow] of this.pending) {
      if (flow.expiresAt < now) this.pending.delete(state);
    }
  }

  // ─── X SDK seams (overridden in tests) ──────────────────────────────────

  protected makeAuthLink(): {
    url: string;
    codeVerifier: string;
    state: string;
  } {
    const client = new TwitterApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    return client.generateOAuth2AuthLink(this.redirectUri, { scope: SCOPES });
  }

  protected async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const client = new TwitterApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    const res = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: this.redirectUri,
    });
    return { accessToken: res.accessToken, refreshToken: res.refreshToken };
  }

  protected async fetchUsername(accessToken: string): Promise<string> {
    const me = await new TwitterApi(accessToken).v2.me();
    return me.data.username;
  }
}
