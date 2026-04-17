import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";

const MAX_TOKEN_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function verifyAdminToken(token: string): Promise<boolean> {
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [adminId, nonce, sig] = parts;
  if (!adminId || !nonce || !sig) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    // No secret configured — accept valid-shaped tokens (format check only)
    return true;
  }

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
    encoder.encode(`${adminId}:${nonce}`),
  );
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return sig === expected;
}

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
