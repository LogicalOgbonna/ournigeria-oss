import { describe, it, expect } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { RoamerIngestGuard } from "../platforms/twitter/guards/roamer-ingest.guard.js";

function ctxWith(headers: Record<string, string>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as never;
}

function guardWithKey(key: string) {
  const config = { get: () => key } as never;
  return new RoamerIngestGuard(config);
}

describe("RoamerIngestGuard", () => {
  it("throws when X-Roamer-Key is missing", () => {
    const guard = guardWithKey("secret");
    expect(() => guard.canActivate(ctxWith({}))).toThrow(UnauthorizedException);
  });

  it("throws when X-Roamer-Key is wrong", () => {
    const guard = guardWithKey("secret");
    expect(() => guard.canActivate(ctxWith({ "x-roamer-key": "nope" }))).toThrow(
      UnauthorizedException,
    );
  });

  it("passes with the correct key", () => {
    const guard = guardWithKey("secret");
    expect(guard.canActivate(ctxWith({ "x-roamer-key": "secret" }))).toBe(true);
  });
});
