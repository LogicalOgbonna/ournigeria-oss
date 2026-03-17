/**
 * Returns the URL for client-side API calls.
 *
 * Always returns a relative path so requests go through the Next.js
 * rewrite proxy (configured in next.config.ts). This ensures:
 * - Cookies are set on the web domain (not the API domain)
 * - The proxy.ts auth checks see the session cookie
 * - No cross-origin cookie issues with SameSite/Secure
 */
export function apiUrl(path: string): string {
  return path;
}
