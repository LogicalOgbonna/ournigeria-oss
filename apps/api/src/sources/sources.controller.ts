import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import * as path from "path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Controller("sources")
export class SourcesController {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
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

  @Get("download")
  async download(@Query("path") filePath: string, @Res() res: Response) {
    if (!filePath) {
      throw new BadRequestException("Missing path query parameter");
    }

    // Security: decode, normalize, and reject path traversal
    const decoded = decodeURIComponent(filePath);
    const normalized = path.posix.normalize(decoded);
    if (normalized.includes("..") || normalized.startsWith("/")) {
      throw new BadRequestException("Invalid path");
    }

    // Must start with a known prefix (case-insensitive)
    const ALLOWED_PREFIXES = ["budgets/", "corruption/", "govspend/"];
    const lower = normalized.toLowerCase();
    if (!ALLOWED_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
      throw new BadRequestException("Invalid path");
    }

    // Use the normalized path from here on
    filePath = normalized;

    // Map spaces to underscores in directory segments (matches S3 key convention)
    const parts = filePath.split("/");
    const filename = parts[parts.length - 1];
    const dirParts = parts.slice(0, -1).map((seg) => seg.replaceAll(" ", "_"));
    const s3Key = [...dirParts, filename].join("/");

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });

    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });

    return res.redirect(presignedUrl);
  }
}
