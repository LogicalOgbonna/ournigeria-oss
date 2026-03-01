import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const ALLOWED_PREFIXES = ["budgets/", "corruption/", "govspend/"];

const PIPELINE_FILE_HINTS: Record<string, string[]> = {
  budgets: [".pdf", ".xlsx", ".docx"],
  corruption: [".md"],
  govspend: [".md"],
};

@Injectable()
export class AdminS3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>(
          "AWS_SECRET_ACCESS_KEY",
        ),
      },
    });
  }

  async browse(prefix: string) {
    this.validatePrefix(prefix);

    const result = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix || undefined,
        Delimiter: "/",
      }),
    );

    const folders = (result.CommonPrefixes || []).map((cp) => {
      const full = cp.Prefix!;
      const parts = full.replace(/\/$/, "").split("/");
      return { name: parts[parts.length - 1], prefix: full };
    });

    const files = (result.Contents || [])
      .filter((obj) => obj.Key !== prefix) // exclude the prefix itself
      .map((obj) => {
        const parts = obj.Key!.split("/");
        return {
          name: parts[parts.length - 1],
          key: obj.Key!,
          size: obj.Size,
          lastModified: obj.LastModified?.toISOString(),
        };
      });

    const pipeline = prefix ? prefix.split("/")[0] : null;
    const fileHints = pipeline ? PIPELINE_FILE_HINTS[pipeline] || [] : [];

    return { prefix: prefix || "", folders, files, fileHints };
  }

  async createFolder(prefix: string, folderName: string) {
    const safeName = folderName.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!safeName) {
      throw new BadRequestException("Invalid folder name");
    }

    const parentPrefix = prefix ? prefix.replace(/\/$/, "") + "/" : "";
    const newPrefix = `${parentPrefix}${safeName}/`;

    // At root level, the new folder must be one of the allowed pipeline prefixes
    if (!prefix) {
      const isAllowed = ALLOWED_PREFIXES.includes(newPrefix);
      if (!isAllowed) {
        throw new BadRequestException(
          `Root folders must be one of: ${ALLOWED_PREFIXES.map((p) => p.replace("/", "")).join(", ")}`,
        );
      }
    } else {
      this.validatePrefix(newPrefix);
    }

    // S3 folders are zero-byte objects with a trailing slash
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: newPrefix,
        Body: Buffer.alloc(0),
      }),
    );

    return { prefix: newPrefix };
  }

  async upload(s3Key: string, buffer: Buffer, contentType: string) {
    this.validatePrefix(s3Key);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return { key: s3Key, bucket: this.bucket };
  }

  private validatePrefix(prefix: string) {
    if (!prefix) return; // root browsing is allowed (shows top-level folders)

    if (prefix.includes("..") || prefix.includes("//")) {
      throw new BadRequestException("Invalid prefix: path traversal detected");
    }

    const isAllowed = ALLOWED_PREFIXES.some((ap) => prefix.startsWith(ap));
    if (!isAllowed) {
      throw new BadRequestException(
        `Prefix must start with one of: ${ALLOWED_PREFIXES.join(", ")}`,
      );
    }
  }
}
