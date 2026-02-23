import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ITextExtractor, ExtractContext } from './extractor.interface';

@Injectable()
export class ExcelExtractor implements ITextExtractor {
  readonly supportedTypes = ['xlsx', 'xls'];
  private readonly logger = new Logger(ExcelExtractor.name);

  async extract(filePath: string, _context?: ExtractContext): Promise<string> {
    const workbook = XLSX.readFile(filePath);
    const textParts: string[] = [];
    this.logger.log(
      `Excel loaded: ${workbook.SheetNames.length} sheet(s) [${workbook.SheetNames.join(', ')}]`,
    );

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      this.logger.log(`Sheet "${sheetName}": ${csv.length} chars`);
      textParts.push(`Sheet: ${sheetName}\n${csv}`);
    }

    const fullText = textParts.join('\n\n');
    this.logger.log(`Excel extraction done (${fullText.length} total chars)`);
    return fullText;
  }
}
