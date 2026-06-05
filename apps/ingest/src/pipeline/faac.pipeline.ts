import { Injectable, Logger } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { PipelineBase } from "./pipeline.base";
import {
  DiscoveredFile,
  PipelineConfig,
  PipelineResult,
  DEFAULT_PIPELINE_CONFIG,
} from "./pipeline.types";
import { loadFaacDisbursements } from "./faac-db-loader";
import { buildAllFaacChunks, type FaacChunk } from "./faac-db-chunk-builder";

/**
 * FAAC vector indexer.
 *
 * Source of truth is the database: the structured FAAC tables
 * (`faac_disbursements`, `faac_state_allocations`, `faac_lga_allocations`,
 * `faac_fgn_details`) are populated by the Excel seeder. This pipeline reads
 * them back, builds rich chunks (see `faac-db-chunk-builder.ts`), embeds, and
 * upserts to the FAAC vector index with deterministic IDs so re-runs replace
 * rather than duplicate. No S3, PDF, or LLM extraction involved.
 */
@Injectable()
export class FaacPipeline extends PipelineBase {
  protected readonly logger = new Logger(FaacPipeline.name);

  get pipelineType(): string {
    return "faac";
  }

  get indexName(): string {
    return this.config.get<string>("VECTOR_INDEX_FAAC") ?? "faac_vectors";
  }

  /**
   * Read FAAC data from the DB → build chunks → embed → upsert.
   */
  async run(
    configOverrides?: Partial<PipelineConfig>,
  ): Promise<PipelineResult> {
    const config = { ...DEFAULT_PIPELINE_CONFIG, ...configOverrides };
    const pipelineStart = Date.now();

    this.emitLog("log", `=== ${this.pipelineType} Ingestion Pipeline (DB source) ===`);
    await this.vector.ensureIndex(this.indexName);

    this.emitLog("log", "Loading FAAC disbursements from database...");
    const disbursements = await loadFaacDisbursements(
      this.prisma as unknown as PrismaClient,
    );

    if (disbursements.length === 0) {
      this.emitLog(
        "warn",
        "No FAAC disbursements found in DB. Seed them first (seed-faac-excel.ts).",
      );
      return {
        pipeline: this.pipelineType,
        totalFiles: 0,
        processedFiles: 0,
        skippedFiles: 0,
        errorFiles: 0,
        totalChunks: 0,
        durationMs: Date.now() - pipelineStart,
        stopped: false,
      };
    }

    this.emitLog(
      "log",
      `Loaded ${disbursements.length} disbursements. Building chunks...`,
    );
    const chunks: FaacChunk[] = buildAllFaacChunks(disbursements);
    this.emitLog(
      "log",
      `Built ${chunks.length} chunks. Embedding + upserting (batchSize=${config.batchSize})...`,
    );

    let totalChunks = 0;
    let errors = 0;
    const batchSize = config.batchSize;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      try {
        const embeddings = await this.vector.embedBatch(
          batch.map((c) => c.text),
        );
        await this.vector.upsert(
          this.indexName,
          embeddings,
          batch.map((c) => c.metadata),
          batch.map((c) => c.id),
        );
        totalChunks += batch.length;
        if ((i / batchSize) % 10 === 0) {
          this.emitLog(
            "log",
            `  upserted ${totalChunks}/${chunks.length} chunks...`,
          );
        }
      } catch (err) {
        errors++;
        this.emitLog(
          "error",
          `Batch ${Math.floor(i / batchSize) + 1} failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    // Record a single ingestion summary row for the DB-sourced run.
    await this.prisma.ingestionRecord
      .upsert({
        where: {
          pipeline_filePath: {
            pipeline: this.pipelineType,
            filePath: "db/faac",
          },
        },
        create: {
          pipeline: this.pipelineType,
          filePath: "db/faac",
          fileHash: "",
          sourceType: "database",
          identity: { source: "faac_disbursements", disbursements: disbursements.length },
          status: errors > 0 ? "error" : "done",
          chunks: totalChunks,
        },
        update: {
          status: errors > 0 ? "error" : "done",
          chunks: totalChunks,
          identity: { source: "faac_disbursements", disbursements: disbursements.length },
        },
      })
      .catch(() => {});

    const durationMs = Date.now() - pipelineStart;
    this.emitLog("log", `=== ${this.pipelineType} Complete ===`);
    this.emitLog(
      "log",
      `Disbursements: ${disbursements.length}, Chunks: ${totalChunks}, Failed batches: ${errors}, Time: ${durationMs}ms`,
    );

    return {
      pipeline: this.pipelineType,
      totalFiles: disbursements.length,
      processedFiles: disbursements.length,
      skippedFiles: 0,
      errorFiles: errors,
      totalChunks,
      durationMs,
      stopped: false,
    };
  }

  // FAAC reads from the DB, not from discovered files. The abstract members
  // below are required by PipelineBase but unused by the custom run() above.

  async discoverFiles(): Promise<DiscoveredFile[]> {
    return [];
  }

  buildChunkMetadata(): Record<string, unknown> {
    return {};
  }

  buildFileFromS3Key(): DiscoveredFile | null {
    return null;
  }

  override async processSingleFile(): Promise<PipelineResult> {
    throw new Error(
      "FaacPipeline reads from the DB; use run() (single-file/SQS not supported).",
    );
  }
}
