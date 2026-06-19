import { mkdirSync, writeFileSync, rmSync, readdirSync, statSync } from "fs";
import { dirname, join, relative, sep } from "path";
import { execFileSync } from "child_process";
import type { Bundle } from "./types";

export function writeBundle(bundle: Bundle, outDir: string): void {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const [rel, contents] of bundle) {
    const abs = join(outDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, contents, "utf8");
  }
}

function relFiles(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...relFiles(abs, base));
    else out.push(relative(base, abs).split(sep).join("/"));
  }
  return out;
}

/**
 * Tar+gzip the bundle dir into tarPath. Uses a sorted file list (`-T`) for a
 * stable member order on any tar (BSD/GNU) — avoids GNU-only `--sort=name`.
 */
export function tarBundle(outDir: string, tarPath: string): void {
  const listPath = `${tarPath}.list`;
  writeFileSync(listPath, relFiles(outDir).sort().join("\n") + "\n");
  try {
    execFileSync("tar", ["-czf", tarPath, "-C", outDir, "-T", listPath], { stdio: "inherit" });
  } finally {
    rmSync(listPath, { force: true });
  }
}
