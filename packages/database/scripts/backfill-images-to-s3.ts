#!/usr/bin/env npx tsx
/**
 * Backfill: pull every official photo into our own storage (S3, 2 webp variants)
 * and rewrite image_url to the CDN/-600 URL. Mirrors the API's ImageStorageService
 * (kept standalone so it runs as a one-off tsx script with raw pg).
 *
 * DO NOT RUN until nass.gov.ng (and other source hosts) are back up — a source
 * that 5xx/404s simply can't be fetched. The script SKIPS dead sources (logs
 * them, leaves image_url as-is; the UI placeholder fallback covers them) and is
 * idempotent, so it's safe to re-run later to catch recovered sources.
 *
 * Usage:
 *   infisical run --env dev  -- npx tsx packages/database/scripts/backfill-images-to-s3.ts --dry-run
 *   infisical run --env dev  -- npx tsx packages/database/scripts/backfill-images-to-s3.ts
 *   # prod: via the SSH tunnel to the prod DB (see memory: prod-deploy-mechanism)
 *
 * Scope: officials. State seals/flags (StateProfile.seal_image_url / flag_image_url)
 * are a second pass — wire them in once the column/relation is confirmed and the
 * /public files are about to be removed.
 */

import pg from "pg";
import path from "path";
import { readFile } from "fs/promises";
import { createHash } from "crypto";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const DRY_RUN = process.argv.includes("--dry-run");
const AVATAR_PX = 128;
const LARGE_PX = 600;
const PUBLIC_DIR = path.resolve(__dirname, "../../../apps/awanaija/public");

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (run via infisical)`);
  return v;
}

async function main() {
  const region = env("AWS_REGION");
  const bucket = env("S3_BUCKET");
  const baseUrl = (process.env.CDN_BASE_URL?.replace(/\/+$/, "")) || `https://${bucket}.s3.${region}.amazonaws.com`;
  const s3 = new S3Client({
    region,
    credentials: { accessKeyId: env("AWS_ACCESS_KEY_ID"), secretAccessKey: env("AWS_SECRET_ACCESS_KEY") },
  });

  const isStored = (url: string) =>
    url.startsWith(baseUrl) || url.includes(`${bucket}.s3.`) || url.includes(`/${bucket}/`);

  async function resolveBytes(src: string): Promise<Buffer> {
    if (src.startsWith("/")) {
      // local /public asset (e.g. /officials/governors/x.jpg)
      return readFile(path.join(PUBLIC_DIR, src));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(src, {
        signal: controller.signal,
        headers: { "User-Agent": "OurNigeriaBot/1.0 (+https://ournigeria.ng)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } finally {
      clearTimeout(timer);
    }
  }

  async function storeOfficial(src: string, officialId: string): Promise<string> {
    const bytes = await resolveBytes(src);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const toWebp = (px: number) =>
      sharp(bytes).rotate().resize(px, px, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toBuffer();
    const [large, small] = await Promise.all([toWebp(LARGE_PX), toWebp(AVATAR_PX)]);
    const keyLarge = `officials/${officialId}/${hash}-${LARGE_PX}.webp`;
    const keySmall = `officials/${officialId}/${hash}-${AVATAR_PX}.webp`;
    const put = (Key: string, Body: Buffer) =>
      s3.send(new PutObjectCommand({
        Bucket: bucket, Key, Body, ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }));
    await Promise.all([put(keyLarge, large), put(keySmall, small)]);
    return `${baseUrl}/${keyLarge}`;
  }

  const client = new pg.Client({ connectionString: env("DATABASE_URL") });
  await client.connect();
  let migrated = 0, skippedDead = 0, alreadyStored = 0;
  try {
    const { rows } = await client.query<{ id: string; image_url: string }>(
      "SELECT id, image_url FROM nigerian_officials WHERE image_url IS NOT NULL AND image_url <> ''",
    );
    console.log(`${rows.length} officials with an image_url.`);

    for (const { id, image_url } of rows) {
      if (isStored(image_url)) { alreadyStored++; continue; }
      if (DRY_RUN) { console.log(`would migrate ${id}  <-  ${image_url.slice(0, 70)}`); migrated++; continue; }
      try {
        const url = await storeOfficial(image_url, id);
        await client.query("UPDATE nigerian_officials SET image_url = $1 WHERE id = $2", [url, id]);
        migrated++;
        if (migrated % 100 === 0) console.log(`  ...${migrated} migrated`);
      } catch (err: any) {
        skippedDead++;
        console.warn(`SKIP (dead/undecodable) ${id}: ${image_url.slice(0, 60)} -> ${err?.message ?? err}`);
      }
    }
    console.log(`Done. migrated=${migrated} skipped_dead=${skippedDead} already_stored=${alreadyStored}`);
    if (skippedDead > 0) console.log(`Re-run later to catch the ${skippedDead} sources that were down.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
