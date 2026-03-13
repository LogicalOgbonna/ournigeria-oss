import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { VectorService } from "../vector/vector.service";
import { ExtractorRegistry } from "../extractors/extractor.registry";
import { S3Service } from "../s3/s3.service";
import { PipelineBase } from "./pipeline.base";
import {
  DiscoveredFile,
  PipelineConfig,
  PipelineResult,
  DEFAULT_PIPELINE_CONFIG,
} from "./pipeline.types";
import { CorruptionProfileService } from "./corruption-profile.service";
import {
  extractArtifactMeta,
  buildSummaryChunkText,
} from "./corruption-extractors";
import { elapsed } from "../lib/timing.utils";

@Injectable()
export class CorruptionPipeline extends PipelineBase {
  protected readonly logger = new Logger(CorruptionPipeline.name);

  constructor(
    config: ConfigService,
    prisma: PrismaService,
    vector: VectorService,
    extractors: ExtractorRegistry,
    s3: S3Service,
    private readonly profileService: CorruptionProfileService,
  ) {
    super(config, prisma, vector, extractors, s3);
  }

  get pipelineType(): string {
    return "corruption";
  }

  get indexName(): string {
    return this.config.getOrThrow<string>("VECTOR_INDEX_CORRUPTION");
  }

  async run(
    configOverrides?: Partial<PipelineConfig>,
  ): Promise<PipelineResult> {
    const config = { ...DEFAULT_PIPELINE_CONFIG, ...configOverrides };
    const pipelineStart = Date.now();

    this.emitLog("log", `=== ${this.pipelineType} Ingestion Pipeline ===`);

    await this.vector.ensureIndex(this.indexName);

    const files = await this.discoverFiles();
    this.emitLog("log", `Discovered ${files.length} files`);

    if (files.length === 0) {
      return {
        pipeline: this.pipelineType,
        totalFiles: 0,
        processedFiles: 0,
        skippedFiles: 0,
        errorFiles: 0,
        totalChunks: 0,
        durationMs: Date.now() - pipelineStart,
      };
    }

    // Pre-processing: build metadata profiles for all officials
    this.emitLog(
      "log",
      "Building official profiles for metadata enrichment...",
    );
    const profileStart = Date.now();
    await this.profileService.buildProfiles(files);
    this.emitLog(
      "log",
      `Built ${this.profileService.profileCount} profiles (${elapsed(profileStart)})`,
    );

    // Upsert synthetic summary chunks for each official
    await this.upsertSummaryChunks();

    // Process files normally (with enriched metadata)
    this.emitLog(
      "log",
      `Processing ${files.length} files with ${Math.min(config.concurrency, files.length)} workers`,
    );

    const result = await this.processFiles(files, config);

    // Cleanup
    this.profileService.clear();

    const durationMs = Date.now() - pipelineStart;
    this.emitLog("log", `=== ${this.pipelineType} Complete ===`);
    this.emitLog("log", `Total time: ${elapsed(pipelineStart)}`);
    this.emitLog(
      "log",
      `Processed: ${result.processed}, Skipped: ${result.skipped}, Errors: ${result.errors}, Chunks: ${result.chunks}`,
    );

    return {
      pipeline: this.pipelineType,
      totalFiles: files.length,
      processedFiles: result.processed,
      skippedFiles: result.skipped,
      errorFiles: result.errors,
      totalChunks: result.chunks,
      durationMs,
    };
  }

