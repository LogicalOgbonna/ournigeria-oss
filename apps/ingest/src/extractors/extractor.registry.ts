import { Injectable } from '@nestjs/common';
import { ITextExtractor, ExtractContext } from './extractor.interface';
import { PdfExtractor } from './pdf.extractor';
import { ExcelExtractor } from './excel.extractor';
import { DocxExtractor } from './docx.extractor';
import { JsonExtractor } from './json.extractor';
import { MarkdownExtractor } from './markdown.extractor';

@Injectable()
export class ExtractorRegistry {
  private map = new Map<string, ITextExtractor>();

  constructor(
    pdf: PdfExtractor,
    excel: ExcelExtractor,
    docx: DocxExtractor,
    json: JsonExtractor,
    markdown: MarkdownExtractor,
  ) {
    for (const extractor of [pdf, excel, docx, json, markdown]) {
      for (const type of extractor.supportedTypes) {
        this.map.set(type, extractor);
      }
    }
  }

  get(sourceType: string): ITextExtractor | undefined {
    return this.map.get(sourceType);
  }

  async extract(
    sourceType: string,
    filePath: string,
    context?: ExtractContext,
  ): Promise<string> {
    const extractor = this.get(sourceType);
    if (!extractor) {
      throw new Error(`No extractor registered for source type: ${sourceType}`);
    }
    return extractor.extract(filePath, context);
  }
}
