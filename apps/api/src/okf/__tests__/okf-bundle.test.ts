import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { writeBundle } from "../okf-bundle";

const dir = mkdtempSync(join(tmpdir(), "okf-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("writeBundle", () => {
  it("writes every bundle entry to disk under nested dirs", () => {
    const bundle = new Map<string, string>([
      ["index.md", "# root"],
      ["officials/ada.md", "# Ada"],
      ["viz.html", "<html></html>"],
    ]);
    writeBundle(bundle, dir);
    expect(existsSync(join(dir, "officials/ada.md"))).toBe(true);
    expect(readFileSync(join(dir, "index.md"), "utf8")).toBe("# root");
  });
});
