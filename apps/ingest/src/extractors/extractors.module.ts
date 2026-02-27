import { Module } from '@nestjs/common';
import { PdfExtractor } from './pdf.extractor';
import { ExcelExtractor } from './excel.extractor';
import { DocxExtractor } from './docx.extractor';
import { JsonExtractor } from './json.extractor';
import { MarkdownExtractor } from './markdown.extractor';
import { XpsExtractor } from './xps.extractor';
import { PptxExtractor } from './pptx.extractor';
import { ExtractorRegistry } from './extractor.registry';

@Module({
  providers: [
    PdfExtractor,
    ExcelExtractor,
    DocxExtractor,
    JsonExtractor,
    MarkdownExtractor,
    XpsExtractor,
    PptxExtractor,
    ExtractorRegistry,
  ],
  exports: [ExtractorRegistry],
})
export class ExtractorsModule {}
