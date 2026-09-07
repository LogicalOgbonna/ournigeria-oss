import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import sharp from "sharp";
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
 * (128 + 600), uploads both to S3, and returns their public URLs.
 *
 * Persist the `-600` URL in `image_url`; the frontend derives the `-128` avatar
 * URL by suffix swap. Public base is CDN_BASE_URL (CloudFront) when set, else the
 * direct S3 URL — so this works before CloudFront exists and upgrades for free
 * once CDN_BASE_URL is configured.
 *
 * Routing EVERY image writer through this is what keeps foreign hotlink URLs
 * (e.g. nass.gov.ng) out of the database for good.
 */
@Injectable()
export class ImageStorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    const region = this.config.getOrThrow<string>("AWS_REGION");
    this.region = region;
    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      },
    });
    const cdn = this.config.get<string>("CDN_BASE_URL")?.replace(/\/+$/, "");
    this.baseUrl = cdn || `https://${this.bucket}.s3.${region}.amazonaws.com`;
  }

  /**
   * True if a URL is already served from our own storage (CDN or S3 bucket).
   * Compares ORIGINS, not substrings: `https://cdn.example.ng.evil.com/x` and
   * `https://evil.com/<bucket>/x` must not pass. Accepts the CDN origin, the
   * virtual-hosted bucket origin, and the path-style origin with the bucket as
   * the first path segment.
   */
  isStoredUrl(url: string): boolean {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      return false;
    }
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const origins = new Set<string>([new URL(this.baseUrl).origin, `https://${this.bucket}.s3.${this.region}.amazonaws.com`]);
    if (origins.has(u.origin)) return true;
    // Path-style: https://s3.<region>.amazonaws.com/<bucket>/key
    return u.origin === `https://s3.${this.region}.amazonaws.com` && u.pathname.startsWith(`/${this.bucket}/`);
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
  async store(source: string | Buffer, keyPrefix: string): Promise<{ url: string; urlSmall: string }> {
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
    await Promise.all([this.put(keyLarge, large), this.put(keySmall, small)]);

    return { url: `${this.baseUrl}/${keyLarge}`, urlSmall: `${this.baseUrl}/${keySmall}` };
  }

  /**
   * Store a non-square asset (poster, card, banner, photo…): aspect kept, long
   * edge capped at `maxEdge` (never upscaled), webp q82, EXIF honoured,
   * metadata stripped. Key = `<keyPrefix>/<type>-<hash16>.webp`, immutable.
   */
  async storeAsset(
    input: Buffer,
    keyPrefix: string,
    opts: { type: string; maxEdge?: number },
  ): Promise<{ url: string; width: number; height: number }> {
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
    await this.put(key, body);
    return { url: `${this.baseUrl}/${key}`, width, height };
  }

  /** Public base for a stored key (CDN when configured, else the bucket URL). */
  urlFor(key: string): string {
    return `${this.baseUrl}/${key}`;
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

  private async put(key: string, body: Buffer): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
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
