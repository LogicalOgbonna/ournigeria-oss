import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import { ITextExtractor, ExtractContext } from './extractor.interface';

@Injectable()
export class MarkdownExtractor implements ITextExtractor {
  readonly supportedTypes = ['md'];
  private readonly logger = new Logger(MarkdownExtractor.name);

  async extract(filePath: string, _context?: ExtractContext): Promise<string> {
    const text = fs.readFileSync(filePath, 'utf-8').trim();
    this.logger.log(`Markdown read (${text.length} chars)`);
    return text;
  }
}
