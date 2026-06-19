import { describe, it, expect } from "vitest";
import { renderTypeIndex, renderRootIndex, findDanglingLinks } from "../render/index-docs";

describe("index docs", () => {
  it("renders an alphabetical type index linking each node", () => {
    const md = renderTypeIndex("officials", [
      { slug: "zubair", title: "Zubair" },
      { slug: "ada", title: "Ada" },
    ]);
    expect(md.indexOf("Ada")).toBeLessThan(md.indexOf("Zubair"));
    expect(md).toContain("[Ada](/officials/ada.md)");
  });
  it("renders a root index with per-type counts", () => {
    const md = renderRootIndex({ officials: 2, cases: 1, parties: 0, states: 37, lgas: 3 });
    expect(md).toContain("officials");
    expect(md).toContain("37");
  });
});

describe("findDanglingLinks", () => {
  it("returns internal links that point to non-existent bundle files", () => {
    const bundle = new Map<string, string>([
      ["officials/ada.md", "see [Lagos](/states/lagos.md) and [Ghost](/officials/ghost.md)"],
      ["states/lagos.md", "# Lagos"],
    ]);
    const dangling = findDanglingLinks(bundle);
    expect(dangling).toEqual([{ from: "officials/ada.md", to: "officials/ghost.md" }]);
  });
});
