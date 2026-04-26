import { Injectable } from "@nestjs/common";
import { cache } from "@ournigeria/cache";
import { getSetting } from "../config/settings-store";

const QUESTIONS_KEY = "chat_rate_limit_questions";
const WINDOW_KEY = "chat_rate_limit_window";

const DEFAULT_QUESTIONS = 3;
const DEFAULT_WINDOW = "5 minutes";

const MAX_QUESTIONS = 10_000;
const MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 1 week cap

/** App-wide config from settings store (updated on admin save + loaded at startup). */
function getRateLimitQuestions(): number {
  const raw = getSetting(QUESTIONS_KEY, "CHAT_RATE_LIMIT_QUESTIONS");
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n < 1) return DEFAULT_QUESTIONS;
  return Math.min(Math.floor(n), MAX_QUESTIONS);
}

function getRateLimitWindowMs(): number {
  const raw = getSetting(WINDOW_KEY, "CHAT_RATE_LIMIT_WINDOW") || DEFAULT_WINDOW;
  const [val, unit] = raw.split(" ");
  const num = parseInt(val || "5", 10);
  
  let ms = num;
  switch (unit) {
    case "seconds": ms = num * 1000; break;
    case "minutes": ms = num * 60_000; break;
    case "hours": ms = num * 3_600_000; break;
    case "days": ms = num * 86_400_000; break;
    default: ms = num * 60_000; break; // fallback to minutes if invalid unit
  }
  
  if (!Number.isFinite(ms) || ms < 1000) ms = 5 * 60_000;
  return Math.min(Math.floor(ms), MAX_WINDOW_MS);
}

export type ChatRateLimitDenied = {
  allowed: false;
  retryAfterMs: number;
  expirations: number[];
};

export type ChatRateLimitOk = { allowed: true };

@Injectable()
export class ChatRateLimitService {
  private readonly chatCache = cache.namespace("chat:rate");

  /**
   * Sliding window: keep request timestamps within windowMs.
   * If count >= limit before recording this request, deny (do not append).
   */
  async checkAndRecord(userId: string): Promise<ChatRateLimitOk | ChatRateLimitDenied> {
    const limit = getRateLimitQuestions();
    const windowMs = getRateLimitWindowMs();
    const now = Date.now();
    const cutoff = now - windowMs;

    const prev = (await this.chatCache.get<number[]>(userId)) ?? [];
    const filtered = prev.filter((ts) => ts > cutoff).sort((a, b) => a - b);

    if (filtered.length >= limit) {
      const expirations = filtered.map((ts) => ts + windowMs).sort((a, b) => a - b);
      const oldest = filtered[0]!;
      const retryAfterMs = Math.max(0, Math.ceil(oldest + windowMs - now));
      return { allowed: false, retryAfterMs, expirations };
    }

    const next = [...filtered, now].sort((a, b) => a - b);
    await this.chatCache.set(userId, next, windowMs);

    return { allowed: true };
  }
}
