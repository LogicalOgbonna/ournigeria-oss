import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_COOKIE = "nb_uid";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://spending-api.arinze.online";

export async function POST(request: NextRequest) {
  // Revoke the web-domain session server-side (not just clear the cookie) so a
  // leaked token can't be replayed. The API logout revokes the presented token.
  const token = request.cookies.get(USER_COOKIE)?.value;
  if (token) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { cookie: `${USER_COOKIE}=${token}` },
      cache: "no-store",
    }).catch(() => {});
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(USER_COOKIE, "", {
    path: "/",
    expires: new Date(0),
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  });
  return res;
}
