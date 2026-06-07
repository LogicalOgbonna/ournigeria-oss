#!/usr/bin/env npx tsx
/**
 * Download each state's seal/flag image (from data/state-profiles.json) into the
 * awanaija public folder and write a manifest of the resulting relative paths.
 *
 * Mirrors the governor-image precedent (committed files in public/, served by
 * relative path) rather than hotlinking fragile .gov.ng / Wikimedia URLs.
 *
 * Output:
 *   apps/awanaija/public/states/seals/<code>.<ext>
 *   apps/awanaija/public/states/flags/<code>.<ext>
 *   packages/database/data/state-image-manifest.json  -> { code: { seal, flag } }
 *
 * A failed download leaves that image null in the manifest (seed drops it —
 * a broken image is worse than none, same rule as the research pass).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..", ".."); // repo root
const PROFILES = join(__dirname, "..", "data", "state-profiles.json");
const SEAL_DIR = join(ROOT, "apps", "awanaija", "public", "states", "seals");
const FLAG_DIR = join(ROOT, "apps", "awanaija", "public", "states", "flags");
const MANIFEST = join(__dirname, "..", "data", "state-image-manifest.json");

// Some official sites (e.g. gombestate.gov.ng) 404 without a browser UA.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function extFromUrl(url: string, contentType?: string | null): string {
  const clean = url.split("?")[0].toLowerCase();
  const m = clean.match(/\.(svg|png|jpe?g|webp|gif)$/);
  if (m) return m[1] === "jpeg" ? "jpg" : m[1];
  if (contentType?.includes("svg")) return "svg";
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  return "jpg";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Find an already-downloaded file for this code in the given dir, if any. */
function findExisting(dir: string, code: string): string | null {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir);
  const match = files.find((f) => f.startsWith(code + "."));
  if (!match) return null;
  const kind = dir === SEAL_DIR ? "seals" : "flags";
  return `/states/${kind}/${match}`;
}

async function download(url: string, dir: string, code: string): Promise<string | null> {
  // Skip if already downloaded (resume support)
  const existing = findExisting(dir, code);
  if (existing) {
    console.log(`  ↩ ${code}: already exists, skipping (${existing})`);
    return existing;
  }

  const maxRetries = 3;
  // Cap retry wait at 15s to avoid blocking forever on Wikimedia 429s
  const MAX_WAIT_MS = 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Referer: url } });
      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const rawWait = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000 * attempt;
        const waitMs = Math.min(rawWait, MAX_WAIT_MS);
        console.warn(`  ⏳ ${code}: HTTP 429 (attempt ${attempt}/${maxRetries}), retrying in ${waitMs / 1000}s...`);
        await sleep(waitMs);
        continue;
      }
      if (!res.ok) {
        console.warn(`  ✗ ${code}: HTTP ${res.status} for ${url}`);
        return null;
      }
      const ext = extFromUrl(url, res.headers.get("content-type"));
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) {
        console.warn(`  ✗ ${code}: suspiciously small file (${buf.length}B)`);
        return null;
      }
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${code}.${ext}`), buf);
      const kind = dir === SEAL_DIR ? "seals" : "flags";
      return `/states/${kind}/${code}.${ext}`;
    } catch (e: any) {
      console.warn(`  ✗ ${code}: ${e.message}`);
      return null;
    }
  }

  console.warn(`  ✗ ${code}: gave up after ${maxRetries} retries for ${url}`);
  return null;
}

async function main() {
  const data = JSON.parse(readFileSync(PROFILES, "utf8"));
  const codes = Object.keys(data).filter((k) => k !== "_meta");
  const manifest: Record<string, { seal: string | null; flag: string | null }> = {};

  for (const code of codes) {
    const s = data[code];
    const seal = s.sealImageUrl ? await download(s.sealImageUrl, SEAL_DIR, code) : null;
    // Small delay between seal and flag to be polite to rate-limited hosts
    await sleep(500);
    const flag = s.flagImageUrl ? await download(s.flagImageUrl, FLAG_DIR, code) : null;
    manifest[code] = { seal, flag };
    console.log(`${code}: seal=${seal ?? "—"} flag=${flag ?? "—"}`);
    // Inter-state delay to reduce 429s from Wikimedia (2.5s between states)
    await sleep(2500);
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  const okSeals = Object.values(manifest).filter((m) => m.seal).length;
  console.log(`\nDone. ${okSeals}/${codes.length} seals downloaded. Manifest: ${MANIFEST}`);
}

main();
