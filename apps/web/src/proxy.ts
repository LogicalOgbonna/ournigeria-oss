import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_COOKIE = "nb_uid";

const PUBLIC_PATHS = ["/login", "/api/auth/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle Telegram auth callback — set cookie from query param and strip it
  const nbAuth = searchParams.get("nb_auth");
  if (nbAuth) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("nb_auth");
    const response = NextResponse.redirect(url);
    response.cookies.set(USER_COOKIE, nbAuth, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  const hasAuth = request.cookies.has(USER_COOKIE);

  // Authenticated users visiting /login → redirect to /
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
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }
    // Page requests → redirect to /login
    return NextResponse.redirect(new URL("/login", request.url));
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
