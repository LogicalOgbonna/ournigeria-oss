import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { VectorService } from "../vector/vector.service";
import { ExtractorRegistry } from "../extractors/extractor.registry";
import { S3Service } from "../s3/s3.service";
import { PipelineBase } from "./pipeline.base";
import { DiscoveredFile } from "./pipeline.types";

@Injectable()
export class CorruptionPipeline extends PipelineBase {
  protected readonly logger = new Logger(CorruptionPipeline.name);

  constructor(
    config: ConfigService,
    prisma: PrismaService,
    vector: VectorService,
    extractors: ExtractorRegistry,
    s3: S3Service,
  ) {
    super(config, prisma, vector, extractors, s3);
  }

  get pipelineType(): string {
    return "corruption";
  }

  get indexName(): string {
    return this.config.getOrThrow<string>("VECTOR_INDEX_CORRUPTION");
  }

  async discoverFiles(): Promise<DiscoveredFile[]> {
    const files: DiscoveredFile[] = [];

    this.logger.log("Listing S3 objects under corruption/");
    const objects = await this.s3.listObjects("corruption/");
    this.logger.log(`Found ${objects.length} objects in S3`);

    for (const obj of objects) {
      if (!obj.key.endsWith(".md")) continue;
      if (obj.size === 0) continue;

      const parts = obj.key.split("/");

      if (parts.length === 2 && parts[1] === "INDEX.md") {
        // Top-level INDEX.md: corruption/INDEX.md
        files.push({
          filePath: obj.key,
          sourceType: "md",
          s3Key: obj.key,
          s3Etag: obj.etag,
          identity: {
            official: "_index",
            section: "index",
            filename: "INDEX.md",
          },
        });
      } else if (parts.length >= 3) {
        // corruption/{OFFICIAL}/{filename}.md
        const officialDir = parts[1];
        const filename = parts.slice(2).join("/");
        const section = filename.replace(/\.md$/, "");

        files.push({
          filePath: obj.key,
          sourceType: "md",
          s3Key: obj.key,
          s3Etag: obj.etag,
          identity: {
            official: officialDir.replaceAll("_", " "),
            section,
            filename,
          },
        });
      }
    }

    return files;
  }

  buildChunkMetadata(
    file: DiscoveredFile,
    chunkText: string,
    chunkIndex: number,
  ): Record<string, unknown> {
    const { official, section, filename } = file.identity as {
      official: string;
      section: string;
      filename: string;
    };
    return {
      text: chunkText,
      official,
      section,
      filename,
      source_type: "md",
      chunk_index: chunkIndex,
      s3_key: file.s3Key ?? file.filePath,
    };
  }
}
