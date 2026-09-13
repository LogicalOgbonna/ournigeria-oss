import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { keyForBases, type ObjectStore, type PresignPutInput, type PutOptions, type StorageProvider } from "./object-store";

export interface S3ObjectStoreOptions {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Custom endpoint (R2, MinIO). Omit for AWS. */
  endpoint?: string;
  forcePathStyle?: boolean;
  /** Canonical public base (CDN). Falls back to the virtual-hosted bucket URL. */
  publicBaseUrl?: string;
  /** Extra public bases the same object may have been referenced under. */
  aliasBaseUrls?: string[];
  provider?: StorageProvider;
  /** Flexible-checksum behaviour; S3-compatible endpoints (R2) need WHEN_REQUIRED. */
  requestChecksumCalculation?: "WHEN_REQUIRED" | "WHEN_SUPPORTED";
  responseChecksumValidation?: "WHEN_REQUIRED" | "WHEN_SUPPORTED";
}

/**
 * AWS S3 (and any S3-compatible endpoint). `publicBaseUrl` first, then the raw
 * AWS bucket forms `keyFor` also accepts, so URLs written before a CDN existed
 * still resolve to their key. A custom endpoint is credentialed, never public,
 * so its URL form is only recognised when it IS the public base (no CDN).
 */
export class S3ObjectStore implements ObjectStore {
  readonly provider: StorageProvider;
  protected readonly s3: S3Client;
  protected readonly bucket: string;
  protected readonly baseUrl: string;
  protected readonly bases: string[];

  constructor(opts: S3ObjectStoreOptions) {
    this.provider = opts.provider ?? "s3";
    this.bucket = opts.bucket;
    this.s3 = new S3Client({
      region: opts.region,
      credentials: { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey },
      ...(opts.endpoint ? { endpoint: opts.endpoint } : {}),
      ...(opts.forcePathStyle !== undefined ? { forcePathStyle: opts.forcePathStyle } : {}),
      ...(opts.requestChecksumCalculation ? { requestChecksumCalculation: opts.requestChecksumCalculation } : {}),
      ...(opts.responseChecksumValidation ? { responseChecksumValidation: opts.responseChecksumValidation } : {}),
    });
    const strip = (u: string) => u.replace(/\/+$/, "");
    const rawBases = opts.endpoint
      ? [`${strip(opts.endpoint)}/${opts.bucket}`]
      : [`https://${opts.bucket}.s3.${opts.region}.amazonaws.com`, `https://s3.${opts.region}.amazonaws.com/${opts.bucket}`];
    this.baseUrl = opts.publicBaseUrl ? strip(opts.publicBaseUrl) : rawBases[0];
    const legacyBases = opts.endpoint ? [] : rawBases;
    this.bases = [...new Set([this.baseUrl, ...(opts.aliasBaseUrls ?? []).map(strip), ...legacyBases])];
  }

  async presignPut(input: PresignPutInput) {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: input.key, ContentType: input.contentType, ContentLength: input.size });
    // signableHeaders pins content-type AND content-length INTO the signature.
    // Without content-type the presigner hoists the header into a query param
    // and the uploader could PUT any type it liked; without content-length the
    // size we validated at presign time is advisory and a caller could stream
    // gigabytes at the bucket before the commit call ever sees the object.
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: input.expiresInSeconds,
      signableHeaders: new Set(["content-type", "content-length"]),
    });
    return { url, expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000) };
  }

  async head(key: string) {
    try {
      const r = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: r.ContentLength ?? 0, contentType: r.ContentType ?? null };
    } catch (err) {
      if (
        (err as { name?: string }).name === "NotFound" ||
        (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
      )
        return null;
      throw err;
    }
  }

  async get(key: string) {
    const r = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await r.Body?.transformToByteArray();
    return Buffer.from(bytes ?? new Uint8Array());
  }

  async put(key: string, body: Buffer, opts: PutOptions) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: opts.contentType,
        CacheControl: opts.cacheControl,
        ContentDisposition: opts.contentDisposition,
      }),
    );
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  urlFor(key: string) {
    return `${this.baseUrl}/${key}`;
  }

  keyFor(url: string) {
    return keyForBases(this.bases, url);
  }

  urlsFor(key: string) {
    return this.bases.map((b) => `${b}/${key}`);
  }
}
