import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_OTPS_PER_HOUR = 5;

/** Generate a cryptographically random 6-digit OTP code. */
export function generateOTPCode(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, "0");
}

/** Check if a phone number has exceeded the OTP rate limit (5 per hour). */
export async function checkRateLimit(phoneNumber: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.otpVerification.count({
    where: {
      phoneNumber,
      createdAt: { gte: oneHourAgo },
    },
  });
  return count >= MAX_OTPS_PER_HOUR;
}

/** Expire old unverified OTPs for this phone and create a new one. */
export async function createOTP(phoneNumber: string): Promise<string> {
  // Expire any active unverified OTPs for this phone number
  await prisma.otpVerification.updateMany({
    where: {
      phoneNumber,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // expire immediately
    },
  });

  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: {
      phoneNumber,
      code,
      expiresAt,
    },
  });

  return code;
}

interface VerifyResult {
  success: boolean;
  error?: string;
}

/** Verify an OTP code for a phone number. */
export async function verifyOTP(
  phoneNumber: string,
  code: string,
): Promise<VerifyResult> {
  const otp = await prisma.otpVerification.findFirst({
    where: {
      phoneNumber,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { success: false, error: "No active OTP found. Please request a new code." };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: "Too many attempts. Please request a new code." };
  }

  // Increment attempts
  await prisma.otpVerification.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  if (!crypto.timingSafeEqual(Buffer.from(otp.code), Buffer.from(code))) {
    const remaining = MAX_ATTEMPTS - otp.attempts - 1;
    return {
      success: false,
      error: remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many attempts. Please request a new code.",
    };
  }

  // Mark as verified
  await prisma.otpVerification.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return { success: true };
}
