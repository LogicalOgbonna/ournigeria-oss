import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { VectorService } from "../vector/vector.service";
import { ExtractorRegistry } from "../extractors/extractor.registry";
import { S3Service } from "../s3/s3.service";
import { ExtractContext } from "../extractors/extractor.interface";
import { PipelineBase } from "./pipeline.base";
import { DiscoveredFile } from "./pipeline.types";
import { BudgetSummarizerService } from "./budget-summarizer.service";
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
    private readonly budgetSummarizer: BudgetSummarizerService,
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

    this.emitLog("log", "Listing S3 objects under budgets/");
    const objects = await this.s3.listObjects("budgets/");
    this.emitLog("log", `Found ${objects.length} objects in S3`);

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

  buildFileFromS3Key(key: string, etag: string): DiscoveredFile | null {
    const parts = key.split("/");
    if (parts.length < 4) return null;
    const stateDir = parts[1];
    const yearStr = parts[2];
    const filename = parts.slice(3).join("/");
    if (!filename || !/^\d{4}$/.test(yearStr)) return null;
    const extMatch = filename.match(/\.[^.]+$/);
    if (!extMatch) return null;
    const ext = extMatch[0].toLowerCase();
    const sourceType = EXT_TO_SOURCE_TYPE[ext];
    if (!sourceType) return null;
    return {
      filePath: key,
      sourceType,
      s3Key: key,
      s3Etag: etag,
      identity: {
        state: stateDir.replaceAll("_", " "),
        year: Number.parseInt(yearStr, 10),
        filename,
      },
    };
  }

  protected async enhanceChunks(
    file: DiscoveredFile,
    text: string,
    currentChunks: string[],
  ): Promise<string[]> {
    const enhancedChunks = [...currentChunks];

    try {
      const totals = await this.budgetSummarizer.extractTotals(text);
      const { state, year } = file.identity as { state: string; year: number };

      if (totals.overallStateBudget) {
        const overallSummary = `Summary Chunk: The total aggregate approved budget for ${state} State for the year ${year} is ₦${totals.overallStateBudget.toLocaleString()}. This encompasses the entire state budget across all sectors.`;
        enhancedChunks.push(overallSummary);
      }

      if (totals.sectors && totals.sectors.length > 0) {
        for (const sector of totals.sectors) {
          if (!sector.grandTotal) continue;
          let sectorSummary = `Summary Chunk: The total aggregate approved budget for the ${sector.sectorName} sector in ${state} State for the year ${year} is ₦${sector.grandTotal.toLocaleString()}.`;
          if (sector.totalCapitalExpenditure) {
            sectorSummary += ` Capital expenditure is ₦${sector.totalCapitalExpenditure.toLocaleString()}.`;
          }
          if (sector.totalRecurrentExpenditure) {
            sectorSummary += ` Recurrent expenditure is ₦${sector.totalRecurrentExpenditure.toLocaleString()}.`;
          }
          enhancedChunks.push(sectorSummary);
        }
      }

      this.emitLog(
        "log",
        `Generated synthetic summary chunks for ${state} ${year}`,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.emitLog(
        "warn",
        `Failed to generate summary chunks for ${file.filePath}: ${errMsg}`,
      );
    }

    return enhancedChunks;
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

    const isSummary = chunkText.startsWith("Summary Chunk:");

    // For summary chunks, we might have the sector name in the text
    // We can rely on classifySector as it will likely pick up the sector name
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
      is_summary: isSummary,
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
