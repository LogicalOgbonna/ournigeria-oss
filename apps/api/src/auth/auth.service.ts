import { Injectable } from "@nestjs/common";
import * as crypto from "node:crypto";
import { PrismaService } from "@ournigeria/database";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_OTPS_PER_HOUR = 5;
const MAX_TOTAL_VERIFY_ATTEMPTS_PER_HOUR = 15;

interface VerifyResult {
  success: boolean;
  error?: string;
}


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

  async checkVerifyRateLimit(phoneNumber: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await this.prisma.otpVerification.aggregate({
      where: {
        phoneNumber,
        createdAt: { gte: oneHourAgo },
      },
      _sum: { attempts: true },
    });
    return (result._sum.attempts ?? 0) >= MAX_TOTAL_VERIFY_ATTEMPTS_PER_HOUR;
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<VerifyResult> {
    // Check global verification rate limit across all OTPs
    const verifyLimited = await this.checkVerifyRateLimit(phoneNumber);
    if (verifyLimited) {
      return {
        success: false,
        error:
          "Too many verification attempts. Please wait before trying again.",
      };
    }

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

  // ─── User upsert ──────────────────────────────────────

  async upsertUserByPhone(phoneNumber: string) {
    return this.prisma.user.upsert({
      where: { phoneNumber },
      update: { lastSeenAt: new Date() },
      create: { phoneNumber },
    });
  }

  // ─── Profile ─────────────────────────────────────────

  async checkBanStatus(
    userId: string,
  ): Promise<{ banned: boolean; reason?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true, banReason: true },
    });
    if (!user) return { banned: false };
    return { banned: user.banned, reason: user.banReason ?? undefined };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phoneNumber: true },
    });
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, phoneNumber: true },
    });
  }

  // ─── Dev test user ──────────────────────────────────────

  async upsertTestUser() {
    const TEST_PHONE = "+2340000000000";
    return this.prisma.user.upsert({
      where: { phoneNumber: TEST_PHONE },
      update: { lastSeenAt: new Date() },
      create: {
        phoneNumber: TEST_PHONE,
        name: "Test User (Dev)",
      },
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
