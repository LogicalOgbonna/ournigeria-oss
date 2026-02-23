import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

function getBaseUrl(fallback: string): string {
  return process.env.NEXT_PUBLIC_APP_URL || fallback;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request.url);

  try {
    const { searchParams } = request.nextUrl;

    // Collect all query params into a plain object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Verify Telegram auth data
    const result = verifyTelegramAuth(params);
    if (!result.valid) {
      console.error("Telegram auth failed:", result.error);
      return NextResponse.redirect(
        new URL("/login?error=telegram_auth_failed", baseUrl),
      );
    }

    const { telegramUser } = result;

    // Upsert user by telegramId
    const user = await prisma.user.upsert({
      where: { telegramId: telegramUser.id },
      update: { lastSeenAt: new Date() },
      create: { telegramId: telegramUser.id },
    });

    // Set auth cookie (same as verify-otp)
    const cookieStore = await cookies();
    cookieStore.set(USER_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (err) {
    console.error("Telegram auth error:", err);
    return NextResponse.redirect(
      new URL("/login?error=telegram_auth_failed", baseUrl),
    );
  }
}
