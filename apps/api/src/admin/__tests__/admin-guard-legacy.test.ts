import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import { AdminGuard } from "../admin.guard";

const ADMIN_ID = "44444444-4444-4444-4444-444444444444";

function legacyToken(secret: string): string {
  const nonce = "abc123";
  const sig = createHmac("sha256", secret)
    .update(`${ADMIN_ID}:${nonce}`)
    .digest("hex");
  return `${ADMIN_ID}:${nonce}:${sig}`;
}

function makeContext(token: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ cookies: { on_admin_session: token }, headers: {} }),
    }),
  } as never;
}

describe("AdminGuard legacy window (plan 62 §7: default OFF)", () => {
  const prisma = {
    adminUser: { findUnique: vi.fn(async () => ({ id: ADMIN_ID })) },
    adminSession: {
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
    },
  };
  const guard = new AdminGuard(prisma as never);

  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "test-secret-for-legacy-window";
  });
  afterEach(() => {
    delete process.env.LEGACY_ADMIN_SESSIONS;
  });

  it("rejects legacy HMAC tokens by default", async () => {
    delete process.env.LEGACY_ADMIN_SESSIONS;
    await expect(
      guard.canActivate(makeContext(legacyToken(process.env.ADMIN_SESSION_SECRET!))),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects legacy HMAC tokens when the flag is "false"', async () => {
    process.env.LEGACY_ADMIN_SESSIONS = "false";
    await expect(
      guard.canActivate(makeContext(legacyToken(process.env.ADMIN_SESSION_SECRET!))),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts legacy HMAC tokens only with explicit LEGACY_ADMIN_SESSIONS="true"', async () => {
    process.env.LEGACY_ADMIN_SESSIONS = "true";
    await expect(
      guard.canActivate(makeContext(legacyToken(process.env.ADMIN_SESSION_SECRET!))),
    ).resolves.toBe(true);
  });
});
