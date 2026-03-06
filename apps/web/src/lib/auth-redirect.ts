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

export function redirectToLogin() {
  if (redirecting) return;
  if (typeof window === "undefined") return;
  if (
    window.location.pathname === "/login" ||
    window.location.pathname === "/banned"
  )
    return;
  redirecting = true;
  window.location.replace("/login");
}

export function isRedirecting() {
  return redirecting;
}
