import { Injectable } from "@nestjs/common";
import * as crypto from "node:crypto";
import { PrismaService } from "@ournigeria/database";
import { cache } from "@ournigeria/cache";

const TOKEN_BYTES = 24; // 24 bytes → 32 base64url chars (well under Telegram's 64-char start-param limit)
const TTL_MS = 5 * 60 * 1000; // login request valid for 5 minutes

export type LoginIntent = "login" | "link";

export type ResolveResult =
  | { ok: true }
  | { ok: false; reason: "unknown" | "already_used" | "expired" | "no_bound_user" | "banned" };

export type PollResult =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "authenticated"; userId: string };

/**
 * Backs the Telegram deep-link login flow. The browser never contacts
 * telegram.org/oauth.telegram.org — auth arrives server→server via the webhook.
 *
 * Two independent tokens per request:
 *  - `startParam` travels into Telegram via the t.me deep link (matched by the webhook)
 *  - `pollKey` stays in the browser (matched by the poll endpoint)
 * so the value Telegram sees can't claim the session, and the value used to claim
 * the session never leaves the browser.
 */
@Injectable()
export class TelegramLoginService {
  private readonly rateCache = cache.namespace("tg:login:rate");

  constructor(private prisma: PrismaService) {}

  /** Random URL-safe token (A-Za-z0-9_-), 32 chars. Safe as a Telegram start param. */
  generateToken(): string {
    return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  }

  /** Fixed-window per-key rate limit. Returns true when the caller is over the limit. */
  async hitRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
    const prev = (await this.rateCache.get<number>(key)) ?? 0;
    if (prev >= max) return true;
    await this.rateCache.set(key, prev + 1, windowMs);
    return false;
  }

  async createLoginRequest(
    intent: LoginIntent,
    userId?: string,
  ): Promise<{ startParam: string; pollKey: string }> {
    const startParam = this.generateToken();
    const pollKey = this.generateToken();
    const expiresAt = new Date(Date.now() + TTL_MS);
    await this.prisma.telegramLoginRequest.create({
      data: { startParam, pollKey, intent, userId: userId ?? null, status: "pending", expiresAt },
    });
    return { startParam, pollKey };
  }

  /** Called by the webhook when `/start <startParam>` arrives. Trusts `from` (delivered by Telegram). */
  async resolveStartParam(
    startParam: string,
    from: { id: string | number; first_name?: string; last_name?: string },
  ): Promise<ResolveResult> {
    const row = await this.prisma.telegramLoginRequest.findUnique({ where: { startParam } });
    if (!row) return { ok: false, reason: "unknown" };
    if (row.status !== "pending") return { ok: false, reason: "already_used" };
    if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

    const telegramId = String(from.id);
    let userId: string;

    if (row.intent === "link") {
      if (!row.userId) return { ok: false, reason: "no_bound_user" };
      const boundUserId = row.userId;
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { telegramId } });
        if (existing && existing.id !== boundUserId) {
          await tx.user.update({ where: { id: existing.id }, data: { telegramId: null } });
        }
        await tx.user.update({
          where: { id: boundUserId },
          data: { telegramId, lastSeenAt: new Date() },
        });
      });
      userId = boundUserId;
    } else {
      const name = [from.first_name, from.last_name].filter(Boolean).join(" ") || null;
      const user = await this.prisma.user.upsert({
        where: { telegramId },
        update: { lastSeenAt: new Date() },
        create: { telegramId, name },
      });
      userId = user.id;
    }

    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { banned: true } });
    if (u?.banned) return { ok: false, reason: "banned" };

    await this.prisma.telegramLoginRequest.update({
      where: { startParam },
      data: { status: "authenticated", telegramId, userId },
    });
    return { ok: true };
  }

  /** Browser polls with the pollKey (never sent to Telegram). Consumes on success (single-use). */
  async pollByKey(pollKey: string): Promise<PollResult> {
    const row = await this.prisma.telegramLoginRequest.findUnique({ where: { pollKey } });
    if (!row) return { status: "expired" };
    if (row.status === "authenticated" && row.userId) {
      await this.prisma.telegramLoginRequest.update({
        where: { pollKey },
        data: { status: "consumed" },
      });
      return { status: "authenticated", userId: row.userId };
    }
    if (row.status === "consumed") return { status: "expired" };
    if (row.expiresAt.getTime() < Date.now()) return { status: "expired" };
    return { status: "pending" };
  }
}
