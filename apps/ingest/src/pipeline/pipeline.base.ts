import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { VectorService } from "../vector/vector.service";
import { ExtractorRegistry } from "../extractors/extractor.registry";
import { S3Service } from "../s3/s3.service";
import { ExtractContext } from "../extractors/extractor.interface";
import { sanitizeText, safeChunk } from "../lib/text.utils";
import { fileHash } from "../lib/hash.utils";
import { elapsed } from "../lib/timing.utils";
import {
  DiscoveredFile,
  PipelineConfig,
  PipelineResult,
  DEFAULT_PIPELINE_CONFIG,
} from "./pipeline.types";

export abstract class PipelineBase {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly config: ConfigService,
    protected readonly prisma: PrismaService,
    protected readonly vector: VectorService,
    protected readonly extractors: ExtractorRegistry,
    protected readonly s3: S3Service,
  ) {}

  abstract get pipelineType(): string;
  abstract get indexName(): string;
  abstract discoverFiles(): Promise<DiscoveredFile[]>;
  abstract buildChunkMetadata(
    file: DiscoveredFile,
    chunkText: string,
    chunkIndex: number,
  ): Record<string, unknown>;

  /** Override to pass extra context to extractors (e.g., JSON header text) */
  protected getExtractContext(
    _file: DiscoveredFile,
  ): ExtractContext | undefined {
    return undefined;
  }

  async run(
    configOverrides?: Partial<PipelineConfig>,
  ): Promise<PipelineResult> {
    const config = { ...DEFAULT_PIPELINE_CONFIG, ...configOverrides };
    const pipelineStart = Date.now();

    this.logger.log(`=== ${this.pipelineType} Ingestion Pipeline ===`);

    // Ensure vector index exists
    await this.vector.ensureIndex(this.indexName);

    // Discover files
    const files = await this.discoverFiles();
    this.logger.log(`Discovered ${files.length} files`);

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

    // Build work queue (hash is computed inside processItem after S3 download)
    const queue: Array<{ file: DiscoveredFile }> = files.map((file) => ({
      file,
    }));

    const totalToProcess = queue.length;
    const workerCount = Math.min(config.concurrency, totalToProcess);

    // Shared counters
    let totalChunks = 0;
    let processedFiles = 0;
    let skippedFiles = 0;
    let errorFiles = 0;

    const processItem = async (
      item: { file: DiscoveredFile },
      workerId: number,
    ): Promise<void> => {
      const tag = `[W${workerId}]`;
      const { file } = item;
      let localFilePath: string | undefined;

      try {
        // Download from S3 if needed
        if (file.s3Key) {
          localFilePath = await this.s3.downloadToTemp(file.s3Key);
        } else {
          localFilePath = file.filePath;
        }

        // Compute hash from local file
        const hash = fileHash(localFilePath);

        // Dedup check
        const existing = await this.prisma.ingestionRecord.findUnique({
          where: {
            pipeline_filePath: {
              pipeline: this.pipelineType,
              filePath: file.filePath,
            },
          },
        });

        if (existing?.status === "done" && existing.fileHash === hash) {
          this.logger.log(`${tag} Skipping (already ingested): ${file.filePath}`);
          skippedFiles++;
          return;
        }

        if (existing?.fileHash && existing.fileHash !== hash) {
          this.logger.log(`${tag} Processing (file changed): ${file.filePath}`);
        } else if (existing?.status === "error") {
          this.logger.log(`${tag} Processing (retrying failed): ${file.filePath}`);
        } else {
          this.logger.log(`${tag} Processing: ${file.filePath}`);
        }

        // Mark as processing
        await this.prisma.ingestionRecord.upsert({
          where: {
            pipeline_filePath: {
              pipeline: this.pipelineType,
              filePath: file.filePath,
            },
          },
          create: {
            pipeline: this.pipelineType,
            filePath: file.filePath,
            fileHash: hash,
            sourceType: file.sourceType,
            identity: file.identity as any,
            status: "processing",
            chunks: 0,
          },
          update: {
            fileHash: hash,
            sourceType: file.sourceType,
            identity: file.identity as any,
            status: "processing",
            chunks: 0,
            errorMsg: null,
          },
        });

        const count = await this.ingestFile(file, localFilePath, config);
        totalChunks += count;
        processedFiles++;

        await this.prisma.ingestionRecord.update({
          where: {
            pipeline_filePath: {
              pipeline: this.pipelineType,
              filePath: file.filePath,
            },
          },
          data: { status: "done", chunks: count, fileHash: hash },
        });

        this.logger.log(`${tag} DONE: ${file.filePath} (${count} chunks)`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`${tag} FAILED: ${file.filePath}`, errMsg);

        await this.prisma.ingestionRecord.update({
          where: {
            pipeline_filePath: {
              pipeline: this.pipelineType,
              filePath: file.filePath,
            },
          },
          data: { status: "error", errorMsg: errMsg },
        }).catch(() => {
          // Record may not exist yet if download failed before upsert
        });

        errorFiles++;
      } finally {
        // Always clean up S3 temp files
        if (file.s3Key && localFilePath) {
          this.s3.cleanupTempFile(localFilePath);
        }
      }
    };

    // Launch concurrent workers
    const worker = async (workerId: number): Promise<void> => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        await processItem(item, workerId);
      }
    };

    this.logger.log(
      `Processing ${totalToProcess} files with ${workerCount} workers`,
    );

    if (workerCount > 0) {
      await Promise.all(
        Array.from({ length: workerCount }, (_, i) => worker(i + 1)),
      );
    }

    const durationMs = Date.now() - pipelineStart;
    this.logger.log(`=== ${this.pipelineType} Complete ===`);
    this.logger.log(`Total time: ${elapsed(pipelineStart)}`);
    this.logger.log(
      `Processed: ${processedFiles}, Skipped: ${skippedFiles}, Errors: ${errorFiles}, Chunks: ${totalChunks}`,
    );

    return {
      pipeline: this.pipelineType,
      totalFiles: files.length,
      processedFiles,
      skippedFiles,
      errorFiles,
      totalChunks,
      durationMs,
    };
  }

  private async ingestFile(
    file: DiscoveredFile,
    localFilePath: string,
    config: PipelineConfig,
  ): Promise<number> {
    const fileStart = Date.now();
    this.logger.log(`Processing [${file.sourceType}]: ${file.filePath}`);

    // Extract text using local file path (extractors never see S3)
    const context = this.getExtractContext(file);
    let text = await this.extractors.extract(
      file.sourceType,
      localFilePath,
      context,
    );

    text = sanitizeText(text);

    if (!text || text.trim().length === 0) {
      this.logger.warn(`Skipping empty file: ${file.filePath}`);
      return 0;
    }

    this.logger.log(
      `Extracted ${text.length} chars, chunking (size=${config.chunkSize}, overlap=${config.chunkOverlap})...`,
    );

    const chunkTexts = await safeChunk(
      text,
      config.chunkSize,
      config.chunkOverlap,
    );

    if (!chunkTexts || chunkTexts.length === 0) {
      this.logger.warn(`No chunks produced for: ${file.filePath}`);
      return 0;
    }

    this.logger.log(`Produced ${chunkTexts.length} chunks`);

    // Embed + upsert in batches
    let totalUpserted = 0;
    const totalBatches = Math.ceil(chunkTexts.length / config.batchSize);

    for (let i = 0; i < chunkTexts.length; i += config.batchSize) {
      const batchNum = Math.floor(i / config.batchSize) + 1;
      const batch = chunkTexts.slice(i, i + config.batchSize);
      const batchStart = Date.now();

      try {
        const embeddings = await this.vector.embedBatch(batch);

        const metadata = batch.map((chunkText, j) =>
          this.buildChunkMetadata(file, chunkText, i + j),
        );

        await this.vector.upsert(this.indexName, embeddings, metadata);

        totalUpserted += batch.length;
        this.logger.log(
          `Batch ${batchNum}/${totalBatches}: embedded + upserted ${batch.length} chunks (${elapsed(batchStart)})`,
        );
      } catch (err) {
        this.logger.error(
          `Batch ${batchNum}/${totalBatches} failed after retries, skipping: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.logger.log(
      `Done: ${file.filePath} -> ${totalUpserted} chunks (${elapsed(fileStart)})`,
    );
    return totalUpserted;
  }
}
