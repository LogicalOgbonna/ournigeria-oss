import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { VectorService } from "../vector/vector.service";
import { ExtractorRegistry } from "../extractors/extractor.registry";
import { S3Service } from "../s3/s3.service";
import { ExtractContext } from "../extractors/extractor.interface";
import { PipelineBase } from "./pipeline.base";
import { DiscoveredFile } from "./pipeline.types";
import {
  classifySector,
  classifyBudgetCategory,
  classifyDocumentType,
  extractMDA,
} from "./budget-classifiers";

const EXT_TO_SOURCE_TYPE: Record<string, string> = {
  ".pdf": "pdf",
  ".xlsx": "xlsx",
  ".xls": "xlsx",
  ".docx": "docx",
  ".doc": "docx",
  ".json": "json",
  ".md": "md",
  ".xps": "xps",
  ".pptx": "pptx",
};

@Injectable()
export class BudgetPipeline extends PipelineBase {
  protected readonly logger = new Logger(BudgetPipeline.name);

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
    return "budget";
  }

  get indexName(): string {
    return this.config.getOrThrow<string>("VECTOR_INDEX_BUDGET");
  }

  async discoverFiles(): Promise<DiscoveredFile[]> {
    const files: DiscoveredFile[] = [];

    this.logger.log("Listing S3 objects under budgets/");
    const objects = await this.s3.listObjects("budgets/");
    this.logger.log(`Found ${objects.length} objects in S3`);

    for (const obj of objects) {
      // Expected key format: budgets/{STATE}/{YEAR}/{filename}
      const parts = obj.key.split("/");
      if (parts.length < 4) continue;

      const stateDir = parts[1];
      const yearStr = parts[2];
      const filename = parts.slice(3).join("/");

      if (!filename || !/^\d{4}$/.test(yearStr)) continue;

      const extMatch = filename.match(/\.[^.]+$/);
      if (!extMatch) continue;
      const ext = extMatch[0].toLowerCase();
      const sourceType = EXT_TO_SOURCE_TYPE[ext];
      if (!sourceType) continue;

      files.push({
        filePath: obj.key,
        sourceType,
        s3Key: obj.key,
        s3Etag: obj.etag,
        identity: {
          state: stateDir.replaceAll("_", " "),
          year: Number.parseInt(yearStr, 10),
          filename,
        },
      });
    }

    return files;
  }

  buildChunkMetadata(
    file: DiscoveredFile,
    chunkText: string,
    chunkIndex: number,
  ): Record<string, unknown> {
    const { state, year, filename } = file.identity as {
      state: string;
      year: number;
      filename: string;
    };
    const sector = classifySector(chunkText);
    const budget_category = classifyBudgetCategory(chunkText);
    const document_type = classifyDocumentType(chunkText, filename);
    const mda = extractMDA(chunkText);

    return {
      text: chunkText,
      state,
      year,
      filename,
      source_type: file.sourceType,
      chunk_index: chunkIndex,
      s3_key: file.s3Key ?? file.filePath,
      sector,
      budget_category,
      document_type,
      ...(mda && { mda }),
    };
  }

  protected getExtractContext(
    file: DiscoveredFile,
  ): ExtractContext | undefined {
    if (file.sourceType === "json") {
      const { state, year } = file.identity as { state: string; year: number };
      return { header: `${state} ${year} Budget Metadata` };
    }
    return undefined;
  }
}
