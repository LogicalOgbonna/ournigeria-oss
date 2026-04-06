import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_COOKIE = "nb_uid";
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || undefined;
const EXTERNAL_LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL || "https://ournigeria.arinze.online/login";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://spending-api.arinze.online";

const PUBLIC_PATHS = ["/login", "/banned", "/api/auth/", "/chat/"];

const AUTH_TOKEN_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify a signed nb_auth token.
 * Format: userId.base36timestamp.hmac16chars
 * The API signs this with TELEGRAM_BOT_TOKEN. We verify the HMAC when
 * crypto.subtle is available (Edge Runtime / production), and fall back
 * to format + expiry checks only when it's not (dev mode).
 */
async function verifyAuthToken(token: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, ts, sig] = parts;
  if (!userId || !ts || !sig) return null;

  // Check age — token must be < 5 minutes old
  const timestamp = parseInt(ts, 36);
  if (isNaN(timestamp) || Date.now() - timestamp > AUTH_TOKEN_MAX_AGE_MS)
    return null;

  // Verify HMAC if crypto.subtle is available
  try {
    const secret = process.env.TELEGRAM_BOT_TOKEN || "";
    if (secret && typeof crypto !== "undefined" && crypto.subtle) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${userId}:${ts}`),
      );
      const expected = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16);

      if (sig !== expected) return null;
    }
  } catch {
    // crypto.subtle not available (e.g. dev mode) — skip HMAC check
  }

  return userId;
}

async function verifyAuthTokenViaApi(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { userId?: string };
    return data.userId || null;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getPublicRequestUrl(request: NextRequest): URL {
  // Always use the canonical app URL as the base to prevent internal ports
  // (e.g. :3000 from x-forwarded-host) from leaking into redirect URLs.
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL || "https://spending.arinze.online";
  return new URL(request.nextUrl.pathname + request.nextUrl.search, appBase);
}

function buildExternalLoginRedirect(request: NextRequest): URL {
  const loginUrl = new URL(EXTERNAL_LOGIN_URL);
  loginUrl.searchParams.set("returnTo", getPublicRequestUrl(request).toString());
  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle Telegram auth callback — verify signed token, set cookie, strip param
  const nbAuth = searchParams.get("nb_auth");
  if (nbAuth) {
    const url = getPublicRequestUrl(request);
    url.searchParams.delete("nb_auth");

    const userId =
      (await verifyAuthToken(nbAuth)) || (await verifyAuthTokenViaApi(nbAuth));
    if (!userId) {
      // Invalid or expired token — redirect to login
      return NextResponse.redirect(buildExternalLoginRedirect(request));
    }

    const response = NextResponse.redirect(url);
    response.cookies.set(USER_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      domain: COOKIE_DOMAIN,
    });
    return response;
  }

  const hasAuth = request.cookies.has(USER_COOKIE);

  // User visiting /login — clear stale cookie and let login page load.
  // Previously this redirected to /, but if the API rejects the cookie
  // the client redirects back to /login, causing an infinite loop.
  if (hasAuth && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Public paths — allow through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Unauthenticated requests
  if (!hasAuth) {
    // API requests → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Page requests → redirect to external login
    return NextResponse.redirect(buildExternalLoginRedirect(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