  async discoverFiles(): Promise<DiscoveredFile[]> {
    const files: DiscoveredFile[] = [];

    this.emitLog("log", "Listing S3 objects under corruption/");
    const objects = await this.s3.listObjects("corruption/");
    this.emitLog("log", `Found ${objects.length} objects in S3`);

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

        // Skip references.md — it's just a URL list with no useful content
        if (section === "references") continue;

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

  buildFileFromS3Key(key: string, etag: string): DiscoveredFile | null {
    if (!key.endsWith(".md")) return null;
    const parts = key.split("/");
    if (parts.length === 2 && parts[1] === "INDEX.md") {
      return {
        filePath: key,
        sourceType: "md",
        s3Key: key,
        s3Etag: etag,
        identity: {
          official: "_index",
          section: "index",
          filename: "INDEX.md",
        },
      };
    }
    if (parts.length >= 3) {
      const officialDir = parts[1];
      const filename = parts.slice(2).join("/");
      const section = filename.replace(/\.md$/, "");

      // Skip references.md
      if (section === "references") return null;

      return {
        filePath: key,
        sourceType: "md",
        s3Key: key,
        s3Etag: etag,
        identity: {
          official: officialDir.replaceAll("_", " "),
          section,
          filename,
        },
      };
    }
    return null;
  }

  protected generateContextPrefix(
    file: DiscoveredFile,
    metadata: Record<string, unknown>,
  ): string {
    const official = metadata.official || "";
    const position = metadata.position || "";
    const state = metadata.state || "";
    const section = metadata.section || "";
    const parts = ["This chunk is from the EFCC case file"];
    if (official) parts[0] += ` for ${official}`;
    if (position) parts[0] += ` (${position}`;
    if (state) parts[0] += `, ${state}`;
    if (position) parts[0] += `)`;
    if (section) parts[0] += `, section: ${section}`;
    return parts[0] + ": ";
  }

  protected async enhanceChunks(
    file: DiscoveredFile,
    text: string,
    currentChunks: string[],
  ): Promise<string[]> {
    const { official, section, filename } = file.identity as {
      official: string;
      section: string;
      filename: string;
    };

    if (official === "_index") {
      return currentChunks;
    }

    const titleCaseSection =
      section
        .split("/")
        .pop() // Get the actual file name without 'artifacts/' if present
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") ?? section;

    let extraContext = "";
    if (filename.startsWith("artifacts/")) {
      // e.g., artifacts/BBC_downloaded_2026-03-01_published_2016-02-09.md
      const namePart = filename.replace("artifacts/", "").replace(".md", "");
      const parts = namePart.split("_published_");

      const sourcePart = parts[0]; // e.g. BBC_downloaded_2026-03-01
      const source = sourcePart.split("_downloaded_")[0].replaceAll("_", " ");

      const published = parts.length > 1 ? parts[1] : "Unknown";

      extraContext = `Source: ${source}\nPublished Date: ${published}\n`;
    }

    return currentChunks.map(
      (chunk) =>
        `Official: ${official}\nSection: ${titleCaseSection}\n${extraContext}\n${chunk}`,
    );
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

    const metadata: Record<string, unknown> = {
      text: chunkText,
      official,
      section,
      filename,
      source_type: "md",
      chunk_index: chunkIndex,
      s3_key: file.s3Key ?? file.filePath,
    };

    // Enrich with profile data
    const profile = this.profileService.getProfile(official);
    if (profile) {
      metadata.status = profile.status;
      if (profile.profile.position)
        metadata.position = profile.profile.position;
      if (profile.profile.state) metadata.state = profile.profile.state;
      if (profile.profile.party) metadata.party = profile.profile.party;
      if (profile.agencies.length > 0) {
        metadata.agency = profile.agencies.join(", ");
      }
      if (profile.amountAlleged) {
        metadata.amount_alleged_ngn = profile.amountAlleged.ngnValue;
      }
    }

    // Artifact-specific metadata
    if (filename.startsWith("artifacts/")) {
      const artifactMeta = extractArtifactMeta(filename);
      if (artifactMeta) {
        metadata.artifact_source = artifactMeta.source;
        metadata.artifact_published_date = artifactMeta.published_date;
      }
    }

    return metadata;
  }

  private async upsertSummaryChunks(): Promise<void> {
    const profiles = this.profileService.getAllProfiles();
    if (profiles.size === 0) return;

    this.emitLog("log", `Upserting ${profiles.size} summary chunks...`);
    const start = Date.now();

    const summaryTexts: string[] = [];
    const summaryMetadata: Record<string, unknown>[] = [];

    for (const [official, data] of profiles) {
      const text = buildSummaryChunkText(
        official,
        data.profile,
        data.status,
        data.agencies,
        data.amountAlleged,
      );

      summaryTexts.push(text);
      summaryMetadata.push({
        text,
        official,
        section: "summary",
        filename: "summary",
        source_type: "synthetic",
        chunk_index: -1,
        s3_key: `corruption/${official.replaceAll(" ", "_")}/summary`,
        status: data.status,
        position: data.profile.position,
        state: data.profile.state,
        party: data.profile.party,
        agency: data.agencies.length > 0 ? data.agencies.join(", ") : null,
        amount_alleged_ngn: data.amountAlleged?.ngnValue ?? null,
      });
    }

    // Embed and upsert in batches of 50
    const batchSize = 50;
    let totalUpserted = 0;

    for (let i = 0; i < summaryTexts.length; i += batchSize) {
      const batchTexts = summaryTexts.slice(i, i + batchSize);
      const batchMeta = summaryMetadata.slice(i, i + batchSize);

      try {
        const embeddings = await this.vector.embedBatch(batchTexts);
        await this.vector.upsert(this.indexName, embeddings, batchMeta);
        totalUpserted += batchTexts.length;
      } catch (err) {
        this.emitLog(
          "error",
          `Summary batch ${Math.floor(i / batchSize) + 1} failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.emitLog(
      "log",
      `Upserted ${totalUpserted} summary chunks (${elapsed(start)})`,
    );
  }
}
