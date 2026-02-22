import { cookies } from "next/headers";
import { z } from "zod";
import { phoneNumberSchema } from "@/lib/phone";
import { verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

const requestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { phoneNumber, code } = parsed.data;

    const result = await verifyOTP(phoneNumber, code);
    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: 401 },
      );
    }

    // Find or create user by phone number
    const user = await prisma.user.upsert({
      where: { phoneNumber },
      update: { lastSeenAt: new Date() },
      create: { phoneNumber },
    });

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set(USER_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return Response.json({
      success: true,
      user: { id: user.id, phoneNumber: user.phoneNumber },
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
