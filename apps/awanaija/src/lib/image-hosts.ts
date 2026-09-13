/**
 * Mirror of `images.remotePatterns` in next.config.ts (https hosts only).
 * next/image's default loader throws at render for any other host, so pages
 * that draw stored or hotlinked images pass `unoptimized` for those and keep
 * the optimizer for these. Keep the two lists in sync.
 */
export const OPTIMIZED_IMAGE_HOSTS: readonly string[] = ["cdn.ournigeria.ng", "nass.gov.ng"];

/** True when next/image may optimize `src`: a /public path or an https host in the allowlist. */
export function isOptimizedImageSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    const u = new URL(src);
    return u.protocol === "https:" && OPTIMIZED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}
