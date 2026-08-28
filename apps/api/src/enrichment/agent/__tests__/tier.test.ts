import { describe, it, expect } from "vitest";
import { classifyTier, hostnameOf, domainMatches } from "../tier";
import type { EnrichmentProfile } from "../profile.types";

const profile: EnrichmentProfile = {
  domain: "d", targetTable: "t", targetFields: [], sensitiveFields: [],
  trustedDomains: ["*.gov.ng", "nass.gov.ng"],
  sourceTemplates: [{ publisher: "oagf.gov.ng", urlIncludes: "/faac-report", format: "xlsx" }],
};

describe("hostnameOf", () => {
  it("strips protocol, path and leading www", () => {
    expect(hostnameOf("https://www.NASS.gov.ng/members?x=1")).toBe("nass.gov.ng");
  });
});

describe("domainMatches", () => {
  it("matches a wildcard suffix", () => {
    expect(domainMatches("budgetoffice.gov.ng", "*.gov.ng")).toBe(true);
    expect(domainMatches("gov.ng", "*.gov.ng")).toBe(true);
    expect(domainMatches("evil.com", "*.gov.ng")).toBe(false);
  });
  it("matches an exact domain or subdomain", () => {
    expect(domainMatches("nass.gov.ng", "nass.gov.ng")).toBe(true);
    expect(domainMatches("api.nass.gov.ng", "nass.gov.ng")).toBe(true);
    expect(domainMatches("notnass.gov.ng", "nass.gov.ng")).toBe(false);
  });
});

describe("classifyTier", () => {
  it("canonical when the url matches a source template", () => {
    expect(classifyTier("https://oagf.gov.ng/faac-report/2026-05.xlsx", profile)).toBe("canonical");
  });
  it("official when a trusted domain matches but no template", () => {
    expect(classifyTier("https://budgetoffice.gov.ng/officials", profile)).toBe("official");
  });
  it("web for everything else", () => {
    expect(classifyTier("https://medium.com/some-blog", profile)).toBe("web");
  });
});

describe("academic SLD-family patterns (*.edu.* / *.ac.*)", () => {
  it("matches edu/ac second-level domains under any two-letter country TLD", () => {
    expect(domainMatches("unn.edu.ng", "*.edu.*")).toBe(true);
    expect(domainMatches("ug.edu.gh", "*.edu.*")).toBe(true);
    expect(domainMatches("azhar.edu.eg", "*.edu.*")).toBe(true);
    expect(domainMatches("edu.ng", "*.edu.*")).toBe(true); // bare SLD host
    expect(domainMatches("cam.ac.uk", "*.ac.*")).toBe(true);
    expect(domainMatches("iitb.ac.in", "*.ac.*")).toBe(true);
    expect(domainMatches("u-tokyo.ac.jp", "*.ac.*")).toBe(true);
  });

  it("never matches lookalikes or non-country suffixes", () => {
    expect(domainMatches("myedu.ng", "*.edu.*")).toBe(false);   // label boundary
    expect(domainMatches("edu.com", "*.edu.*")).toBe(false);    // commercial, 3-letter TLD
    expect(domainMatches("acme.com", "*.ac.*")).toBe(false);
    expect(domainMatches("scam-ac.uk", "*.ac.*")).toBe(false);
    expect(domainMatches("education.ng", "*.edu.*")).toBe(false);
  });
});
