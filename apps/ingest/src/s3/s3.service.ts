import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface S3Object {
  key: string;
  size: number;
  etag: string;
}

@Injectable()
export class S3Service implements OnModuleDestroy {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly tempDir: string;
  private readonly tempFiles = new Set<string>();

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');
    this.client = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.tempDir = path.join(os.tmpdir(), 'ingest-s3-downloads');
    fs.mkdirSync(this.tempDir, { recursive: true });
  }

  async listObjects(prefix: string): Promise<S3Object[]> {
    const objects: S3Object[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Size !== undefined) {
            objects.push({
              key: obj.Key,
              size: obj.Size,
              etag: obj.ETag ?? '',
            });
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  }

  async downloadToTemp(s3Key: string): Promise<string> {
    const ext = path.extname(s3Key);
    const randomName = crypto.randomBytes(16).toString('hex') + ext;
    const localPath = path.join(this.tempDir, randomName);

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty response body for S3 key: ${s3Key}`);
    }

    const body = response.Body as Readable;
    const writeStream = fs.createWriteStream(localPath);
    await pipeline(body, writeStream);

    this.tempFiles.add(localPath);
    return localPath;
  }

  cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.tempFiles.delete(filePath);
    } catch (err) {
      this.logger.warn(`Failed to clean up temp file ${filePath}: ${err}`);
    }
  }

  onModuleDestroy() {
    for (const filePath of this.tempFiles) {
      this.cleanupTempFile(filePath);
    }
    this.client.destroy();
  }
}
