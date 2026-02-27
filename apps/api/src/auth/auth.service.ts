import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "@ournigeria/database";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_OTPS_PER_HOUR = 5;

interface VerifyResult {
  success: boolean;
  error?: string;
}

export interface TelegramUser {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
}

interface TelegramVerifyResult {
  valid: true;
  telegramUser: TelegramUser;
}

interface TelegramVerifyError {
  valid: false;
  error: string;
}

const MAX_AUTH_AGE_SECONDS = 300; // 5 minutes

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // ─── Phone / OTP ───────────────────────────────────────

  generateOTPCode(): string {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0) % 1_000_000;
    return num.toString().padStart(6, "0");
  }

  async checkRateLimit(phoneNumber: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.otpVerification.count({
      where: {
        phoneNumber,
        createdAt: { gte: oneHourAgo },
      },
    });
    return count >= MAX_OTPS_PER_HOUR;
  }

  async createOTP(phoneNumber: string): Promise<string> {
    // Expire any active unverified OTPs
    await this.prisma.otpVerification.updateMany({
      where: {
        phoneNumber,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        expiresAt: new Date(),
      },
    });

    const code = this.generateOTPCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: {
        phoneNumber,
        code,
        expiresAt,
      },
    });

    return code;
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<VerifyResult> {
    const otp = await this.prisma.otpVerification.findFirst({
      where: {
        phoneNumber,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return {
        success: false,
        error: "No active OTP found. Please request a new code.",
      };
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Too many attempts. Please request a new code.",
      };
    }

    // Increment attempts
    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    if (!crypto.timingSafeEqual(Buffer.from(otp.code), Buffer.from(code))) {
      const remaining = MAX_ATTEMPTS - otp.attempts - 1;
      return {
        success: false,
        error:
          remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many attempts. Please request a new code.",
      };
    }

    // Mark as verified
    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return { success: true };
  }

  // ─── WhatsApp ──────────────────────────────────────────

  async sendWhatsAppOTP(
    phoneNumber: string,
    code: string,
  ): Promise<{ success: boolean; error?: string }> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error("WhatsApp env vars not configured");
      return { success: false, error: "WhatsApp not configured" };
    }

    const to = phoneNumber.replace(/^\+/, "");

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: {
              body: `Your OurNigeria verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
            },
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        console.error("WhatsApp API error:", res.status, body);
        return { success: false, error: "Failed to send WhatsApp message" };
      }

      return { success: true };
    } catch (err) {
      console.error("WhatsApp send error:", err);
      return { success: false, error: "Failed to send WhatsApp message" };
    }
  }

  // ─── Telegram ──────────────────────────────────────────

  verifyTelegramAuth(
    params: Record<string, string>,
  ): TelegramVerifyResult | TelegramVerifyError {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { valid: false, error: "TELEGRAM_BOT_TOKEN is not configured" };
    }

    const hash = params.hash;
    if (!hash) {
      return { valid: false, error: "Missing hash parameter" };
    }

    if (!params.id || !params.auth_date) {
      return { valid: false, error: "Missing required parameters" };
    }

    if (!/^\d{1,19}$/.test(params.id)) {
      return { valid: false, error: "Invalid Telegram ID format" };
    }

    const dataCheckString = Object.keys(params)
      .filter((key) => key !== "hash")
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("\n");

    const secret = crypto.createHash("sha256").update(botToken).digest();
    const computed = crypto
      .createHmac("sha256", secret)
      .update(dataCheckString)
      .digest("hex");

    const hashBuffer = Buffer.from(hash, "hex");
    const computedBuffer = Buffer.from(computed, "hex");

    if (
      hashBuffer.length !== computedBuffer.length ||
      !crypto.timingSafeEqual(hashBuffer, computedBuffer)
    ) {
      return { valid: false, error: "Invalid hash" };
    }

    const authDate = parseInt(params.auth_date, 10);
    if (isNaN(authDate)) {
      return { valid: false, error: "Invalid auth_date" };
    }
    const now = Math.floor(Date.now() / 1000);
    if (authDate > now) {
      return { valid: false, error: "Invalid auth_date" };
    }
    if (now - authDate > MAX_AUTH_AGE_SECONDS) {
      return { valid: false, error: "Auth data has expired" };
    }

    return {
      valid: true,
      telegramUser: {
        id: params.id,
        first_name: params.first_name,
        last_name: params.last_name,
        username: params.username,
        photo_url: params.photo_url,
        auth_date: params.auth_date,
      },
    };
  }

  // ─── User upsert ──────────────────────────────────────

  async upsertUserByPhone(phoneNumber: string) {
    return this.prisma.user.upsert({
      where: { phoneNumber },
      update: { lastSeenAt: new Date() },
      create: { phoneNumber },
    });
  }

  async telegramUserExists(telegramId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    return !!user;
  }

  async upsertUserByTelegram(telegramId: string) {
    return this.prisma.user.upsert({
      where: { telegramId },
      update: { lastSeenAt: new Date() },
      create: { telegramId },
    });
  }

  // ─── Phone validation ─────────────────────────────────

  normalizeNigerianPhone(raw: string): string {
    let cleaned = raw.replace(/[\s\-().]/g, "");

    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "+234" + cleaned.slice(1);
    }

    if (!cleaned.startsWith("+") && cleaned.startsWith("234")) {
      cleaned = "+" + cleaned;
    }

    return cleaned;
  }
}
