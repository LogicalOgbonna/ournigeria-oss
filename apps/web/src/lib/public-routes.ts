/**
 * Public route detection for client-side auth behavior.
 *
 * Pages that should be accessible without authentication should have
 * their path prefixes listed here. Used by NotificationContext and
 * FeedbackFab to avoid triggering login redirects on public pages.
 */
const PUBLIC_PATH_PREFIXES = ["/chat/", "/login", "/banned"];

export function isPublicRoute(pathname?: string): boolean {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}
