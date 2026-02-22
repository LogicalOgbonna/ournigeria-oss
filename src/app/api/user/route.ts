import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const USER_COOKIE = "nb_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * POST /api/user — Create or retrieve an anonymous user.
 *
 * - If a valid nb_uid cookie exists and the user row is present, touch
 *   last_seen_at and return the existing user.
 * - Otherwise create a new user row and set the cookie.
 *
 * This is the ONLY place where user rows are created and cookies are set.
 * All other API routes read the cookie via getUserId() (lib/user.ts).
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get(USER_COOKIE)?.value;

    // Try to reuse the existing user
    if (existing) {
      const user = await prisma.user.findUnique({
        where: { id: existing },
        select: { id: true, createdAt: true, lastSeenAt: true },
      });

      if (user) {
        // Touch last_seen_at
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });

        return Response.json({
          id: user.id,
          createdAt: user.createdAt,
          isNew: false,
        });
      }
      // Cookie points to a deleted user — fall through to create
    }

    // Create a new anonymous user
    const user = await prisma.user.create({ data: {} });

    cookieStore.set(USER_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return Response.json(
      { id: user.id, createdAt: user.createdAt, isNew: true },
      { status: 201 },
    );
  } catch (err) {
    console.error("User creation error:", err);
    return Response.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
