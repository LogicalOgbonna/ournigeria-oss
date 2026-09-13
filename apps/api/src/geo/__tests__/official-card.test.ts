import { describe, expect, it } from "vitest";
import { formatTerm, normalizeXHandle, officialCardExtras } from "../official-card";

describe("normalizeXHandle", () => {
  it("passes through a bare handle", () => {
    expect(normalizeXHandle("CCSoludo")).toBe("CCSoludo");
    expect(normalizeXHandle("SenBalaMohammed")).toBe("SenBalaMohammed");
  });

  it("strips a leading @", () => {
    expect(normalizeXHandle("@jidesanwoolu")).toBe("jidesanwoolu");
  });

  it("extracts the handle from x.com and twitter.com URLs", () => {
    expect(normalizeXHandle("https://x.com/AAdeleke_01")).toBe("AAdeleke_01");
    expect(normalizeXHandle("https://twitter.com/AAdeleke_01")).toBe("AAdeleke_01");
    expect(normalizeXHandle("https://www.x.com/AAdeleke_01/")).toBe("AAdeleke_01");
    expect(normalizeXHandle("https://x.com/AAdeleke_01?ref_src=twsrc%5Etfw")).toBe("AAdeleke_01");
  });

  it("drops the National Assembly embed widget scraped onto 226 members", () => {
    // nass.gov.ng renders the Assembly's own timeline widget on every member
    // page; the scraper stored its link as each member's personal handle.
    // Rendering it would point citizens at the Assembly press office while they
    // believe they are contacting their own representative.
    expect(normalizeXHandle("https://x.com/nassnigeria?ref_src=twsrc%5Etfw")).toBeNull();
    expect(normalizeXHandle("nassnigeria")).toBeNull();
    expect(normalizeXHandle("@NASSNigeria")).toBeNull();
  });

  it("rejects non-X URLs", () => {
    expect(normalizeXHandle("https://facebook.com/someone")).toBeNull();
    expect(normalizeXHandle("https://x.com.evil.test/someone")).toBeNull();
  });

  it("rejects values that are not shaped like an X handle", () => {
    expect(normalizeXHandle("a name with spaces")).toBeNull();
    expect(normalizeXHandle("waytoolongtobeahandle123")).toBeNull();
    expect(normalizeXHandle("https://x.com/")).toBeNull();
    expect(normalizeXHandle("not a url ::")).toBeNull();
  });

  it("returns null for empty and non-string input", () => {
    expect(normalizeXHandle(null)).toBeNull();
    expect(normalizeXHandle(undefined)).toBeNull();
    expect(normalizeXHandle("")).toBeNull();
    expect(normalizeXHandle("   ")).toBeNull();
    expect(normalizeXHandle(42)).toBeNull();
  });
});

describe("formatTerm", () => {
  it("reads as start-to-Present while the official is still serving", () => {
    // end_date is set on 1 of 2,358 active positions — a term's end is not
    // recorded per position, so we must not invent one.
    expect(formatTerm(new Date("2023-06-13"), null)).toBe("2023 - Present");
    expect(formatTerm(new Date("2025-03-24"))).toBe("2025 - Present");
  });

  it("shows both years once the term has ended", () => {
    expect(formatTerm(new Date("2019-06-11"), new Date("2023-06-13"))).toBe("2019 - 2023");
  });

  it("is null without a start date, so the card omits the line entirely", () => {
    expect(formatTerm(null)).toBeNull();
    expect(formatTerm(undefined, new Date("2023-06-13"))).toBeNull();
  });
});

describe("officialCardExtras", () => {
  const position = (
    official: Record<string, unknown>,
    leadershipRole: string | null = null,
    startDate: Date | null = null,
    endDate: Date | null = null,
  ) => ({ leadershipRole, startDate, endDate, official });

  it("carries contact, leadership role and completeness", () => {
    expect(
      officialCardExtras(
        position(
          {
            email: "rep@example.com",
            phoneNumber: "08033069103",
            twitterHandle: "@arep",
            completenessScore: "0.57",
          },
          "Deputy Speaker",
          new Date("2023-06-13"),
        ),
      ),
    ).toEqual({
      term: "2023 - Present",
      leadershipRole: "Deputy Speaker",
      email: "rep@example.com",
      phone: "08033069103",
      twitter: "arep",
      completeness: 0.57,
    });
  });

  it("coerces the Decimal completeness score to a number", () => {
    // Prisma hands back a Decimal, which would otherwise serialise as a string.
    const { completeness } = officialCardExtras(position({ completenessScore: "0.14" }));
    expect(completeness).toBe(0.14);
    expect(typeof completeness).toBe("number");
  });

  it("nulls every field an official has no value for", () => {
    expect(officialCardExtras(position({}))).toEqual({
      term: null,
      leadershipRole: null,
      email: null,
      phone: null,
      twitter: null,
      completeness: null,
    });
  });

  it("does not turn a missing completeness score into 0", () => {
    // 0 is a meaningful score; null means "not scored" and must stay distinct.
    expect(officialCardExtras(position({ completenessScore: null })).completeness).toBeNull();
    expect(officialCardExtras(position({ completenessScore: "0" })).completeness).toBe(0);
  });
});
