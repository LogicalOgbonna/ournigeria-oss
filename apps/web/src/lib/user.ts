import { cookies } from "next/headers";

const USER_COOKIE = "nb_uid";

/**
 * Read the authenticated user ID from the cookie.
 * Returns null if no cookie is present (user is not logged in).
 *
 * User creation happens during OTP verification in POST /api/auth/verify-otp.
 * This helper is for other API routes that need the current user ID.
 */
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_COOKIE)?.value ?? null;
}

/**
 * Same as getUserId but throws a 401-style error when no user exists.
 * Use this in API routes that require an authenticated user.
 */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new UserNotInitializedError();
  }
  return userId;
}

export class UserNotInitializedError extends Error {
  constructor() {
    super("Not authenticated. Please log in.");
    this.name = "UserNotInitializedError";
  }
}
