import { describe, it, expect } from "vitest";
import { renderViz } from "../render/viz";

describe("renderViz", () => {
  it("embeds the bundle JSON and references Cytoscape + marked from CDN", () => {
    const html = renderViz({ "officials/ada.md": "---\ntype: officials\ntitle: Ada\n---\n[Lagos](/states/lagos.md)" });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("cytoscape");
    expect(html).toContain("marked");
    expect(html).toContain("officials/ada.md");
  });
  it("escapes </script> in embedded data so the page can't break out", () => {
    const html = renderViz({ "x.md": "evil </script> payload" });
    expect(html).not.toContain("</script> payload");
    expect(html).toContain("<\\/script>");
  });
});
