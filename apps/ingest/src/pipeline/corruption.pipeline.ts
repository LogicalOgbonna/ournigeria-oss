import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { VectorService } from '../vector/vector.service';
import { ExtractorRegistry } from '../extractors/extractor.registry';
import { PipelineBase } from './pipeline.base';
import { DiscoveredFile } from './pipeline.types';

const CORRUPTION_DIR = path.resolve(__dirname, '../../../../packages/source/corruption');

@Injectable()
export class CorruptionPipeline extends PipelineBase {
  protected readonly logger = new Logger(CorruptionPipeline.name);

  constructor(
    prisma: PrismaService,
    vector: VectorService,
    extractors: ExtractorRegistry,
  ) {
    super(prisma, vector, extractors);
  }

  get pipelineType(): string {
    return 'corruption';
  }

  get indexName(): string {
    return 'corruption_chunks';
  }

  discoverFiles(): DiscoveredFile[] {
    const files: DiscoveredFile[] = [];

    if (!fs.existsSync(CORRUPTION_DIR)) {
      this.logger.error(`Corruption directory not found: ${CORRUPTION_DIR}`);
      return files;
    }

    this.logger.log(`Scanning: ${CORRUPTION_DIR}`);
    const entries = fs.readdirSync(CORRUPTION_DIR).filter((entry) => {
      const entryPath = path.join(CORRUPTION_DIR, entry);
      return fs.statSync(entryPath).isDirectory();
    });
    this.logger.log(`Found ${entries.length} official directories`);

    for (const officialDir of entries) {
      const officialPath = path.join(CORRUPTION_DIR, officialDir);
      const mdFiles = fs
        .readdirSync(officialPath)
        .filter((f) => f.endsWith('.md'));

      for (const filename of mdFiles) {
        const filePath = path.join(officialPath, filename);
        const stat = fs.statSync(filePath);

        if (stat.size === 0) {
          this.logger.log(`Skipping empty file: ${officialDir}/${filename}`);
          continue;
        }

        const section = path.basename(filename, '.md');
        files.push({
          filePath,
          sourceType: 'md',
          identity: {
            official: officialDir.replaceAll('_', ' '),
            section,
            filename,
          },
        });
      }
    }

    // Also pick up the top-level INDEX.md
    const indexPath = path.join(CORRUPTION_DIR, 'INDEX.md');
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).size > 0) {
      files.push({
        filePath: indexPath,
        sourceType: 'md',
        identity: {
          official: '_index',
          section: 'index',
          filename: 'INDEX.md',
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
    const { official, section, filename } = file.identity as {
      official: string;
      section: string;
      filename: string;
    };
    return {
      text: chunkText,
      official,
      section,
      filename,
      source_type: 'md',
      chunk_index: chunkIndex,
    };
  }
}
