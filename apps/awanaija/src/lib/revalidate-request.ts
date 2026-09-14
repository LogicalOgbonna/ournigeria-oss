import { timingSafeEqual } from "crypto";

/**
 * Validation for `POST /api/revalidate` — the API's on-demand cache
 * invalidation hook (dashboard verbs call it so edits show up on the next
 * request instead of waiting out the ISR windows).
 *
 * Kept pure so it unit-tests without Next request context; the route handler
 * is a thin shell over this.
 */

/** Tags the API may invalidate — an allowlist, not a free-for-all. */
const TAG_PATTERNS = [/^election-gate$/, /^campaigns$/, /^campaign:[a-z0-9-]{1,160}$/];
const MAX_ITEMS = 20;

export interface RevalidateRequest {
  readonly tags: string[];
  readonly paths: string[];
}

export type ParseResult =
  | { ok: true; request: RevalidateRequest }
  | { ok: false; status: 401 | 400; error: string };

function secretsMatch(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual demands equal lengths; comparing lengths first would leak
  // only the secret's length, which a 32-byte random secret can afford.
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseRevalidateRequest(
  authHeader: string | null,
  body: unknown,
  secret: string | undefined,
): ParseResult {
  // An unset secret disables the endpoint entirely — never open by default.
  if (!secret) return { ok: false, status: 401, error: "revalidation disabled" };
  const given = authHeader?.replace(/^Bearer\s+/i, "") ?? "";
  if (!given || !secretsMatch(given, secret)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  if (!body || typeof body !== "object") return { ok: false, status: 400, error: "body required" };
  const b = body as Record<string, unknown>;
  const rawTags = Array.isArray(b.tags) ? b.tags : [];
  const rawPaths = Array.isArray(b.paths) ? b.paths : [];
  if (rawTags.length + rawPaths.length === 0) {
    return { ok: false, status: 400, error: "tags or paths required" };
  }
  if (rawTags.length > MAX_ITEMS || rawPaths.length > MAX_ITEMS) {
    return { ok: false, status: 400, error: "too many items" };
  }

  const tags: string[] = [];
  for (const t of rawTags) {
    if (typeof t !== "string" || !TAG_PATTERNS.some((p) => p.test(t))) {
      return { ok: false, status: 400, error: `unknown tag: ${String(t).slice(0, 80)}` };
    }
    tags.push(t);
  }
  const paths: string[] = [];
  for (const p of rawPaths) {
    // Site-relative, no traversal or scheme smuggling.
    if (typeof p !== "string" || !p.startsWith("/") || p.includes("..") || p.length > 200) {
      return { ok: false, status: 400, error: `invalid path: ${String(p).slice(0, 80)}` };
    }
    paths.push(p);
  }
  return { ok: true, request: { tags, paths } };
}
