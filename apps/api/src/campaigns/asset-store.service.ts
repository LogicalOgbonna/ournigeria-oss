import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const STAGING_PREFIX = "staging/";

export interface PutOptions {
  contentType: string;
  cacheControl?: string;
  contentDisposition?: string;
}

export interface PresignPutInput {
  key: string;
  contentType: string;
  expiresInSeconds: number;
}

/**
 * The only door to object storage for campaign assets. One interface so the
 * service tests run against MemoryObjectStore and never touch AWS.
 */
export interface ObjectStore {
  presignPut(input: PresignPutInput): Promise<{ url: string; expiresAt: Date }>;
  head(key: string): Promise<{ size: number; contentType: string | null } | null>;
  get(key: string): Promise<Buffer>;
  put(key: string, body: Buffer, opts: PutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  /** Public URL for a stored key (CDN when configured). */
  urlFor(key: string): string;
  /** Inverse of urlFor for our own URLs; null for anything else. */
  keyFor(url: string): string | null;
}

export const OBJECT_STORE = Symbol("OBJECT_STORE");

@Injectable()
export class S3ObjectStore implements ObjectStore {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>("S3_BUCKET");
    const region = config.getOrThrow<string>("AWS_REGION");
    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: config.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      },
    });
    const cdn = config.get<string>("CDN_BASE_URL")?.replace(/\/+$/, "");
    this.baseUrl = cdn || `https://${this.bucket}.s3.${region}.amazonaws.com`;
  }

  async presignPut(input: PresignPutInput) {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: input.key, ContentType: input.contentType });
    // signableHeaders pins content-type INTO the signature. Without it the
    // presigner hoists the header into a query param, and the uploader could
    // then PUT any content type it liked against our signed URL.
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: input.expiresInSeconds,
      signableHeaders: new Set(["content-type"]),
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
    const prefix = `${this.baseUrl}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }
}
