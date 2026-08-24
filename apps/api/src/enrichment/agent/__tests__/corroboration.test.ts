import { describe, it, expect } from "vitest";
import { validateCorroboration } from "../corroboration";
import { getProfile } from "../profiles";

const profile = getProfile("officials");
const src = (host: string, tier: "canonical" | "official" | "web" = "official") =>
  ({ url: `https://${host}/x`, publisher: host, tier });

describe("validateCorroboration", () => {
  it("fill needs >=2 independent official/web sources", () => {
    expect(validateCorroboration({ changeKind: "fill", targetField: "email",
      sources: [src("a.gov.ng")] }, profile).ok).toBe(false);
    expect(validateCorroboration({ changeKind: "fill", targetField: "email",
      sources: [src("a.gov.ng"), src("b.org")] }, profile).ok).toBe(true);
  });

  it("two sources from the SAME publisher are not independent", () => {
    const r = validateCorroboration({ changeKind: "fill", targetField: "email",
      sources: [src("a.gov.ng"), src("a.gov.ng")] }, profile);
    expect(r.ok).toBe(false);
  });

  it("correction needs >=3 independent", () => {
    expect(validateCorroboration({ changeKind: "correction", targetField: "email",
      sources: [src("a.gov.ng"), src("b.org")] }, profile).ok).toBe(false);
    expect(validateCorroboration({ changeKind: "correction", targetField: "email",
      sources: [src("a.gov.ng"), src("b.org"), src("c.ng")] }, profile).ok).toBe(true);
  });

  it("sensitive field uses the stricter bar even for a fill", () => {
    const r = validateCorroboration({ changeKind: "fill", targetField: "date_of_birth",
      sources: [src("a.gov.ng"), src("b.org")] }, profile);
    expect(r.ok).toBe(false); // sensitive fill needs 3
  });

  it("one canonical source satisfies a fill", () => {
    expect(validateCorroboration({ changeKind: "fill", targetField: "email",
      sources: [src("oagf.gov.ng", "canonical")] }, profile).ok).toBe(true);
  });

  it("canonical correction needs a second independent source", () => {
    expect(validateCorroboration({ changeKind: "correction", targetField: "email",
      sources: [src("oagf.gov.ng", "canonical")] }, profile).ok).toBe(false);
    expect(validateCorroboration({ changeKind: "correction", targetField: "email",
      sources: [src("oagf.gov.ng", "canonical"), src("b.org")] }, profile).ok).toBe(true);
  });
});

describe("validateCorroboration — create bar", () => {
  const profile = {
    domain: "councilors", targetTable: "nigerian_officials",
    targetFields: [], sensitiveFields: [],
    trustedDomains: ["absiec.org", "*.gov.ng"], sourceTemplates: [],
  } as const;

  const src = (publisher: string, tier: "canonical" | "official" | "web") =>
    ({ url: `https://${publisher}/x`, publisher, tier });

  it("passes with one authoritative (official) source", () => {
    const r = validateCorroboration(
      { changeKind: "create", targetField: "__create__", sources: [src("absiec.org", "official")] },
      profile as any,
    );
    expect(r.ok).toBe(true);
  });

  it("passes with two independent web sources", () => {
    const r = validateCorroboration(
      { changeKind: "create", targetField: "__create__", sources: [src("dailypost.ng", "web"), src("thisdaylive.com", "web")] },
      profile as any,
    );
    expect(r.ok).toBe(true);
  });

  it("fails with a single web source", () => {
    const r = validateCorroboration(
      { changeKind: "create", targetField: "__create__", sources: [src("dailypost.ng", "web")] },
      profile as any,
    );
    expect(r.ok).toBe(false);
  });

  it("fails with two web pages from the same publisher", () => {
    const r = validateCorroboration(
      { changeKind: "create", targetField: "__create__", sources: [src("dailypost.ng", "web"), src("dailypost.ng", "web")] },
      profile as any,
    );
    expect(r.ok).toBe(false);
  });
});
