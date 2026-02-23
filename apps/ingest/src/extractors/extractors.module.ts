import { Module } from '@nestjs/common';
import { PdfExtractor } from './pdf.extractor';
import { ExcelExtractor } from './excel.extractor';
import { DocxExtractor } from './docx.extractor';
import { JsonExtractor } from './json.extractor';
import { MarkdownExtractor } from './markdown.extractor';
import { ExtractorRegistry } from './extractor.registry';

@Module({
  providers: [
    PdfExtractor,
    ExcelExtractor,
    DocxExtractor,
    JsonExtractor,
    MarkdownExtractor,
    ExtractorRegistry,
  ],
  exports: [ExtractorRegistry],
})
export class ExtractorsModule {}
