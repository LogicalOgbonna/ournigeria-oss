import { describe, it, expect } from "vitest";
import {
  ognSlug,
  buildVerifyUrl,
  appendVerifyCta,
} from "../intelligence/agent.service.js";

const call = (args: Record<string, unknown>) => ({ name: "faac_search", args });

describe("ognSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(ognSlug("Abia")).toBe("abia");
    expect(ognSlug("Akwa Ibom")).toBe("akwa-ibom");
    expect(ognSlug("Cross River")).toBe("cross-river");
  });
});

describe("buildVerifyUrl", () => {
  it("single state + year -> /states/<state>?year=", () => {
    expect(buildVerifyUrl("faac", [call({ state: "abia", year: 2026 })])).toBe(
      "https://ournigeria.ng/states/abia?year=2026",
    );
  });

  it("LGA -> /states/<state>/<lga>?year=", () => {
    expect(
      buildVerifyUrl("faac", [call({ state: "kano", lga: "Gaya", year: 2026 })]),
    ).toBe("https://ournigeria.ng/states/kano/gaya?year=2026");
  });

  it("multi-state -> /states overview", () => {
    expect(
      buildVerifyUrl("faac", [
        call({ state: "delta", year: 2026 }),
        call({ state: "lagos", year: 2026 }),
      ]),
    ).toBe("https://ournigeria.ng/states?year=2026");
  });

  it("uses the most recent year cited", () => {
    expect(
      buildVerifyUrl("faac", [call({ state: "kano", year: 2025 }), call({ year: 2026 })]),
    ).toBe("https://ournigeria.ng/states/kano?year=2026");
  });

  it("returns null for non-faac domains and when no faac_search ran", () => {
    expect(buildVerifyUrl("budget", [call({ state: "abia" })])).toBeNull();
    expect(buildVerifyUrl("faac", [])).toBeNull();
  });
});

describe("appendVerifyCta", () => {
  it("appends the CTA as its own paragraph", () => {
    expect(appendVerifyCta("Abia got ₦16B/mo.", "https://ournigeria.ng/states/abia?year=2026"))
      .toBe("Abia got ₦16B/mo.\n\nVerify on OurNigeria: https://ournigeria.ng/states/abia?year=2026");
  });
  it("is a no-op when url is null or already present", () => {
    expect(appendVerifyCta("x", null)).toBe("x");
    const withUrl = "see https://ournigeria.ng/states/abia?year=2026";
    expect(appendVerifyCta(withUrl, "https://ournigeria.ng/states/abia?year=2026")).toBe(withUrl);
  });
});
