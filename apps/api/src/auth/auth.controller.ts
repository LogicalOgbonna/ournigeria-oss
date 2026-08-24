import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { TelegramLoginService } from "../telegram/telegram-login.service";
import { cache } from "@ournigeria/cache";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { CurrentUser } from "./decorators/current-user";
import { Public } from "./decorators/public";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Per-user cap on handoff-code minting. session-token inserts a DB row per
// call, so an unthrottled loop is a free table-flooding vector. Keyed on the
// authenticated userId (NOT IP — behind the Next.js rewrites every user shares
// one upstream IP, and an IP bucket would rate-limit everyone collectively).
const handoffRateCache = cache.namespace("auth:handoff-rl");
const HANDOFF_RL_MAX_PER_MIN = 10;

function getCookieDomain(): string | undefined {
  return process.env.AUTH_COOKIE_DOMAIN || undefined;
}

function buildUserCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE * 1000,
    domain: getCookieDomain(),
  };
}

/** Session metadata captured for audit/revocation UX. */
function sessionMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"] ?? null,
    ip: req.ip || req.socket?.remoteAddress || null,
  };
}

/**
 * Legacy signed handoff token verifier (format: userId.base36ts.hmacHex).
 * Retained ONLY so old web builds that still send `?nb_auth=` during the
 * migration window keep working. New logins issue opaque handoff codes instead.
 */
function verifyLegacyAuthToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, ts, sig] = parts;
  if (!userId || !ts || !sig) return null;

  const timestamp = Number.parseInt(ts, 36);
  if (Number.isNaN(timestamp)) return null;
  if (Date.now() - timestamp > 5 * 60 * 1000) return null;

  const secret = process.env.AUTH_SIGNING_SECRET || "";
  if (!secret) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${ts}`)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(sig, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return userId;
}

const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((raw) => {
    let cleaned = raw.replaceAll(/[\s\-().]/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "+234" + cleaned.slice(1);
    }
    if (!cleaned.startsWith("+") && cleaned.startsWith("234")) {
      cleaned = "+" + cleaned;
    }
    return cleaned;
  })
  .refine((val) => /^\+\d{7,15}$/.test(val), {
    message: "Invalid phone number. Use format: +234XXXXXXXXXX",
  });

const sendOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

const verifyAuthTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const exchangeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly telegramLogin: TelegramLoginService,
  ) {}

  @Public()
  @Post("telegram/start")
  @ApiOperation({ summary: "Begin Telegram deep-link login; returns startParam + pollKey" })
  async telegramStart(
    @Body() body: { intent?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // NOTE: behind the Next.js /api rewrite + infra proxy this `ip` collapses to a
    // shared upstream address, so this is effectively a global cap on login-start
    // volume (anti-spam for the request rows), not a true per-user limit. Keep it
    // generous so legitimate peak login traffic isn't blocked.
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    if (await this.telegramLogin.hitRateLimit(`start:${ip}`, 60, 60_000)) {
      return res
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .json({ error: "Too many login attempts. Please wait." });
    }

    const intent = body?.intent === "link" ? "link" : "login";
    let userId: string | undefined;
    if (intent === "link") {
      // Resolve the caller's session: opaque token → server lookup; a legacy
      // raw-UUID cookie is accepted only while the migration window is open.
      const cookie = req.cookies?.[USER_COOKIE];
      let resolved: string | null = null;
      if (SessionService.isSessionToken(cookie)) {
        resolved = await this.sessionService.resolve(cookie);
      } else if (
        process.env.LEGACY_UID_SESSIONS !== "false" &&
        typeof cookie === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cookie)
      ) {
        resolved = cookie;
      }
      if (!resolved) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: "Sign in before linking Telegram." });
      }
      userId = resolved;
    }

    const { startParam, pollKey } = await this.telegramLogin.createLoginRequest(intent, userId);
    return res.json({ startParam, pollKey });
  }

  @Public()
  @Get("telegram/poll")
  @ApiOperation({ summary: "Poll a Telegram deep-link login; sets session cookie on success" })
  async telegramPoll(
    @Query("pollKey") pollKey: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!pollKey) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: "pollKey is required" });
    }
    // Rate-limit per pollKey, NOT per IP. Behind the Next.js /api rewrite + infra
    // proxy, every user's poll reaches the API from one shared upstream IP, so an
    // IP bucket collapses all users together and saturates under normal 2s polling
    // → 429 for everyone → login never completes. The pollKey is unique per attempt
    // and unguessable (192-bit random, never sent to Telegram), so keying on it
    // isolates each attempt. One client polls ~30/min; 120/min gives ample headroom.
    if (await this.telegramLogin.hitRateLimit(`poll:${pollKey}`, 120, 60_000)) {
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({ error: "Too many requests." });
    }

    const result = await this.telegramLogin.pollByKey(pollKey);
    if (result.status === "authenticated") {
      // Issue an opaque server-stored session token (not the raw userId).
      const sessionToken = await this.sessionService.issue(result.userId, sessionMeta(req));
      res.cookie(USER_COOKIE, sessionToken, buildUserCookieOptions());
      return res.json({ status: "authenticated", success: true, userId: result.userId });
    }
    return res.json({ status: result.status });
  }

  @Public()
  @Post("send-otp")
  @ApiOperation({ summary: "Send OTP via WhatsApp" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["phoneNumber"],
      properties: {
        phoneNumber: { type: "string", example: "+2348012345678" },
      },
    },
  })
  async sendOtp(@Body() body: unknown, @Res() res: Response) {
    try {
      const parsed = sendOtpSchema.safeParse(body);

      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      const { phoneNumber } = parsed.data;

      const rateLimited = await this.authService.checkRateLimit(phoneNumber);
      if (rateLimited) {
        return res
          .status(HttpStatus.TOO_MANY_REQUESTS)
          .json({ error: "Too many OTP requests. Please try again later." });
      }

      const code = await this.authService.createOTP(phoneNumber);

      const result = await this.authService.sendWhatsAppOTP(phoneNumber, code);
      if (!result.success) {
        return res.status(HttpStatus.BAD_GATEWAY).json({
          error: "Failed to send OTP via WhatsApp. Please try again.",
        });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("send-otp error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Public()
  @Post("verify-otp")
  @ApiOperation({ summary: "Verify OTP and authenticate" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["phoneNumber", "code"],
      properties: {
        phoneNumber: { type: "string", example: "+2348012345678" },
        code: { type: "string", example: "123456" },
      },
    },
  })
  async verifyOtp(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    try {
      const parsed = verifyOtpSchema.safeParse(body);

      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      const { phoneNumber, code } = parsed.data;

      const result = await this.authService.verifyOTP(phoneNumber, code);
      if (!result.success) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: result.error });
      }

      const user = await this.authService.upsertUserByPhone(phoneNumber);

      const banStatus = await this.authService.checkBanStatus(user.id);
      if (banStatus.banned) {
        return res.status(HttpStatus.FORBIDDEN).json({
          error: "banned",
          reason: banStatus.reason || "Your account has been suspended.",
        });
      }

      const sessionToken = await this.sessionService.issue(user.id, sessionMeta(req));
      res.cookie(USER_COOKIE, sessionToken, buildUserCookieOptions());

      return res.json({
        success: true,
        authToken: await this.sessionService.createHandoff(user.id),
        user: { id: user.id, phoneNumber: user.phoneNumber },
      });
    } catch (err) {
      console.error("verify-otp error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("session-token")
  @ApiOperation({ summary: "Get a one-time login handoff code for the current session" })
  async getSessionToken(@CurrentUser() userId: string, @Res() res: Response) {
    const current = (await handoffRateCache.get<number>(userId)) ?? 0;
    if (current >= HANDOFF_RL_MAX_PER_MIN) {
      return res
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .json({ error: "Too many requests. Please wait a moment." });
    }
    await handoffRateCache.set(userId, current + 1, 60_000);

    return res.json({ authToken: await this.sessionService.createHandoff(userId) });
  }

  @Public()
  @Post("exchange")
  @ApiOperation({ summary: "Exchange a one-time handoff code for a session token" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["code"],
      properties: { code: { type: "string" } },
    },
  })
  async exchange(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const parsed = exchangeSchema.safeParse(body);
    if (!parsed.success) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: parsed.error.errors[0].message });
    }

    const userId = await this.sessionService.consumeHandoff(parsed.data.code);
    if (!userId) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ error: "Invalid or expired code" });
    }

    const banStatus = await this.authService.checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: "banned",
        reason: banStatus.reason || "Your account has been suspended.",
      });
    }

    const sessionToken = await this.sessionService.issue(userId, sessionMeta(req));
    return res.json({ success: true, sessionToken, userId });
  }

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@CurrentUser() userId: string, @Res() res: Response) {
    try {
      const profile = await this.authService.getProfile(userId);
      if (!profile) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "User not found" });
      }
      return res.json(profile);
    } catch (err) {
      console.error("get-profile error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Patch("profile")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Arinze" },
        email: { type: "string", example: "user@example.com" },
      },
    },
  })
  async updateProfile(
    @CurrentUser() userId: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    try {
      const schema = z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().max(255).optional(),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: parsed.error.errors[0].message });
      }

      const profile = await this.authService.updateProfile(userId, parsed.data);
      return res.json(profile);
    } catch (err) {
      console.error("update-profile error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Public()
  @Post("logout")
  @ApiOperation({ summary: "Logout and clear session cookie" })
  async logout(@Req() req: Request, @Res() res: Response) {
    // Revoke the presented session server-side so the token cannot be replayed.
    const cookieValue = req.cookies?.[USER_COOKIE];
    if (cookieValue) {
      await this.sessionService.revoke(cookieValue).catch(() => {});
    }
    res.clearCookie(USER_COOKIE, {
      path: "/",
      secure: true,
      sameSite: "none",
      domain: getCookieDomain(),
    });
    return res.json({ success: true });
  }

  @Public()
  @Post("verify-token")
  @ApiOperation({ summary: "Verify a login handoff token (legacy signed token or one-time code)" })
  async verifyToken(@Body() body: unknown, @Res() res: Response) {
    const parsed = verifyAuthTokenSchema.safeParse(body);
    if (!parsed.success) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: parsed.error.errors[0].message });
    }

    // Accept a legacy signed token (no side effect) or consume a one-time
    // handoff code — both resolve to a userId during the migration window.
    const userId =
      verifyLegacyAuthToken(parsed.data.token) ||
      (await this.sessionService.consumeHandoff(parsed.data.token));
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: "Invalid token" });
    }

    const banStatus = await this.authService.checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: "banned",
        reason: banStatus.reason || "Your account has been suspended.",
      });
    }

    const profile = await this.authService.getProfile(userId);
    if (!profile) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: "Invalid token" });
    }

    return res.json({ success: true, userId });
  }
}
