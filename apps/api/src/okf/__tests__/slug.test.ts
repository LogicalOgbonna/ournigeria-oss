import { describe, it, expect } from "vitest";
import { okfSlug } from "../slug";

describe("okfSlug", () => {
  it("lowercases and dashes spaces", () => {
    expect(okfSlug("Babajide Sanwo-Olu")).toBe("babajide-sanwo-olu");
  });
  it("turns LGA codes like LA/020 into la-020", () => {
    expect(okfSlug("LA/020")).toBe("la-020");
  });
  it("collapses runs of separators and trims them", () => {
    expect(okfSlug("  Foo  --  Bar//  ")).toBe("foo-bar");
  });
  it("is deterministic and idempotent", () => {
    expect(okfSlug(okfSlug("Adamawa State"))).toBe("adamawa-state");
  });
});
