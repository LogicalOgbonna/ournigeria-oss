import { describe, expect, it, vi } from "vitest";
import { AdminAuthController } from "../admin-auth.controller";

/**
 * Accountability regression (user-reported): logout must be ATTRIBUTED in the
 * audit chain. The logout route is @Public (no AdminGuard), so the controller
 * must resolve the session's admin while revoking it — an auth.logout event
 * with actorId null never appears in /audit/mine and reads as "nobody logged
 * out" in the main log.
 */
describe("admin logout audit attribution", () => {
  function makeController() {
    const authService = {
      // Contract: revokeSession resolves the owning admin (null for unknown
      // or legacy-invalid tokens).
      revokeSession: vi
        .fn()
        .mockResolvedValue({ adminId: "admin-1", sessionId: "sess-1" }),
    };
    const audit = {
      log: vi.fn().mockResolvedValue({ seq: 1 }),
      logBestEffort: vi.fn().mockResolvedValue({ seq: 1 }),
    };
    const prisma = {};
    const controller = new AdminAuthController(
      authService as never,
      audit as never,
      prisma as never,
    );
    return { controller, authService, audit };
  }

  function makeRes() {
    return {
      clearCookie: vi.fn(),
      json: vi.fn().mockImplementation((v: unknown) => v),
      status: vi.fn().mockReturnThis(),
    };
  }

  it("logs auth.logout attributed to the session's admin", async () => {
    const { controller, audit } = makeController();
    const req = {
      cookies: { on_admin_session: "ons_valid_token" },
      headers: { "user-agent": "vitest" },
      ip: "127.0.0.1",
    };
    await controller.logout(req as never, makeRes() as never);

    const call = audit.logBestEffort.mock.calls.find(
      ([, event]: [unknown, { action: string }]) =>
        event.action === "auth.logout",
    );
    expect(call, "auth.logout event must be logged").toBeTruthy();
    const [actor] = call as [{ actorId?: string | null; sessionId?: string | null }, unknown];
    expect(actor.actorId).toBe("admin-1");
    expect(actor.sessionId).toBe("sess-1");
  });

  it("does not fabricate an actor for an unknown token", async () => {
    const { controller, authService, audit } = makeController();
    authService.revokeSession.mockResolvedValue({
      adminId: null,
      sessionId: null,
    });
    const req = {
      cookies: { on_admin_session: "ons_unknown" },
      headers: {},
      ip: "127.0.0.1",
    };
    await controller.logout(req as never, makeRes() as never);

    const call = audit.logBestEffort.mock.calls.find(
      ([, event]: [unknown, { action: string }]) =>
        event.action === "auth.logout",
    );
    expect(call).toBeTruthy();
    const [actor] = call as [{ actorId?: string | null }, unknown];
    expect(actor.actorId ?? null).toBeNull();
  });
});
