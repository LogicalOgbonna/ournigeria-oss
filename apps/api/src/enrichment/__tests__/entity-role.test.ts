import { describe, it, expect } from "vitest";
import { normalizeEntityRole, ENTITY_ROLE_BUCKETS } from "../entity-role";

describe("normalizeEntityRole", () => {
  it("passes through canonical buckets unchanged", () => {
    for (const role of ENTITY_ROLE_BUCKETS) {
      expect(normalizeEntityRole(role)).toBe(role);
    }
  });

  it("lower-cases and trims mixed-case / padded input", () => {
    expect(normalizeEntityRole("Governor")).toBe("governor");
    expect(normalizeEntityRole("  SENATOR  ")).toBe("senator");
    expect(normalizeEntityRole("LGA_Chairman")).toBe("lga_chairman");
  });

  it("maps the `rep` alias to `representative`", () => {
    expect(normalizeEntityRole("rep")).toBe("representative");
    expect(normalizeEntityRole("REP")).toBe("representative");
  });

  it("falls back to `unknown` for null / empty / out-of-set values", () => {
    expect(normalizeEntityRole(null)).toBe("unknown");
    expect(normalizeEntityRole(undefined)).toBe("unknown");
    expect(normalizeEntityRole("")).toBe("unknown");
    expect(normalizeEntityRole("   ")).toBe("unknown");
    expect(normalizeEntityRole("president")).toBe("unknown");
    expect(normalizeEntityRole("minister")).toBe("unknown");
  });
});
