import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_COOKIE = "nb_uid";

const PUBLIC_PATHS = ["/login", "/api/auth/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
