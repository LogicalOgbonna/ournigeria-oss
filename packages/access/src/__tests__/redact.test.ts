import { describe, expect, it } from "vitest";
import { redactSecrets } from "../redact";
import { sensitiveFieldsFor } from "../sensitive-fields";

describe("redactSecrets", () => {
  it("strips secret-looking keys at any depth", () => {
    const out = redactSecrets({
      name: "ok",
      password: "hunter2",
      nested: { apiKey: "k", authorization: "Bearer x", keep: 1 },
    }) as Record<string, unknown>;
    expect(out.password).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).apiKey).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).authorization).toBe(
      "[REDACTED]",
    );
    expect((out.nested as Record<string, unknown>).keep).toBe(1);
    expect(out.name).toBe("ok");
  });

  it("bounds depth and string size", () => {
    let deep: Record<string, unknown> = { v: 1 };
    for (let i = 0; i < 10; i++) deep = { child: deep };
    expect(JSON.stringify(redactSecrets(deep))).toContain("[TRUNCATED]");
    const long = redactSecrets({ s: "x".repeat(5000) }) as { s: string };
    expect(long.s.length).toBeLessThan(2100);
  });

  it("passes primitives and arrays through", () => {
    expect(redactSecrets(42)).toBe(42);
    expect(redactSecrets([{ token: "x" }])).toEqual([{ token: "[REDACTED]" }]);
  });
});

describe("sensitiveFieldsFor", () => {
  it("returns fields for known types and [] for unknown", () => {
    expect(sensitiveFieldsFor("user")).toContain("phoneNumber");
    expect(sensitiveFieldsFor("official")).toEqual([]);
  });
});
