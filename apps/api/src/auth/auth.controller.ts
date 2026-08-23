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
import { TelegramApiService } from "../telegram/telegram-api.service";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { CurrentUser } from "./decorators/current-user";
import { Public } from "./decorators/public";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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

function getAllowedRedirectOrigins(): string[] {
  const origins = new Set<string>();
  const appUrl = process.env.APP_URL;
  const corsOrigins = process.env.CORS_ORIGINS;

  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {}
  }

  if (corsOrigins) {
    for (const rawOrigin of corsOrigins.split(",")) {
      const origin = rawOrigin.trim();
      if (!origin) continue;
      try {
        origins.add(new URL(origin).origin);
      } catch {}
    }
  }

  return [...origins];
}

function resolveTelegramRedirectTarget(returnTo?: string): string {
  const fallback = process.env.APP_URL!;
  if (!returnTo) return fallback;

  try {
    const target = new URL(returnTo);
    if (getAllowedRedirectOrigins().includes(target.origin)) {
      return `${target.origin}${target.pathname}${target.search}${target.hash}`;
    }
  } catch {}

  return fallback;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/**
 * Render a self-submitting HTML form that POSTs the one-time handoff code to the
 * web app's /auth/handoff endpoint. This keeps the code out of the redirect URL
 * (no browser history / Referer / proxy-log exposure) — it travels in the POST
 * body instead of a query param.
 */
function renderHandoffForm(webTarget: string, code: string): string {
  const url = new URL(webTarget);
  // The /auth/handoff route lives on the web app (APP_URL). Pin the POST target
  // there regardless of which allow-listed origin `returnTo` resolved to, so the
  // form never posts to an origin that lacks the handoff route.
  const webOrigin = (() => {
    try {
      return new URL(process.env.APP_URL!).origin;
    } catch {
      return url.origin;
    }
  })();
  const action = `${webOrigin}/auth/handoff`;
  const returnTo = `${url.origin}${url.pathname}${url.search}${url.hash}`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Signing you in…</title></head>
<body>
<form id="handoff" method="POST" action="${escapeHtml(action)}">
  <input type="hidden" name="code" value="${escapeHtml(code)}">
  <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}">
  <noscript><button type="submit">Continue</button></noscript>
</form>
<script>document.getElementById('handoff').submit();</script>
</body></html>`;
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
    private readonly telegramApi: TelegramApiService,
  ) {}

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

  private async completeTelegramLogin(
    telegramAuthPayload: Record<string, string>,
    req: Request,
    res: Response,
  ) {
    const result = this.authService.verifyTelegramAuth(telegramAuthPayload);
    if (!result.valid) {
      return { ok: false as const, error: result.error || "Invalid Telegram auth data" };
    }

    const { telegramUser } = result;
    const isNewUser = !(await this.authService.telegramUserExists(telegramUser.id));
    const user = await this.authService.upsertUserByTelegram(telegramUser.id);

    const banStatus = await this.authService.checkBanStatus(user.id);
    if (banStatus.banned) {
      return {
        ok: false as const,
        banned: true as const,
        reason: banStatus.reason || "Your account has been suspended.",
      };
    }

    const sessionToken = await this.sessionService.issue(user.id, sessionMeta(req));
    res.cookie(USER_COOKIE, sessionToken, buildUserCookieOptions());

    if (isNewUser) {
      const chatId = Number(telegramUser.id);
      const name = telegramUser.first_name || "there";
      this.telegramApi
        .sendMessage(
          chatId,
          `Welcome to OurNigeria, ${name}! Your account has been created.\n\nYou can now ask me questions right here about Nigerian budgets, government spending, and EFCC corruption cases.\n\nSend /help to see available commands.`,
        )
        .catch((err) =>
          console.error("Failed to send Telegram welcome:", err),
        );
    }

    return { ok: true as const, userId: user.id };
  }

  @Public()
  @Get("telegram")
  @ApiOperation({ summary: "Telegram login callback" })
  async telegramAuth(
    @Query() query: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { returnTo, ...telegramPayload } = query;
    const baseUrl = resolveTelegramRedirectTarget(returnTo);

    try {
      const loginResult = await this.completeTelegramLogin(telegramPayload, req, res);
      if (!loginResult.ok) {
        if ("banned" in loginResult && loginResult.banned) {
          return res.redirect(`${new URL(baseUrl).origin}/banned`);
        }
        console.error("Telegram auth failed:", loginResult.error);
        return res.redirect(`${baseUrl}/login?error=telegram_auth_failed`);
      }

      // Hand the one-time code to the web app via an auto-submitting POST form
      // (keeps it out of the redirect URL / browser history / Referer).
      const code = await this.sessionService.createHandoff(loginResult.userId);
      return res
        .status(HttpStatus.OK)
        .type("html")
        .send(renderHandoffForm(baseUrl, code));
    } catch (err) {
      console.error("Telegram auth error:", err);
      return res.redirect(`${baseUrl}/login?error=telegram_auth_failed`);
    }
  }

  @Public()
  @Post("telegram/login")
  @ApiOperation({ summary: "Login with Telegram widget payload" })
  async telegramLogin(
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const loginResult = await this.completeTelegramLogin(body, req, res);
      if (!loginResult.ok) {
        if ("banned" in loginResult && loginResult.banned) {
          return res.status(HttpStatus.FORBIDDEN).json({
            error: "banned",
            reason: loginResult.reason,
          });
        }
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: loginResult.error });
      }

      return res.json({
        success: true,
        userId: loginResult.userId,
        authToken: await this.sessionService.createHandoff(loginResult.userId),
      });
    } catch (err) {
      console.error("Telegram login error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("telegram/link")
  @ApiOperation({ summary: "Link Telegram account to active session" })
  async linkTelegram(
    @CurrentUser() userId: string,
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const result = this.authService.verifyTelegramAuth(body);
      if (!result.valid) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: "Invalid Telegram auth data" });
      }

      await this.authService.linkTelegramAccount(
        userId,
        result.telegramUser.id,
      );
      return res.json({ success: true });
    } catch (err) {
      console.error("Telegram link error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
