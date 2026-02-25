import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { VectorService } from '../vector/vector.service';
import { ExtractorRegistry } from '../extractors/extractor.registry';
import { ExtractContext } from '../extractors/extractor.interface';
import { PipelineBase } from './pipeline.base';
import { DiscoveredFile } from './pipeline.types';

const BUDGETS_DIR = path.resolve(__dirname, '../../../../packages/source/budgets');

@Injectable()
export class BudgetPipeline extends PipelineBase {
  protected readonly logger = new Logger(BudgetPipeline.name);

  constructor(
    config: ConfigService,
    prisma: PrismaService,
    vector: VectorService,
    extractors: ExtractorRegistry,
  ) {
    super(config, prisma, vector, extractors);
  }

  get pipelineType(): string {
    return 'budget';
  }

  get indexName(): string {
    return this.config.getOrThrow<string>('VECTOR_INDEX_BUDGET');
  }

  discoverFiles(): DiscoveredFile[] {
    const files: DiscoveredFile[] = [];

    if (!fs.existsSync(BUDGETS_DIR)) {
      this.logger.error(`Budgets directory not found: ${BUDGETS_DIR}`);
      return files;
    }

    this.logger.log(`Scanning: ${BUDGETS_DIR}`);
    const states = fs.readdirSync(BUDGETS_DIR).filter((entry) => {
      const entryPath = path.join(BUDGETS_DIR, entry);
      return fs.statSync(entryPath).isDirectory();
    });
    this.logger.log(`Found ${states.length} state directories`);

    for (const state of states) {
      const statePath = path.join(BUDGETS_DIR, state);
      const years = fs.readdirSync(statePath).filter((entry) => {
        const entryPath = path.join(statePath, entry);
        return fs.statSync(entryPath).isDirectory() && /^\d{4}$/.test(entry);
      });

      for (const year of years) {
        const yearPath = path.join(statePath, year);
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
                state: state.replaceAll('_', ' '),
                year: Number.parseInt(year, 10),
                filename,
              },
            });
          }
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
    const { state, year, filename } = file.identity as {
      state: string;
      year: number;
      filename: string;
    };
    return {
      text: chunkText,
      state,
      year,
      filename,
      source_type: file.sourceType,
      chunk_index: chunkIndex,
    };
  }

  protected getExtractContext(file: DiscoveredFile): ExtractContext | undefined {
    if (file.sourceType === 'json') {
      const { state, year } = file.identity as { state: string; year: number };
      return { header: `${state} ${year} Budget Metadata` };
    }
    return undefined;
  }
}
