import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export const LOCAL_STORAGE_PATH_PREFIX = "/api/storage/local/";

/**
 * CORS for the dev-only local storage route. The browser PUTs straight at
 * the API from whatever origin the dashboard runs on (`https://dashboard.localhost`,
 * a tunnel…) and the request is gated by the HMAC in the URL, not by cookies,
 * so any origin may PUT/GET here WITHOUT credentials. Everything else keeps
 * the credentialed `CORS_ORIGINS` allowlist. S3/R2 do the same job with a
 * bucket CORS rule.
 */
export function corsOptionsFor(req: { originalUrl?: string; url?: string }, allowedOrigins: string[]): CorsOptions {
  const path = (req.originalUrl ?? req.url ?? "").split("?")[0];
  if (path.startsWith(LOCAL_STORAGE_PATH_PREFIX)) {
    return { origin: true, credentials: false, methods: ["GET", "PUT", "OPTIONS"], allowedHeaders: ["content-type", "content-length"], maxAge: 600 };
  }
  return { origin: allowedOrigins, credentials: true };
}
