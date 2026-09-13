import { S3ObjectStore } from "./s3-object-store";

export interface CloudflareR2Options {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /**
   * Public base the bucket is served from (custom domain or `https://pub-….r2.dev`).
   * REQUIRED: R2 buckets have no public URL of their own, and the S3 endpoint
   * needs credentials, so without this `urlFor` would hand out dead links.
   */
  publicBaseUrl: string;
  aliasBaseUrls?: string[];
}

export function r2Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

/**
 * Cloudflare R2 through its S3-compatible API: same client, `region: auto`,
 * path-style keys at `https://<account>.r2.cloudflarestorage.com/<bucket>/…`.
 * Presigned PUTs work unchanged (R2 honours signed content-type/length).
 * Flexible checksums are pinned to WHEN_REQUIRED: aws-sdk-js-v3 >= 3.729
 * defaults to WHEN_SUPPORTED and sends CRC32 trailers R2 rejects (Cloudflare's
 * own aws-sdk-js-v3 guidance).
 */
export class CloudflareR2ObjectStore extends S3ObjectStore {
  constructor(opts: CloudflareR2Options) {
    if (!opts.publicBaseUrl) throw new Error("CloudflareR2ObjectStore requires publicBaseUrl");
    super({
      provider: "r2",
      bucket: opts.bucket,
      region: "auto",
      accessKeyId: opts.accessKeyId,
      secretAccessKey: opts.secretAccessKey,
      endpoint: r2Endpoint(opts.accountId),
      forcePathStyle: true,
      publicBaseUrl: opts.publicBaseUrl,
      aliasBaseUrls: opts.aliasBaseUrls,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
}
