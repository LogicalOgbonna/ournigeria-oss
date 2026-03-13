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
import { S3Object } from "../s3/s3.service";
import { elapsed } from "../lib/timing.utils";
import {
  buildMdaMonthlyChunks,
  buildMdaAnnualChunks,
  buildBeneficiaryAnnualChunks,
  type GovspendPaymentRecord,
  type GovspendChunk,
} from "./govspend-chunk-builder";

@Injectable()
export class GovspendPipeline extends PipelineBase {
  protected readonly logger = new Logger(GovspendPipeline.name);

  /** Accumulates payment records during ingestion for aggregation chunk building */
  private _monthlyRecords: GovspendPaymentRecord[] = [];

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
    return "govspend";
  }

  get indexName(): string {
    return this.config.getOrThrow<string>("VECTOR_INDEX_GOVSPEND");
  }

  /**
   * Override run() to process month-by-month instead of loading all 300k+ files at once.
   * Discovers year prefixes, then month prefixes within each year,
   * and processes each month's files as a batch.
   */
  async run(
    configOverrides?: Partial<PipelineConfig>,
  ): Promise<PipelineResult> {
    const config = { ...DEFAULT_PIPELINE_CONFIG, ...configOverrides };
    const pipelineStart = Date.now();

    this.emitLog(
      "log",
      `=== ${this.pipelineType} Ingestion Pipeline (incremental) ===`,
    );

    await this.vector.ensureIndex(this.indexName);

    // Discover year prefixes: govspend/2018/, govspend/2019/, ...
    const yearPrefixes = await this.s3.listPrefixes("govspend/");
    this.emitLog(
      "log",
      `Found ${yearPrefixes.length} year prefixes: ${yearPrefixes.map((p) => p.split("/")[1]).join(", ")}`,
    );

    let totalFiles = 0;
    let processedFiles = 0;
    let skippedFiles = 0;
    let errorFiles = 0;
    let totalChunks = 0;

    for (const yearPrefix of yearPrefixes.sort()) {
      const year = yearPrefix.split("/")[1];

      // Discover month prefixes: govspend/2020/January/, govspend/2020/February/, ...
      const monthPrefixes = await this.s3.listPrefixes(yearPrefix);
      this.emitLog("log", `Year ${year}: ${monthPrefixes.length} months`);

      // Collect all payment records for the year (for annual aggregation)
      const yearRecords: GovspendPaymentRecord[] = [];
      let yearHadProcessed = false;

      for (const monthPrefix of monthPrefixes.sort()) {
        const month = monthPrefix.split("/")[2];
        const batchStart = Date.now();

        this.emitLog("log", `--- Processing ${year}/${month} ---`);

        // List objects for this month only
        const objects = await this.s3.listObjects(monthPrefix);
        const files = this.parseObjects(objects);

        this.emitLog(
          "log",
          `${year}/${month}: ${files.length} files discovered (${elapsed(batchStart)})`,
        );

        if (files.length === 0) continue;

        totalFiles += files.length;

        // Clear accumulator before processing this month
        this._monthlyRecords = [];

        // Process this month's files using the base class worker pattern
        const result = await this.processFiles(files, config);
        processedFiles += result.processed;
        skippedFiles += result.skipped;
        errorFiles += result.errors;
        totalChunks += result.chunks;

        // Build MDA monthly summary chunks from accumulated records
        if (result.processed > 0 && this._monthlyRecords.length > 0) {
          yearHadProcessed = true;
          const monthlyChunks = buildMdaMonthlyChunks(this._monthlyRecords, year, month);
          totalChunks += await this.embedAggregationChunks(monthlyChunks, config, `${year}/${month} MDA monthly`);
        }

        // Accumulate for annual aggregation
        yearRecords.push(...this._monthlyRecords);

        this.emitLog(
          "log",
          `${year}/${month} done: ${result.processed} processed, ${result.skipped} skipped, ${result.errors} errors, ${result.chunks} chunks (${elapsed(batchStart)})`,
        );
      }

      // Build annual aggregation chunks after all months for this year
      if (yearHadProcessed && yearRecords.length > 0) {
        this.emitLog("log", `Building annual aggregation chunks for ${year}...`);
        const mdaAnnual = buildMdaAnnualChunks(yearRecords, year);
        const beneficiaryAnnual = buildBeneficiaryAnnualChunks(yearRecords, year);
        totalChunks += await this.embedAggregationChunks(mdaAnnual, config, `${year} MDA annual`);
        totalChunks += await this.embedAggregationChunks(beneficiaryAnnual, config, `${year} beneficiary annual`);
      }
    }

    const durationMs = Date.now() - pipelineStart;
    this.emitLog("log", `=== ${this.pipelineType} Complete ===`);
    this.emitLog("log", `Total time: ${elapsed(pipelineStart)}`);
    this.emitLog(
      "log",
      `Processed: ${processedFiles}, Skipped: ${skippedFiles}, Errors: ${errorFiles}, Chunks: ${totalChunks}`,
    );

    return {
      pipeline: this.pipelineType,
      totalFiles,
      processedFiles,
      skippedFiles,
      errorFiles,
      totalChunks,
      durationMs,
    };
  }

  private parseObjects(objects: S3Object[]): DiscoveredFile[] {
    const files: DiscoveredFile[] = [];

    for (const obj of objects) {
      if (!obj.key.endsWith(".md")) continue;
      if (obj.size === 0) continue;

      // Path: govspend/{YEAR}/{MONTH}/{DAY}/{beneficiary_slug}/{payment_id}.md
      const parts = obj.key.split("/");

      if (parts.length >= 6) {
        const year = parts[1];
        const month = parts[2];
        const day = parts[3];
        const beneficiarySlug = parts[4];
        const filename = parts.slice(5).join("/");

        files.push({
          filePath: obj.key,
          sourceType: "md",
          s3Key: obj.key,
          s3Etag: obj.etag,
          identity: {
            year,
            month,
            day,
            beneficiary_slug: beneficiarySlug,
            filename,
          },
        });
      }
    }

    return files;
  }

  /** Embed and upsert aggregation chunks (MDA monthly/annual, beneficiary annual). */
  private async embedAggregationChunks(
    chunks: GovspendChunk[],
    config: PipelineConfig,
    label: string,
  ): Promise<number> {
    if (chunks.length === 0) return 0;

    this.emitLog("log", `Embedding ${chunks.length} ${label} summary chunks...`);
    let upserted = 0;

    for (let i = 0; i < chunks.length; i += config.batchSize) {
      const batch = chunks.slice(i, i + config.batchSize);
      const batchTexts = batch.map((c) => c.text);
      const batchMeta = batch.map((c) => c.metadata);

      try {
        const embeddings = await this.vector.embedBatch(batchTexts);
        await this.vector.upsert(this.indexName, embeddings, batchMeta);
        upserted += batch.length;
      } catch (err) {
        this.emitLog(
          "error",
          `${label} batch failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.emitLog("log", `${label}: ${upserted} summary chunks upserted`);
    return upserted;
  }

  /** discoverFiles is unused for govspend (run is overridden) but required by abstract base */
  async discoverFiles(): Promise<DiscoveredFile[]> {
    return [];
  }

  buildFileFromS3Key(key: string, etag: string): DiscoveredFile | null {
    if (!key.endsWith(".md")) return null;
    const parts = key.split("/");
    if (parts.length < 6) return null;
    return {
      filePath: key,
      sourceType: "md",
      s3Key: key,
      s3Etag: etag,
      identity: {
        year: parts[1],
        month: parts[2],
        day: parts[3],
        beneficiary_slug: parts[4],
        filename: parts.slice(5).join("/"),
      },
    };
  }

  protected generateContextPrefix(
    _file: DiscoveredFile,
    metadata: Record<string, unknown>,
  ): string {
    const org = metadata.organization_name || "";
    const year = metadata.year || "";
    const chunkType = metadata.chunk_type || "payment";
    return `This chunk is a ${chunkType} government payment record from ${org}, ${year}: `;
  }

  buildChunkMetadata(
    file: DiscoveredFile,
    chunkText: string,
    chunkIndex: number,
  ): Record<string, unknown> {
    const { year, month, day, beneficiary_slug, filename } = file.identity as {
      year: string;
      month: string;
      day: string;
      beneficiary_slug: string;
      filename: string;
    };

    // Extract structured fields from the markdown text
    const organizationMatch =
      chunkText.match(/\*\*Organization\*\*:\s*(.+)/i) ??
      chunkText.match(/Organization:\s*(.+)/i);
    const beneficiaryMatch =
      chunkText.match(/\*\*Beneficiary\*\*:\s*(.+)/i) ??
      chunkText.match(/Beneficiary:\s*(.+)/i);
    const amountMatch =
      chunkText.match(/\*\*Amount\*\*:\s*(.+)/i) ??
      chunkText.match(/Amount:\s*(.+)/i);
    const paymentNoMatch =
      chunkText.match(/\*\*Payment No\*\*:\s*(.+)/i) ??
      chunkText.match(/Payment No:\s*(.+)/i);

    // New fields: description, payer_code, amount_numeric
    const descriptionMatch = chunkText.match(
      /##\s*Description\s*\n+([\s\S]*?)(?=\n---|\n##|$)/i,
    );
    const payerCodeMatch =
      chunkText.match(/\*\*Payer Code\*\*:\s*(\S+)/i) ??
      chunkText.match(/Payer Code:\s*(\S+)/i);

    // Parse numeric amount from strings like "₦23,830,389.00"
    let amount_numeric = 0;
    const rawAmount = amountMatch?.[1]?.trim() ?? "";
    const numericStr = rawAmount.replace(/[₦,\s]/g, "");
    const parsed = parseFloat(numericStr);
    if (!isNaN(parsed)) {
      amount_numeric = Math.round(parsed);
    }

    const orgName = organizationMatch?.[1]?.trim() ?? "";
    const benefName = beneficiaryMatch?.[1]?.trim() ?? "";

    // Accumulate for aggregation chunk building
    if (orgName && benefName && amount_numeric > 0) {
      this._monthlyRecords.push({
        organization_name: orgName,
        beneficiary_name: benefName,
        amount_numeric,
        year,
        month,
      });
    }

    return {
      text: chunkText,
      year,
      month,
      day,
      organization_name: orgName,
      beneficiary_name: benefName,
      amount: rawAmount,
      payment_no: paymentNoMatch?.[1]?.trim() ?? "",
      beneficiary_slug,
      filename,
      source_type: "md",
      chunk_index: chunkIndex,
      s3_key: file.s3Key ?? file.filePath,
      description: descriptionMatch?.[1]?.trim() ?? "",
      payer_code: payerCodeMatch?.[1]?.trim() ?? "",
      amount_numeric,
    };
  }
}
