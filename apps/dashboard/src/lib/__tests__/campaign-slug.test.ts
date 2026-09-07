import { describe, expect, it } from "vitest";
import { deriveTicketSlug, slugError, SLUG_RE } from "@/lib/campaign-slug";

/**
 * The form shows the slug the API would derive, so these cases mirror
 * admin-campaigns.service `deriveSlug` (surname-surname with a mate, the whole
 * name without one) over `slugifyName` from @ournigeria/database.
 */
describe("deriveTicketSlug", () => {
  it("joins the two surnames", () => {
    expect(deriveTicketSlug("Peter Gregory Obi", "Yusuf Datti Baba-Ahmed")).toBe("obi-baba-ahmed");
  });

  it("slugifies the whole name when there is no running mate", () => {
    expect(deriveTicketSlug("Peter Obi", null)).toBe("peter-obi");
    expect(deriveTicketSlug("Peter Obi", "   ")).toBe("peter-obi");
  });

  it("folds diacritics and drops apostrophes the way the API does", () => {
    expect(deriveTicketSlug("Bọ́lá Tinúbú", "Kashim Shettima")).toBe("tinubu-shettima");
    expect(deriveTicketSlug("N'Golo O'Brien", null)).toBe("ngolo-obrien");
  });

  it("never emits a leading or trailing dash for a name that folds away", () => {
    expect(deriveTicketSlug("???", "QA Deputy")).toBe("deputy");
    expect(SLUG_RE.test(deriveTicketSlug("???", "QA Deputy"))).toBe(true);
  });

  it("caps the join at 160 and re-trims a dash the cut left behind", () => {
    // The candidate surname folds to the per-part cap (120 chars); the mate's
    // is hyphenated, so the 160-char cut lands exactly on that inner dash.
    const slug = deriveTicketSlug(`Long ${"a".repeat(130)}`, `Long ${"b".repeat(38)}-${"c".repeat(10)}`);
    expect(slug.length).toBe(159);
    expect(slug.endsWith("-")).toBe(false);
    expect(SLUG_RE.test(slug)).toBe(true);
  });

  it("is empty when there is no candidate yet", () => {
    expect(deriveTicketSlug("", "QA Deputy")).toBe("");
    expect(deriveTicketSlug(null, null)).toBe("");
  });
});

describe("slugError", () => {
  it("accepts what the API's SLUG_RE accepts", () => {
    expect(slugError("obi-baba-ahmed")).toBeNull();
    expect(slugError("a1")).toBeNull();
  });

  it("rejects the shapes createSchema would 400 on", () => {
    for (const bad of ["", "a", "-obi", "obi-", "obi--ahmed", "Obi", "obi ahmed", "obi_ahmed"]) {
      expect(slugError(bad), bad).not.toBeNull();
    }
    expect(slugError("a".repeat(161))).not.toBeNull();
  });
});
