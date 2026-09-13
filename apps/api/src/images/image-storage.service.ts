import { Injectable, BadRequestException } from "@nestjs/common";
import { createHash } from "crypto";
import sharp from "sharp";
import { ObjectStorageService } from "../storage/object-storage.service";
import type { ObjectStore } from "../storage/object-store";
import { InjectObjectStore } from "../storage/storage.module";
import { safeFetchBytes } from "./safe-fetch";

/** Stored variant sizes (square, px). Avatar = card photos; large = profile/OG/seal. */
export const AVATAR_PX = 128;
export const LARGE_PX = 600;
/** Long-edge cap for non-square assets (posters are 404×695 at 1×; 4× is plenty). */
export const ASSET_MAX_EDGE = 1600;
/** Remote image sources are capped well above any real portrait. */
const MAX_REMOTE_BYTES = 15 * 1024 * 1024;

/**
 * Single home for storing official/state images. Resolves a source (remote URL,
 * data-URL, or raw Buffer) to bytes, re-encodes to two compressed webp variants
 * (128 + 600), writes both to the `images` storage domain by default (S3, R2
 * or local disk — see ../storage) or to the caller's own store (`into`, used by
 * campaign assets so a ticket's objects all live in ONE domain), and returns
 * their public URLs.
 *
 * Persist the `-600` URL in `image_url`; the frontend derives the `-128` avatar
 * URL by suffix swap. The public base comes from the store (CDN_BASE_URL when
 * set for S3, the R2 public domain, or the API's own /storage/local route).
 *
 * Routing EVERY image writer through this is what keeps foreign hotlink URLs
 * (e.g. nass.gov.ng) out of the database for good.
 */
@Injectable()
export class ImageStorageService {
  constructor(
    @InjectObjectStore("images") private readonly objects: ObjectStore,
    private readonly storage: ObjectStorageService,
  ) {}

  /**
   * True if a URL is already served from our own storage: ANY configured
   * provider (CDN, S3 bucket in either URL form, R2 public domain, local dev
   * route), not only the one the `images` domain currently writes to — URLs
   * persisted before a provider switch must keep counting as ours. Each store
   * compares ORIGINS, not substrings: `https://cdn.example.ng.evil.com/x` and
   * `https://evil.com/<bucket>/x` must not pass.
   */
  isStoredUrl(url: string): boolean {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      return false;
    }
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return this.storage.ownsUrl(url);
  }

  /** Store an official photo. `source` = remote URL | data-URL | Buffer. */
  storeOfficialImage(source: string | Buffer, officialId: string) {
    return this.store(source, `officials/${officialId}`);
  }

  /**
   * Resize `source` to 128 + 600 webp and upload under `keyPrefix`.
   * Returns `{ url, urlSmall }` (url = the -600 variant to persist).
   * Throws BadRequestException if the source can't be fetched/decoded.
   */
  async store(source: string | Buffer, keyPrefix: string, into: ObjectStore = this.objects): Promise<{ url: string; urlSmall: string }> {
    const input = await this.resolveBytes(source);
    // Content hash → stable, dedupe-friendly key + safe immutable caching.
    const hash = createHash("sha256").update(input).digest("hex").slice(0, 16);

    let large: Buffer;
    let small: Buffer;
    try {
      [large, small] = await Promise.all([this.toWebp(input, LARGE_PX), this.toWebp(input, AVATAR_PX)]);
    } catch {
      throw new BadRequestException("source is not a decodable image");
    }

    const keyLarge = `${keyPrefix}/${hash}-${LARGE_PX}.webp`;
    const keySmall = `${keyPrefix}/${hash}-${AVATAR_PX}.webp`;
    await Promise.all([this.put(keyLarge, large, into), this.put(keySmall, small, into)]);

    return { url: into.urlFor(keyLarge), urlSmall: into.urlFor(keySmall) };
  }

  /**
   * Store a non-square asset (poster, card, banner, photo…): aspect kept, long
   * edge capped at `maxEdge` (never upscaled), webp q82, EXIF honoured,
   * metadata stripped. Key = `<keyPrefix>/<type>-<hash16>.webp`, immutable.
   */
  async storeAsset(
    input: Buffer,
    keyPrefix: string,
    opts: { type: string; maxEdge?: number; into?: ObjectStore },
  ): Promise<{ url: string; width: number; height: number }> {
    const into = opts.into ?? this.objects;
    const maxEdge = opts.maxEdge ?? ASSET_MAX_EDGE;
    let body: Buffer;
    let width: number;
    let height: number;
    try {
      const out = await sharp(input, { limitInputPixels: 50_000_000, sequentialRead: true })
        .rotate()
        .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      body = out.data;
      width = out.info.width;
      height = out.info.height;
    } catch {
      throw new BadRequestException("source is not a decodable image");
    }
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
    const key = `${keyPrefix.replace(/\/+$/, "")}/${opts.type}-${hash}.webp`;
    await this.put(key, body, into);
    return { url: into.urlFor(key), width, height };
  }

  /** Public URL for a stored key in the `images` domain. */
  urlFor(key: string): string {
    return this.objects.urlFor(key);
  }

  private toWebp(input: Buffer, px: number): Promise<Buffer> {
    // Decompression-bomb ceiling: MAX_REMOTE_BYTES caps the *compressed* source,
    // but a few-KB PNG can declare a 50000x50000 canvas and blow up the heap on
    // decode. 50MP is far above any real portrait and well under sharp's default
    // (0x3FFFFFFF). sequentialRead keeps peak memory down on large sources.
    return sharp(input, { limitInputPixels: 50_000_000, sequentialRead: true })
      .rotate() // honor EXIF orientation
      .resize(px, px, { fit: "cover", position: "attention" }) // square crop, favor faces
      .webp({ quality: 80 })
      .toBuffer();
  }

  private put(key: string, body: Buffer, into: ObjectStore): Promise<void> {
    return into.put(key, body, { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" });
  }

  private async resolveBytes(source: string | Buffer): Promise<Buffer> {
    if (Buffer.isBuffer(source)) return source;

    if (source.startsWith("data:")) {
      const m = source.match(/^data:image\/[\w.+-]+;base64,(.+)$/);
      if (!m) throw new BadRequestException("invalid image data URL");
      return Buffer.from(m[1], "base64");
    }

    if (/^https?:\/\//i.test(source)) {
      // SSRF guard: single vetted resolution, pinned connect, capped body.
      return safeFetchBytes(source, MAX_REMOTE_BYTES);
    }

    throw new BadRequestException("unsupported image source");
  }
}
