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

    await this.vector.ensureIndex(this.indexName);

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

    this.logger.log(
      `Processing ${files.length} files with ${Math.min(config.concurrency, files.length)} workers`,
    );

    const result = await this.processFiles(files, config);

    const durationMs = Date.now() - pipelineStart;
    this.logger.log(`=== ${this.pipelineType} Complete ===`);
    this.logger.log(`Total time: ${elapsed(pipelineStart)}`);
    this.logger.log(
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

  protected async processFiles(
    files: DiscoveredFile[],
    config: PipelineConfig,
  ): Promise<{
    processed: number;
    skipped: number;
    errors: number;
    chunks: number;
  }> {
    const queue = [...files];
    const workerCount = Math.min(config.concurrency, queue.length);

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let chunks = 0;

    const processItem = async (
      file: DiscoveredFile,
      workerId: number,
    ): Promise<void> => {
      const tag = `[W${workerId}]`;
      let localFilePath: string | undefined;

      try {
        // --- ETag-based dedup: check BEFORE downloading ---
        const existing = await this.prisma.ingestionRecord.findUnique({
          where: {
            pipeline_filePath: {
              pipeline: this.pipelineType,
              filePath: file.filePath,
            },
          },
        });

        if (existing?.status === "done" && file.s3Etag) {
          if (existing.s3Etag === file.s3Etag) {
            // ETag matches — skip without downloading
            this.logger.log(
              `${tag} Skipping (ETag unchanged): ${file.filePath}`,
            );
            skipped++;
            return;
          }
          if (!existing.s3Etag) {
            // Record exists but has no ETag yet — backfill and skip without downloading
            await this.prisma.ingestionRecord.update({
              where: {
                pipeline_filePath: {
                  pipeline: this.pipelineType,
                  filePath: file.filePath,
                },
              },
              data: { s3Etag: file.s3Etag },
            });
            this.logger.log(
              `${tag} Skipping (backfilled ETag): ${file.filePath}`,
            );
            skipped++;
            return;
          }
        }

        // Need to download — file is new, changed, or previously failed
        if (file.s3Key) {
          localFilePath = await this.s3.downloadToTemp(file.s3Key);
        } else {
          localFilePath = file.filePath;
        }

        const hash = fileHash(localFilePath);

        // Fallback dedup for local files without ETag
        if (
          !file.s3Etag &&
          existing?.status === "done" &&
          existing.fileHash === hash
        ) {
          this.logger.log(`${tag} Skipping (hash unchanged): ${file.filePath}`);
          skipped++;
          return;
        }

        if (existing?.s3Etag && existing.s3Etag !== file.s3Etag) {
          this.logger.log(`${tag} Processing (ETag changed): ${file.filePath}`);
        } else if (existing?.fileHash && existing.fileHash !== hash) {
          this.logger.log(`${tag} Processing (file changed): ${file.filePath}`);
        } else if (existing?.status === "error") {
          this.logger.log(
            `${tag} Processing (retrying failed): ${file.filePath}`,
          );
        } else {
          this.logger.log(`${tag} Processing: ${file.filePath}`);
        }

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
            s3Etag: file.s3Etag || null,
            sourceType: file.sourceType,
            identity: file.identity as any,
            status: "processing",
            chunks: 0,
          },
          update: {
            fileHash: hash,
            s3Etag: file.s3Etag || null,
            sourceType: file.sourceType,
            identity: file.identity as any,
            status: "processing",
            chunks: 0,
            errorMsg: null,
          },
        });

        const { upserted, failed } = await this.ingestFile(
          file,
          localFilePath,
          config,
        );
        chunks += upserted;
        processed++;

        const status = failed > 0 ? "partial" : "done";
        await this.prisma.ingestionRecord.update({
          where: {
            pipeline_filePath: {
              pipeline: this.pipelineType,
              filePath: file.filePath,
            },
          },
          data: {
            status,
            chunks: upserted,
            fileHash: hash,
            s3Etag: file.s3Etag || null,
            ...(failed > 0 && {
              errorMsg: `${failed} batch(es) failed during embedding/upsert`,
            }),
          },
        });

        this.logger.log(
          `${tag} ${status.toUpperCase()}: ${file.filePath} (${upserted} chunks${failed > 0 ? `, ${failed} batches failed` : ""})`,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`${tag} FAILED: ${file.filePath}`, errMsg);

        await this.prisma.ingestionRecord
          .update({
            where: {
              pipeline_filePath: {
                pipeline: this.pipelineType,
                filePath: file.filePath,
              },
            },
            data: { status: "error", errorMsg: errMsg },
          })
          .catch(() => {});

        errors++;
      } finally {
        if (file.s3Key && localFilePath) {
          this.s3.cleanupTempFile(localFilePath);
        }
      }
    };

    const worker = async (workerId: number): Promise<void> => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) break;
        await processItem(file, workerId);
      }
    };

    if (workerCount > 0) {
      await Promise.all(
        Array.from({ length: workerCount }, (_, i) => worker(i + 1)),
      );
    }

    return { processed, skipped, errors, chunks };
  }

  private async ingestFile(
    file: DiscoveredFile,
    localFilePath: string,
    config: PipelineConfig,
  ): Promise<{ upserted: number; failed: number }> {
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
      return { upserted: 0, failed: 0 };
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
      return { upserted: 0, failed: 0 };
    }

    this.logger.log(`Produced ${chunkTexts.length} chunks`);

    // Embed + upsert in batches
    let totalUpserted = 0;
    let failedBatches = 0;
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
        failedBatches++;
        this.logger.error(
          `Batch ${batchNum}/${totalBatches} failed after retries, skipping: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.logger.log(
      `Done: ${file.filePath} -> ${totalUpserted} chunks (${elapsed(fileStart)})`,
    );
    return { upserted: totalUpserted, failed: failedBatches };
  }
}
