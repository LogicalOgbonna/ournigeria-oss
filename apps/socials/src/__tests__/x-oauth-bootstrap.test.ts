import { describe, it, expect } from "vitest";
import { decideBootstrapWrite } from "../scripts/x-oauth-bootstrap.js";

describe("decideBootstrapWrite — bootstrap clobber guard", () => {
  it("writes when no token row exists", () => {
    const d = decideBootstrapWrite(null, false);
    expect(d.write).toBe(true);
    expect(d.reason).toMatch(/no existing token row/i);
  });

  it("REFUSES to overwrite an existing row without --force", () => {
    const d = decideBootstrapWrite({ rotatedAt: new Date("2026-06-19T22:00:00Z") }, false);
    expect(d.write).toBe(false);
    expect(d.reason).toMatch(/refusing to overwrite/i);
    // points the user at the correct recovery
    expect(d.reason).toMatch(/x-oauth-authorize/);
  });

  it("overwrites an existing row when --force is passed", () => {
    const d = decideBootstrapWrite({ rotatedAt: new Date("2026-06-19T22:00:00Z") }, true);
    expect(d.write).toBe(true);
    expect(d.reason).toMatch(/force/i);
  });
});
