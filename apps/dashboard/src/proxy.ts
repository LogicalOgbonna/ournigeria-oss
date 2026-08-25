import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import { verifyAdminToken } from "@/lib/admin-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /api/ingest/* routes — return 401 JSON for unauthenticated requests
  if (pathname.startsWith("/api/ingest")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 },
      );
    }
  }

  // Protect /dashboard routes — redirect to login
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/ingest/:path*"],
};
