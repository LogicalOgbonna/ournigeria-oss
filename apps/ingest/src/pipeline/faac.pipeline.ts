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
import { FaacExtractorService, type FaacExtraction } from "./faac-extractor.service";
import {
  buildLgaMonthlyChunks,
  buildStateMonthlyChunks,
  buildNationalMonthlyChunk,
  buildZoneMonthlyChunks,
  buildStateAnnualChunks,
  type FaacChunk,
} from "./faac-chunk-builder";
import { elapsed } from "../lib/timing.utils";

/** S3 prefix for FAAC PDFs. Expected layout: faac/{Year}/{Month}/faac_allocation.pdf */
const S3_PREFIX = "faac/";

/**
 * S3 key for caching the LLM extraction JSON alongside each PDF.
 * e.g. faac/2025/January/extraction.json
 */
function cacheKey(year: number, month: string): string {
  return `faac/${year}/${month}/extraction.json`;
}

@Injectable()
export class FaacPipeline extends PipelineBase {
  protected readonly logger = new Logger(FaacPipeline.name);

  constructor(
    config: ConfigService,
    prisma: PrismaService,
    vector: VectorService,
    extractors: ExtractorRegistry,
    s3: S3Service,
    private readonly faacExtractor: FaacExtractorService,
  ) {
    super(config, prisma, vector, extractors, s3);
  }

  get pipelineType(): string {
    return "faac";
  }

  get indexName(): string {
    return this.config.get<string>("VECTOR_INDEX_FAAC") ?? "faac_vectors";
  }

  /**
   * Custom run() that:
   * 1. Discovers FAAC PDFs from S3
   * 2. For each: download → extract text → LLM structured extraction → build chunks → embed + upsert
   * 3. After all files: build annual aggregation chunks
   */
  async run(
    configOverrides?: Partial<PipelineConfig>,
  ): Promise<PipelineResult> {
    const config = { ...DEFAULT_PIPELINE_CONFIG, ...configOverrides };
    const pipelineStart = Date.now();

    this.emitLog("log", `=== ${this.pipelineType} Ingestion Pipeline ===`);
    await this.vector.ensureIndex(this.indexName);

    const files = await this.discoverFiles();
    this.emitLog("log", `Discovered ${files.length} FAAC PDF files`);

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

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let totalChunks = 0;

    // Collect all extractions for annual aggregation
    const allExtractions: FaacExtraction[] = [];

    // Process files sequentially (LLM extraction is the bottleneck)
    for (const file of files) {
      const { year, month } = file.identity as { year: number; month: string };
      const fileTag = `${year}/${month}`;
      let localFilePath: string | undefined;

      try {
        // ETag-based dedup
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
            this.emitLog("log", `[${fileTag}] Skipping (ETag unchanged)`);

            // Still try to load cached extraction for annual aggregation
            const cached = await this.loadCachedExtraction(year, month);
            if (cached) allExtractions.push(cached);

            skipped++;
            continue;
          }
        }

        // Check for cached LLM extraction in S3
        let extraction: FaacExtraction;
        const cached = await this.loadCachedExtraction(year, month);

        if (cached) {
          this.emitLog("log", `[${fileTag}] Using cached LLM extraction from S3`);
          extraction = cached;
        } else {
          // Download PDF from S3
          this.emitLog("log", `[${fileTag}] Downloading PDF from S3...`);
          localFilePath = await this.s3.downloadToTemp(file.s3Key!);

          // Extract text from PDF
          this.emitLog("log", `[${fileTag}] Extracting text from PDF...`);
          const text = await this.extractors.extract("pdf", localFilePath);

          if (!text || text.trim().length < 100) {
            this.emitLog("warn", `[${fileTag}] PDF extraction yielded insufficient text`);
            errors++;
            continue;
          }

          this.emitLog(
            "log",
            `[${fileTag}] Extracted ${text.length} chars, running LLM extraction...`,
          );

          const extractStart = Date.now();
          extraction = await this.faacExtractor.extract(text, year, month);
          this.emitLog(
            "log",
            `[${fileTag}] LLM extraction complete (${elapsed(extractStart)}): ` +
              `${extraction.states.length} states, ${extraction.lgas.length} LGAs`,
          );

          // Cache the extraction to S3
          await this.saveCachedExtraction(year, month, extraction);
        }

        allExtractions.push(extraction);

        // Build chunks
        const sourceFile = `faac/${year}/${month}/faac_allocation.pdf`;
        const chunks: FaacChunk[] = [
          ...buildLgaMonthlyChunks(extraction, sourceFile),
          ...buildStateMonthlyChunks(extraction, sourceFile),
          buildNationalMonthlyChunk(extraction, sourceFile),
          ...buildZoneMonthlyChunks(extraction, sourceFile),
        ];

        this.emitLog(
          "log",
          `[${fileTag}] Built ${chunks.length} chunks, embedding + upserting...`,
        );

        // Embed and upsert in batches
        const batchSize = config.batchSize;
        let fileChunks = 0;

        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const batchTexts = batch.map((c) => c.text);
          const batchMeta = batch.map((c) => c.metadata);

          try {
            const embeddings = await this.vector.embedBatch(batchTexts);
            await this.vector.upsert(this.indexName, embeddings, batchMeta);
            fileChunks += batch.length;
          } catch (err) {
            this.emitLog(
              "error",
              `[${fileTag}] Batch ${Math.floor(i / batchSize) + 1} failed: ${err instanceof Error ? err.message : err}`,
            );
          }
        }

