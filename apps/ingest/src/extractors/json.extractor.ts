import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import { ITextExtractor, ExtractContext } from './extractor.interface';

@Injectable()
export class JsonExtractor implements ITextExtractor {
  readonly supportedTypes = ['json'];
  private readonly logger = new Logger(JsonExtractor.name);

  async extract(filePath: string, context?: ExtractContext): Promise<string> {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    const header = context?.header as string | undefined;
    const lines: string[] = header ? [header] : [];

    function flatten(obj: Record<string, unknown>, prefix = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const label = prefix
          ? `${prefix} - ${key.replaceAll('_', ' ')}`
          : key.replaceAll('_', ' ');
        if (value === null || value === undefined) continue;
        if (typeof value === 'object' && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, label);
        } else if (Array.isArray(value)) {
          lines.push(`${label}: ${value.join(', ')}`);
        } else if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          lines.push(`${label}: ${value}`);
        } else {
          lines.push(`${label}: ${JSON.stringify(value)}`);
        }
      }
    }

    flatten(data);
    const fullText = lines.join('\n');
    this.logger.log(`JSON extraction done (${fullText.length} total chars)`);
    return fullText;
  }
}
