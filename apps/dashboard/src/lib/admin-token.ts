import { ADMIN_SESSION_PREFIX } from "@/lib/constants";

/**
 * Edge-middleware gate for the admin session cookie.
 *
 * The admin auth system issues two token shapes:
 *
 *  1. Opaque server-stored tokens (`ons_...`, OWASP A07 remediation, api commit
 *     e2592912). These carry no self-verifiable signature — they are resolved
 *     against the `admin_sessions` table by the api's AdminGuard on every data
 *     request. The edge runtime can't reach the DB, so middleware only gates on
 *     well-formed presence; the api remains the authoritative boundary.
 *
 *  2. Legacy stateless-HMAC tokens (`adminId:nonce:sig`), accepted only during
 *     the LEGACY_ADMIN_SESSIONS migration window. These are self-verifiable, so
 *     middleware checks the signature when ADMIN_SESSION_SECRET is configured.
 *
 * Before this function knew about shape (1), every opaque token failed the
 * three-part split and bounced the user back to /login — an infinite loop.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  // Opaque session token: presence + prefix gate. Authoritative validation
  // happens server-side (api AdminGuard) on the requests this page then makes.
  if (token.startsWith(ADMIN_SESSION_PREFIX)) {
    return token.length > ADMIN_SESSION_PREFIX.length;
  }

  // Legacy stateless-HMAC token.
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [adminId, nonce, sig] = parts;
  if (!adminId || !nonce || !sig) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    // No secret configured — accept valid-shaped tokens (format check only).
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
