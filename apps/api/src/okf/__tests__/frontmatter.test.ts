import { describe, it, expect } from "vitest";
import { renderFrontmatter } from "../render/frontmatter";

describe("renderFrontmatter", () => {
  it("emits a YAML block with array tags and scalar fields", () => {
    const out = renderFrontmatter({
      type: "officials",
      title: "Babajide Sanwo-Olu",
      description: "Governor of Lagos State (APC)",
      resource: "https://app.ournigeria.ng/officials/babajide-sanwo-olu",
      tags: ["lagos", "apc", "governor"],
      timestamp: "2026-06-19T00:00:00Z",
      completeness: 0.93,
      state: "lagos",
    });
    expect(out).toBe(
      [
        "---",
        "type: officials",
        "title: Babajide Sanwo-Olu",
        "description: Governor of Lagos State (APC)",
        "resource: https://app.ournigeria.ng/officials/babajide-sanwo-olu",
        "tags: [lagos, apc, governor]",
        "timestamp: 2026-06-19T00:00:00Z",
        "completeness: 0.93",
        "state: lagos",
        "---",
        "",
      ].join("\n"),
    );
  });
  it("quotes strings containing colons or special chars and skips null", () => {
    const out = renderFrontmatter({
      type: "cases",
      title: "EFCC v. Doe: a test",
      description: "x",
      resource: "https://x",
      tags: [],
      timestamp: "2026-06-19T00:00:00Z",
      forum: null,
    });
    expect(out).toContain('title: "EFCC v. Doe: a test"');
    expect(out).toContain("tags: []");
    expect(out).not.toContain("forum:");
  });
});
