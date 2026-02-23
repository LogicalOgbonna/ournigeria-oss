import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { VectorService } from '../vector/vector.service';
import { ExtractorRegistry } from '../extractors/extractor.registry';
import { PipelineBase } from './pipeline.base';
import { DiscoveredFile } from './pipeline.types';

const FEDERAL_BUDGET_DIR = path.resolve(
  __dirname,
  '../../../../packages/source/federal_budget',
);

@Injectable()
export class FederalBudgetPipeline extends PipelineBase {
  protected readonly logger = new Logger(FederalBudgetPipeline.name);

  constructor(
    prisma: PrismaService,
    vector: VectorService,
    extractors: ExtractorRegistry,
  ) {
    super(prisma, vector, extractors);
  }

  get pipelineType(): string {
    return 'federal-budget';
  }

  get indexName(): string {
    return 'federal_budget_chunks';
  }

  discoverFiles(): DiscoveredFile[] {
    const files: DiscoveredFile[] = [];

    if (!fs.existsSync(FEDERAL_BUDGET_DIR)) {
      this.logger.error(
        `Federal budget directory not found: ${FEDERAL_BUDGET_DIR}`,
      );
      return files;
    }

    this.logger.log(`Scanning: ${FEDERAL_BUDGET_DIR}`);
    const years = fs.readdirSync(FEDERAL_BUDGET_DIR).filter((entry) => {
      const entryPath = path.join(FEDERAL_BUDGET_DIR, entry);
      return fs.statSync(entryPath).isDirectory() && /^\d{4}$/.test(entry);
    });
    this.logger.log(`Found ${years.length} year directories`);

    for (const year of years) {
      const yearPath = path.join(FEDERAL_BUDGET_DIR, year);
      const entries = fs.readdirSync(yearPath);

      for (const filename of entries) {
        const ext = path.extname(filename).toLowerCase();
        let sourceType: string | null = null;

        if (ext === '.pdf') sourceType = 'pdf';
        else if (ext === '.xlsx' || ext === '.xls') sourceType = 'xlsx';
        else if (ext === '.docx' || ext === '.doc') sourceType = 'docx';
        else if (ext === '.json' && filename !== 'download_manifest.json')
          sourceType = 'json';
        else if (ext === '.md') sourceType = 'md';

        if (sourceType) {
          files.push({
            filePath: path.join(yearPath, filename),
            sourceType,
            identity: {
              year: Number.parseInt(year, 10),
              filename,
            },
          });
        }
      }
    }

    return files;
  }

  buildChunkMetadata(
    file: DiscoveredFile,
    chunkText: string,
    chunkIndex: number,
  ): Record<string, unknown> {
    const { year, filename } = file.identity as {
      year: number;
      filename: string;
    };
    return {
      text: chunkText,
      year,
      filename,
      source_type: file.sourceType,
      chunk_index: chunkIndex,
    };
  }
}
