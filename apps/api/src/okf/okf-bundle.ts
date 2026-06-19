import { mkdirSync, writeFileSync, rmSync } from "fs";
import { dirname, join } from "path";
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

/** Tar the bundle dir into tarPath (deterministic ordering via --sort=name). */
export function tarBundle(outDir: string, tarPath: string): void {
  execFileSync("tar", ["--sort=name", "-czf", tarPath, "-C", outDir, "."], { stdio: "inherit" });
}
