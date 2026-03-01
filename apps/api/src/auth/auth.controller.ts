import {
  Controller,
  Post,
  Get,
  Patch,
  Req,
  Res,
  Body,
  Query,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from "@nestjs/swagger";
import { Request, Response } from "express";
import * as crypto from "crypto";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { TelegramApiService } from "../telegram/telegram-api.service";
import { Public } from "./decorators/public";
import { CurrentUser } from "./decorators/current-user";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Sign a user ID for the nb_auth callback so the web proxy can verify it wasn't forged. */
function signAuthToken(userId: string): string {
  const ts = Date.now().toString(36);
  const secret = process.env.TELEGRAM_BOT_TOKEN || "";
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${ts}`)
    .digest("hex")
    .slice(0, 16);
  return `${userId}.${ts}.${sig}`;
}

const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((raw) => {
    let cleaned = raw.replace(/[\s\-().]/g, "");
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

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private telegramApi: TelegramApiService,
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
  async verifyOtp(@Body() body: unknown, @Res() res: Response) {
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

      res.cookie(USER_COOKIE, user.id, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: COOKIE_MAX_AGE * 1000, // Express uses milliseconds
      });

      return res.json({
        success: true,
        user: { id: user.id, phoneNumber: user.phoneNumber },
      });
    } catch (err) {
      console.error("verify-otp error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
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
  async logout(@Res() res: Response) {
    res.clearCookie(USER_COOKIE, { path: "/", secure: true, sameSite: "none" });
    return res.json({ success: true });
  }

  @Public()
  @Get("telegram")
  @ApiOperation({ summary: "Telegram login callback" })
  async telegramAuth(
    @Query() query: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const baseUrl = process.env.APP_URL!;

    try {
      const result = this.authService.verifyTelegramAuth(query);
      if (!result.valid) {
        console.error("Telegram auth failed:", result.error);
        return res.redirect(`${baseUrl}/login?error=telegram_auth_failed`);
      }

      const { telegramUser } = result;
      const isNewUser = !(await this.authService.telegramUserExists(
        telegramUser.id,
      ));

      const currentUserId = req.cookies?.[USER_COOKIE];
      let user;

      if (currentUserId) {
        try {
          // Link to existing session
          user = await this.authService.linkTelegramAccount(
            currentUserId,
            telegramUser.id,
          );
        } catch (err) {
          // If linking fails (e.g. user deleted), fallback to standard login
          console.error("Failed to link Telegram account:", err);
          user = await this.authService.upsertUserByTelegram(telegramUser.id);
        }
      } else {
        user = await this.authService.upsertUserByTelegram(telegramUser.id);
      }

      const banStatus = await this.authService.checkBanStatus(user.id);
      if (banStatus.banned) {
        return res.redirect(`${baseUrl}/banned`);
      }

      // Set cookie on the API domain so subsequent cross-origin requests are authenticated
      res.cookie(USER_COOKIE, user.id, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: COOKIE_MAX_AGE * 1000,
      });

      // Send a welcome message to new Telegram users
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

      // Pass signed auth token via query param so the web app can verify + set cookie
      return res.redirect(`${baseUrl}/?nb_auth=${signAuthToken(user.id)}`);
    } catch (err) {
      console.error("Telegram auth error:", err);
      return res.redirect(`${baseUrl}/login?error=telegram_auth_failed`);
    }
  }
}
