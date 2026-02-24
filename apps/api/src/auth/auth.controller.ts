import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  Body,
  Query,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from "@nestjs/swagger";
import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { TelegramApiService } from "../telegram/telegram-api.service";
import { Public } from "./decorators/public";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

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
      const user = await this.authService.upsertUserByTelegram(telegramUser.id);

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
            `Welcome to NaijaBudget, ${name}! Your account has been created.\n\nYou can now ask me questions right here about Nigerian state budgets and EFCC corruption cases.\n\nSend /help to see available commands.`,
          )
          .catch((err) =>
            console.error("Failed to send Telegram welcome:", err),
          );
      }

      // Pass user ID via query param so the web app can set its own cookie
      return res.redirect(`${baseUrl}/?nb_auth=${user.id}`);
    } catch (err) {
      console.error("Telegram auth error:", err);
      return res.redirect(`${baseUrl}/login?error=telegram_auth_failed`);
    }
  }
}
