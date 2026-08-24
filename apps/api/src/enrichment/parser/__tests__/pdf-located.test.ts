import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { parsePdfLocated } from "../pdf-located";

const FIXTURE = join(__dirname, "fixtures/sample.pdf");

describe("parsePdfLocated", () => {
  it("returns one entry per page with sequential 1-based page numbers", async () => {
    const pages = await parsePdfLocated(FIXTURE);
    expect(pages.length).toBeGreaterThan(0);
    pages.forEach((p, i) => {
      expect(p.page).toBe(i + 1);
      expect(typeof p.text).toBe("string");
    });
    expect(pages.some((p) => p.text.trim().length > 0)).toBe(true);
  });

  it("locates a token on the page it actually appears on", async () => {
    const pages = await parsePdfLocated(FIXTURE);
    const withText = pages.find((p) => p.text.trim().split(/\s+/).length > 2)!;
    const token = withText.text.trim().split(/\s+/)[0];
    const found = pages.filter((p) => p.text.includes(token)).map((p) => p.page);
    expect(found).toContain(withText.page);
  });
});