        totalChunks += fileChunks;
        processed++;

        // Record in ingestion table
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
            fileHash: "",
            s3Etag: file.s3Etag || null,
            sourceType: "pdf",
            identity: file.identity as any,
            status: "done",
            chunks: fileChunks,
          },
          update: {
            status: "done",
            s3Etag: file.s3Etag || null,
            chunks: fileChunks,
          },
        });

        this.emitLog(
          "log",
          `[${fileTag}] DONE: ${fileChunks} chunks upserted`,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.emitLog("error", `[${fileTag}] FAILED: ${errMsg}`);
        errors++;

        await this.prisma.ingestionRecord
          .upsert({
            where: {
              pipeline_filePath: {
                pipeline: this.pipelineType,
                filePath: file.filePath,
              },
            },
            create: {
              pipeline: this.pipelineType,
              filePath: file.filePath,
              fileHash: "",
              s3Etag: file.s3Etag || null,
              sourceType: "pdf",
              identity: file.identity as any,
              status: "error",
              errorMsg: errMsg,
              chunks: 0,
            },
            update: {
              status: "error",
              errorMsg: errMsg,
            },
          })
          .catch(() => {});
      } finally {
        if (localFilePath) {
          this.s3.cleanupTempFile(localFilePath);
        }
      }
    }

    // Build annual aggregation chunks only when at least one file was newly processed
    if (processed > 0 && allExtractions.length > 0) {
      this.emitLog("log", "Building annual aggregation chunks...");
      const annualStart = Date.now();
      const annualChunks = buildStateAnnualChunks(allExtractions);

      this.emitLog(
        "log",
        `Built ${annualChunks.length} annual chunks, embedding + upserting...`,
      );

      const batchSize = config.batchSize;
      for (let i = 0; i < annualChunks.length; i += batchSize) {
        const batch = annualChunks.slice(i, i + batchSize);
        const batchTexts = batch.map((c) => c.text);
        const batchMeta = batch.map((c) => c.metadata);

        try {
          const embeddings = await this.vector.embedBatch(batchTexts);
          await this.vector.upsert(this.indexName, embeddings, batchMeta);
          totalChunks += batch.length;
        } catch (err) {
          this.emitLog(
            "error",
            `Annual batch failed: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      this.emitLog(
        "log",
        `Annual chunks done (${elapsed(annualStart)})`,
      );
    }

    const durationMs = Date.now() - pipelineStart;
    this.emitLog("log", `=== ${this.pipelineType} Complete ===`);
    this.emitLog("log", `Total time: ${elapsed(pipelineStart)}`);
    this.emitLog(
      "log",
      `Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}, Chunks: ${totalChunks}`,
    );

    return {
      pipeline: this.pipelineType,
      totalFiles: files.length,
      processedFiles: processed,
      skippedFiles: skipped,
      errorFiles: errors,
      totalChunks,
      durationMs,
    };
  }

  /**
   * Discover FAAC PDF files from S3.
   * Expected key format: faac/{Year}/{Month}/faac_allocation.pdf
   */
  async discoverFiles(): Promise<DiscoveredFile[]> {
    const files: DiscoveredFile[] = [];

    this.emitLog("log", `Listing S3 objects under ${S3_PREFIX}`);
    const objects = await this.s3.listObjects(S3_PREFIX);
    this.emitLog("log", `Found ${objects.length} objects in S3`);

    for (const obj of objects) {
      if (!obj.key.endsWith(".pdf")) continue;
      if (obj.size === 0) continue;

      // Expected: faac/{Year}/{Month}/faac_allocation.pdf
      const parts = obj.key.split("/");
      if (parts.length < 4) continue;

      const yearStr = parts[1];
      const month = parts[2];
      if (!/^\d{4}$/.test(yearStr)) continue;

      files.push({
        filePath: obj.key,
        sourceType: "pdf",
        s3Key: obj.key,
        s3Etag: obj.etag,
        identity: {
          year: parseInt(yearStr, 10),
          month,
        },
      });
    }

    return files;
  }

  protected generateContextPrefix(
    _file: DiscoveredFile,
    metadata: Record<string, unknown>,
  ): string {
    const chunkType = metadata.chunk_type || "raw";
    const state = metadata.state || "";
    const lga = metadata.lga || "";
    const month = metadata.month || "";
    const year = metadata.year || "";
    const location = lga ? `${lga} LGA, ${state}` : state || "national";
    const period = [month, year].filter(Boolean).join(" ");
    return `This chunk is from the FAAC ${chunkType} allocation data for ${location}, ${period}: `;
  }

  buildChunkMetadata(
    file: DiscoveredFile,
    chunkText: string,
    chunkIndex: number,
  ): Record<string, unknown> {
    const { year, month } = file.identity as { year: number; month: string };
    return {
      text: chunkText,
      chunk_type: "raw",
      year,
      month,
      state: "",
      lga: "",
      geopolitical_zone: "",
      total_allocation: 0,
      is_oil_producing: false,
      source_file: `faac/${year}/${month}/faac_allocation.pdf`,
      chunk_index: chunkIndex,
    };
  }

  /** FAAC uses a custom run() flow — single-file processing via SQS is not supported. */
  override async processSingleFile(): Promise<PipelineResult> {
    throw new Error(
      "FaacPipeline does not support processSingleFile; use run() instead",
    );
  }

  buildFileFromS3Key(key: string, etag: string): DiscoveredFile | null {
    if (!key.endsWith(".pdf")) return null;
    const parts = key.split("/");
    if (parts.length < 4) return null;

    const yearStr = parts[1];
    const month = parts[2];
    if (!/^\d{4}$/.test(yearStr)) return null;

    return {
      filePath: key,
      sourceType: "pdf",
      s3Key: key,
      s3Etag: etag,
      identity: {
        year: parseInt(yearStr, 10),
        month,
      },
    };
  }

  /** Try to load a cached LLM extraction JSON from S3. */
  private async loadCachedExtraction(
    year: number,
    month: string,
  ): Promise<FaacExtraction | null> {
    try {
      const key = cacheKey(year, month);
      const data = await this.s3.downloadAsString(key);
      return JSON.parse(data) as FaacExtraction;
    } catch {
      return null;
    }
  }

  /** Save LLM extraction JSON to S3 for caching. */
  private async saveCachedExtraction(
    year: number,
    month: string,
    extraction: FaacExtraction,
  ): Promise<void> {
    try {
      const key = cacheKey(year, month);
      const body = JSON.stringify(extraction, null, 2);
      await this.s3.uploadBuffer(Buffer.from(body, "utf-8"), key, "application/json");
      this.emitLog("log", `Cached extraction to S3: ${key}`);
    } catch (err) {
      this.emitLog(
        "warn",
        `Failed to cache extraction to S3: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
