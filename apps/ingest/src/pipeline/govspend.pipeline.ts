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

@Injectable()
export class GovspendPipeline extends PipelineBase {
  protected readonly logger = new Logger(GovspendPipeline.name);

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

    this.logger.log(
      `=== ${this.pipelineType} Ingestion Pipeline (incremental) ===`,
    );

    await this.vector.ensureIndex(this.indexName);

    // Discover year prefixes: govspend/2018/, govspend/2019/, ...
    const yearPrefixes = await this.s3.listPrefixes("govspend/");
    this.logger.log(
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
      this.logger.log(`Year ${year}: ${monthPrefixes.length} months`);

      for (const monthPrefix of monthPrefixes.sort()) {
        const month = monthPrefix.split("/")[2];
        const batchStart = Date.now();

        this.logger.log(`--- Processing ${year}/${month} ---`);

        // List objects for this month only
        const objects = await this.s3.listObjects(monthPrefix);
        const files = this.parseObjects(objects);

        this.logger.log(
          `${year}/${month}: ${files.length} files discovered (${elapsed(batchStart)})`,
        );

        if (files.length === 0) continue;

        totalFiles += files.length;

        // Process this month's files using the base class worker pattern
        const result = await this.processFiles(files, config);
        processedFiles += result.processed;
        skippedFiles += result.skipped;
        errorFiles += result.errors;
        totalChunks += result.chunks;

        this.logger.log(
          `${year}/${month} done: ${result.processed} processed, ${result.skipped} skipped, ${result.errors} errors, ${result.chunks} chunks (${elapsed(batchStart)})`,
        );
      }
    }

    const durationMs = Date.now() - pipelineStart;
    this.logger.log(`=== ${this.pipelineType} Complete ===`);
    this.logger.log(`Total time: ${elapsed(pipelineStart)}`);
    this.logger.log(
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

  /** discoverFiles is unused for govspend (run is overridden) but required by abstract base */
  async discoverFiles(): Promise<DiscoveredFile[]> {
    return [];
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

    return {
      text: chunkText,
      year,
      month,
      day,
      organization_name: organizationMatch?.[1]?.trim() ?? "",
      beneficiary_name: beneficiaryMatch?.[1]?.trim() ?? "",
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
