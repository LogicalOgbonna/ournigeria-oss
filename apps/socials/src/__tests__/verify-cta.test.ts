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

// UTM suffix appended to every verify-CTA link. utm_content varies by geo
// level, so it's asserted per-case below.
const UTM = "utm_source=x&utm_medium=social&utm_campaign=verify_cta";

describe("buildVerifyUrl", () => {
  it("single state + year -> /states/<state>?year=&utm...", () => {
    expect(buildVerifyUrl("faac", [call({ state: "abia", year: 2026 })])).toBe(
      `https://ournigeria.ng/states/abia?year=2026&${UTM}&utm_content=state`,
    );
  });

  it("LGA -> /states/<state>/<lga>?year=&utm...", () => {
    expect(
      buildVerifyUrl("faac", [call({ state: "kano", lga: "Gaya", year: 2026 })]),
    ).toBe(`https://ournigeria.ng/states/kano/gaya?year=2026&${UTM}&utm_content=lga`);
  });

  it("multi-state -> /states overview with national utm_content", () => {
    expect(
      buildVerifyUrl("faac", [
        call({ state: "delta", year: 2026 }),
        call({ state: "lagos", year: 2026 }),
      ]),
    ).toBe(`https://ournigeria.ng/states?year=2026&${UTM}&utm_content=national`);
  });

  it("uses the most recent year cited", () => {
    expect(
      buildVerifyUrl("faac", [call({ state: "kano", year: 2025 }), call({ year: 2026 })]),
    ).toBe(`https://ournigeria.ng/states/kano?year=2026&${UTM}&utm_content=state`);
  });

  it("omits ?year when none cited but still carries utm params", () => {
    expect(buildVerifyUrl("faac", [call({ state: "abia" })])).toBe(
      `https://ournigeria.ng/states/abia?${UTM}&utm_content=state`,
    );
  });

  it("tags traffic with utm so analytics can attribute the X CTA", () => {
    const url = buildVerifyUrl("faac", [call({ state: "abia", year: 2026 })])!;
    const params = new URL(url).searchParams;
    expect(params.get("utm_source")).toBe("x");
    expect(params.get("utm_medium")).toBe("social");
    expect(params.get("utm_campaign")).toBe("verify_cta");
    expect(params.get("utm_content")).toBe("state");
  });

  it("returns null for non-faac domains and when no faac_search ran", () => {
    expect(buildVerifyUrl("budget", [call({ state: "abia" })])).toBeNull();
    expect(buildVerifyUrl("faac", [])).toBeNull();
  });
});

describe("appendVerifyCta", () => {
  const URL_WITH_UTM =
    "https://ournigeria.ng/states/abia?year=2026&utm_source=x&utm_medium=social&utm_campaign=verify_cta&utm_content=state";
  it("appends the CTA as its own paragraph", () => {
    expect(appendVerifyCta("Abia got ₦16B/mo.", URL_WITH_UTM)).toBe(
      `Abia got ₦16B/mo.\n\nVerify on OurNigeria: ${URL_WITH_UTM}`,
    );
  });
  it("is a no-op when url is null or already present", () => {
    expect(appendVerifyCta("x", null)).toBe("x");
    const withUrl = `see ${URL_WITH_UTM}`;
    expect(appendVerifyCta(withUrl, URL_WITH_UTM)).toBe(withUrl);
  });
});
