import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { contentTypeFor, collectFiles, commitMessageFor, hasChanges } from "../okf-publish.service";

const dirs: string[] = [];
function tmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(d);
  return d;
}
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("publish helpers", () => {
  it("maps extensions to content types", () => {
    expect(contentTypeFor("viz.html")).toBe("text/html; charset=utf-8");
    expect(contentTypeFor("officials/ada.md")).toBe("text/markdown; charset=utf-8");
    expect(contentTypeFor("bundle.tar.gz")).toBe("application/gzip");
  });
  it("collects nested files as relative keys", () => {
    const dir = tmp("okf-pub-");
    mkdirSync(join(dir, "officials"), { recursive: true });
    writeFileSync(join(dir, "index.md"), "x");
    writeFileSync(join(dir, "officials/ada.md"), "y");
    expect(collectFiles(dir).sort()).toEqual(["index.md", "officials/ada.md"]);
  });
});

describe("git mirror helpers", () => {
  it("builds a dated commit message", () => {
    expect(commitMessageFor("2026-06-19")).toBe("chore: knowledge bundle 2026-06-19");
  });
  it("detects a clean tree as no-change", () => {
    const dir = tmp("okf-git-");
    execSync("git init -q && git config user.email t@t && git config user.name t", { cwd: dir });
    writeFileSync(join(dir, "a"), "x");
    execSync("git add -A && git commit -qm init", { cwd: dir });
    expect(hasChanges(dir)).toBe(false);
    writeFileSync(join(dir, "a"), "y");
    expect(hasChanges(dir)).toBe(true);
  });
});
