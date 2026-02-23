import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { VectorService } from "../vector/vector.service";
import { ExtractorRegistry } from "../extractors/extractor.registry";
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
  ) {}

  abstract get pipelineType(): string;
  abstract get indexName(): string;
  abstract discoverFiles(): DiscoveredFile[];
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
    const files = this.discoverFiles();
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

    // Build work queue: hash-check against IngestionRecord
    const queue: Array<{ file: DiscoveredFile; hash: string }> = [];
    let skippedFiles = 0;

    for (const file of files) {
      const hash = fileHash(file.filePath);
      const existing = await this.prisma.ingestionRecord.findUnique({
        where: {
          pipeline_filePath: {
            pipeline: this.pipelineType,
            filePath: file.filePath,
          },
        },
      });

      if (existing?.status === "done" && existing.fileHash === hash) {
        this.logger.log(`Skipping (already ingested): ${file.filePath}`);
        skippedFiles++;
        continue;
      }

      if (existing?.fileHash && existing.fileHash !== hash) {
        this.logger.log(`Queued (file changed): ${file.filePath}`);
      } else if (existing?.status === "error") {
        this.logger.log(`Queued (retrying failed): ${file.filePath}`);
      } else {
        this.logger.log(`Queued: ${file.filePath}`);
      }

      queue.push({ file, hash });
    }

    const totalToProcess = queue.length;
    const workerCount = Math.min(config.concurrency, totalToProcess);

    this.logger.log(
      `Skipped ${skippedFiles}, processing ${totalToProcess} with ${workerCount} workers`,
    );

    // Shared counters
    let totalChunks = 0;
    let processedFiles = 0;
    let errorFiles = 0;

    const processItem = async (
      item: { file: DiscoveredFile; hash: string },
      workerId: number,
    ): Promise<void> => {
      const tag = `[W${workerId}]`;
      const { file, hash } = item;

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

      try {
        const count = await this.ingestFile(file, config);
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
        });

        errorFiles++;
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
    config: PipelineConfig,
  ): Promise<number> {
    const fileStart = Date.now();
    this.logger.log(`Processing [${file.sourceType}]: ${file.filePath}`);

    // Extract text
    const context = this.getExtractContext(file);
    let text = await this.extractors.extract(
      file.sourceType,
      file.filePath,
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

      const embeddings = await this.vector.embedBatch(batch);

      const metadata = batch.map((chunkText, j) =>
        this.buildChunkMetadata(file, chunkText, i + j),
      );

      await this.vector.upsert(this.indexName, embeddings, metadata);

      totalUpserted += batch.length;
      this.logger.log(
        `Batch ${batchNum}/${totalBatches}: embedded + upserted ${batch.length} chunks (${elapsed(batchStart)})`,
      );
    }

    this.logger.log(
      `Done: ${file.filePath} -> ${totalUpserted} chunks (${elapsed(fileStart)})`,
    );
    return totalUpserted;
  }
}
