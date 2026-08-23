import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_COOKIE = "nb_uid";
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || undefined;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://spending-api.arinze.online";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://spending.arinze.online";
const EXTERNAL_LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL || "https://ournigeria.arinze.online/login";

/**
 * Origins allowed to POST a login handoff here: our own app, the awanaija login
 * page, and the API (its Telegram callback auto-submits the form). An Origin
 * outside this set is a cross-site login-CSRF attempt and is rejected.
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // some same-origin/browser cases omit Origin
  const allowed = new Set<string>();
  for (const u of [APP_URL, EXTERNAL_LOGIN_URL, API_URL]) {
    try {
      allowed.add(new URL(u).origin);
    } catch {}
  }
  return allowed.has(origin);
}

/** Only allow redirects back to our own app origin. */
function safeReturnTo(raw: string | null): string {
  const appOrigin = new URL(APP_URL).origin;
  if (!raw) return `${appOrigin}/`;
  try {
    const target = new URL(raw, appOrigin);
    if (target.origin === appOrigin) return target.toString();
  } catch {}
  return `${appOrigin}/`;
}

/**
 * Cross-origin login handoff (POST body, not URL query param).
 *
 * The awanaija login page / Telegram callback POST a one-time opaque `code`
 * here. We exchange it server-side for an opaque session token and set the
 * web-domain session cookie. The code never appears in a URL, browser history,
 * Referer, or proxy log.
 */
export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.redirect(new URL(EXTERNAL_LOGIN_URL), { status: 303 });
  }

  const form = await request.formData().catch(() => null);
  const code = form?.get("code");
  const returnTo = safeReturnTo(
    typeof form?.get("returnTo") === "string" ? (form!.get("returnTo") as string) : null,
  );

  if (typeof code !== "string" || !code) {
    return NextResponse.redirect(new URL(EXTERNAL_LOGIN_URL), { status: 303 });
  }

  let sessionToken: string | null = null;
  try {
    const res = await fetch(`${API_URL}/api/auth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { sessionToken?: string };
      sessionToken = data.sessionToken ?? null;
    }
  } catch {
    sessionToken = null;
  }

  if (!sessionToken) {
    const loginUrl = new URL(EXTERNAL_LOGIN_URL);
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  // 303 so the browser follows with GET after this POST.
  const response = NextResponse.redirect(returnTo, { status: 303 });
  response.cookies.set(USER_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    domain: COOKIE_DOMAIN,
  });
  return response;
}
