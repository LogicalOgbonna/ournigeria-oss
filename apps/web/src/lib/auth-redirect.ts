/**
 * Centralized 401 redirect handler.
 *
 * Multiple fetch calls can receive 401 simultaneously (conversations,
 * notifications, banners). Without dedup, each would call
 * window.location.replace("/login"), causing the page to thrash.
 *
 * This module ensures only ONE hard redirect happens.
 */
let redirecting = false;

function getLoginUrl() {
  const base =
    process.env.NEXT_PUBLIC_LOGIN_URL || "https://ournigeria.arinze.online/login";

  if (globalThis.window === undefined) return base;

  const url = new URL(base);
  url.searchParams.set("returnTo", globalThis.location.href);
  return url.toString();
}

export function redirectToLogin() {
  if (redirecting) return;
  if (globalThis.window === undefined) return;
  if (
    globalThis.location.pathname === "/login" ||
    globalThis.location.pathname === "/banned"
  )
    return;
  redirecting = true;
  globalThis.location.replace(getLoginUrl());
}

export function isRedirecting() {
  return redirecting;
}
