import { describe, expect, it, vi } from "vitest";
import { lastValueFrom, of, throwError } from "rxjs";
import { AuditBackstopInterceptor } from "../audit-backstop.interceptor";

function makeContext(req: Record<string, unknown>) {
  return {
    getType: () => "http",
    switchToHttp: () => ({ getRequest: () => req }),
  } as never;
}

function makeInterceptor() {
  const audit = { logBestEffort: vi.fn(async () => null) };
  return { audit, interceptor: new AuditBackstopInterceptor(audit as never) };
}

describe("AuditBackstopInterceptor", () => {
  it("logs an unaudited admin mutation with redacted body", async () => {
    const { audit, interceptor } = makeInterceptor();
    const req = {
      method: "POST",
      adminId: "admin-1",
      route: { path: "/api/admin/settings/bulk" },
      body: { value: "ok", apiKey: "SECRET" },
      headers: {},
    };
    await lastValueFrom(
      interceptor.intercept(makeContext(req), { handle: () => of({ ok: true }) }),
    );
    expect(audit.logBestEffort).toHaveBeenCalledTimes(1);
    const [, event] = audit.logBestEffort.mock.calls[0] as [unknown, any];
    expect(event.action).toBe("admin.post");
    expect(event.metadata.backstop).toBe(true);
    expect(event.metadata.body.apiKey).toBe("[REDACTED]");
    expect(event.metadata.body.value).toBe("ok");
  });

  it("stays silent when the handler logged explicitly (__audited)", async () => {
    const { audit, interceptor } = makeInterceptor();
    const req = { method: "DELETE", adminId: "a", __audited: true, headers: {} };
    await lastValueFrom(
      interceptor.intercept(makeContext(req), { handle: () => of(1) }),
    );
    expect(audit.logBestEffort).not.toHaveBeenCalled();
  });

  it("ignores GETs and non-admin requests", async () => {
    const { audit, interceptor } = makeInterceptor();
    await lastValueFrom(
      interceptor.intercept(makeContext({ method: "GET", adminId: "a", headers: {} }), {
        handle: () => of(1),
      }),
    );
    await lastValueFrom(
      interceptor.intercept(makeContext({ method: "POST", headers: {} }), {
        handle: () => of(1),
      }),
    );
    expect(audit.logBestEffort).not.toHaveBeenCalled();
  });

  it("logs errored mutations with outcome=error", async () => {
    const { audit, interceptor } = makeInterceptor();
    const req = { method: "PATCH", adminId: "a", route: { path: "/x" }, headers: {} };
    await expect(
      lastValueFrom(
        interceptor.intercept(makeContext(req), {
          handle: () => throwError(() => new Error("boom")),
        }),
      ),
    ).rejects.toThrow("boom");
    const [, event] = audit.logBestEffort.mock.calls[0] as [unknown, any];
    expect(event.metadata.outcome).toBe("error");
  });
});
