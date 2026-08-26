import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyAdminToken } from "@/lib/admin-token";
import { ADMIN_SESSION_PREFIX } from "@/lib/constants";

describe("verifyAdminToken — opaque server-stored tokens (OWASP A07)", () => {
  it("accepts a real-shaped opaque `ons_` session token", async () => {
    // The api issues ADMIN_SESSION_PREFIX + base64url(32 bytes). This exact
    // shape used to bounce the login loop because the middleware split on ":"
    // and demanded 3 parts — an opaque token has none.
    const token = `${ADMIN_SESSION_PREFIX}UZ1-YG27nMHJ6R0yb8rgsHu3U0iLv8P3HM9hhfHugMs`;
    expect(await verifyAdminToken(token)).toBe(true);
  });

  it("rejects the bare prefix with no entropy", async () => {
    expect(await verifyAdminToken(ADMIN_SESSION_PREFIX)).toBe(false);
  });

  it("rejects an empty token", async () => {
    expect(await verifyAdminToken("")).toBe(false);
  });
});

describe("verifyAdminToken — legacy stateless-HMAC tokens", () => {
  const OLD_SECRET = process.env.ADMIN_SESSION_SECRET;
  afterEach(() => {
    if (OLD_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = OLD_SECRET;
  });

  it("accepts any 3-part token when no secret is configured (format-only gate)", async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    expect(await verifyAdminToken("admin-id:nonce:whatever")).toBe(true);
  });

  it("rejects a malformed 2-part token", async () => {
    expect(await verifyAdminToken("admin-id:nonce")).toBe(false);
  });

  it("verifies the HMAC signature when a secret is configured", async () => {
    const secret = "test-admin-session-secret";
    process.env.ADMIN_SESSION_SECRET = secret;
    const adminId = "admin-1";
    const nonce = "nonce-1";

    // Recompute the expected signature the same way the verifier does.
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${adminId}:${nonce}`),
    );
    const sig = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    expect(await verifyAdminToken(`${adminId}:${nonce}:${sig}`)).toBe(true);
    expect(await verifyAdminToken(`${adminId}:${nonce}:deadbeef`)).toBe(false);
  });
});
