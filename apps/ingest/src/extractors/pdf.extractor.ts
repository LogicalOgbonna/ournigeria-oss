import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as fs from 'node:fs';
import { PDFParse } from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { elapsed } from '../lib/timing.utils';
import { ITextExtractor, ExtractContext } from './extractor.interface';

const MIN_TEXT_THRESHOLD = 100;

@Injectable()
export class PdfExtractor implements ITextExtractor {
  readonly supportedTypes = ['pdf'];
  private readonly logger = new Logger(PdfExtractor.name);
  private ocrModel: string;
  private openaiProvider: ReturnType<typeof createOpenAI>;

  constructor(private config: ConfigService) {
    this.ocrModel = this.config.getOrThrow<string>('OCR_MODEL');

    const timeoutMs = 5 * 60 * 1000;
    const fetchWithTimeout: typeof globalThis.fetch = (input, init) =>
      globalThis.fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

    this.openaiProvider = createOpenAI({
      baseURL: this.config.getOrThrow<string>('OCR_BASE_URL'),
      apiKey: this.config.getOrThrow<string>('OCR_API_KEY'),
      fetch: fetchWithTimeout,
    });
  }

  async extract(filePath: string, _context?: ExtractContext): Promise<string> {
    const pdfStart = Date.now();
    const data = fs.readFileSync(filePath);
    this.logger.log(`PDF loaded (${(data.length / 1024).toFixed(0)} KB)`);
    const pdf = new PDFParse({ data: new Uint8Array(data) });

    // --- Tier 1: Try digital text extraction ---
    try {
      const result = await pdf.getText();
      const text = result.text.trim();
      if (text.length > MIN_TEXT_THRESHOLD) {
        this.logger.log(
          `getText() extracted ${text.length} chars (${elapsed(pdfStart)}) — using digital text`,
        );
        await pdf.destroy();
        return text;
      }
      this.logger.log(
        `getText() returned only ${text.length} chars, falling back to OCR`,
      );
    } catch {
      this.logger.log(`getText() failed, falling back to OCR`);
    }

    // --- Tier 2 & 3: Page-by-page OCR ---
    const info = await pdf.getInfo();
    const totalPages = info.total;
    this.logger.log(`Total pages: ${totalPages}, starting page-by-page OCR`);

    const worker = await Tesseract.createWorker('eng');
    const pageTexts: string[] = [];

    for (let page = 1; page <= totalPages; page++) {
      const screenshots = await pdf.getScreenshot({
        partial: [page],
        imageDataUrl: true,
        imageBuffer: true,
        scale: 2,
      });

      if (screenshots.pages.length === 0) {
        this.logger.warn(
          `Page ${page}/${totalPages} - no screenshot produced, skipping`,
        );
        continue;
      }

      const pageData = screenshots.pages[0];

      // Tier 2: Tesseract.js
      try {
        const ocrStart = Date.now();
        const {
          data: { text },
        } = await worker.recognize(Buffer.from(pageData.data));
        if (text.trim().length > 20) {
          pageTexts.push(text.trim());
          this.logger.log(
            `Page ${page}/${totalPages} Tesseract OK (${elapsed(ocrStart)}, ${text.trim().length} chars)`,
          );
          continue;
        }
        this.logger.log(
          `Page ${page}/${totalPages} Tesseract returned too little text, trying vision model`,
        );
      } catch {
        this.logger.log(
          `Page ${page}/${totalPages} Tesseract failed, trying vision model`,
        );
      }

      // Tier 3: Vision model
      try {
        const ocrStart = Date.now();
        const { text } = await generateText({
          model: this.openaiProvider.chat(this.ocrModel),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this document page exactly as written. Preserve the structure including headers, tables, line items, and numbers. Return only the extracted text, no commentary.',
                },
                {
                  type: 'image',
                  image: pageData.dataUrl,
                },
              ],
            },
          ],
        });
        if (text.trim().length > 0) {
          pageTexts.push(text.trim());
          this.logger.log(
            `Page ${page}/${totalPages} Vision OK (${elapsed(ocrStart)}, ${text.trim().length} chars)`,
          );
          continue;
        }
      } catch (err) {
        this.logger.warn(
          `Page ${page}/${totalPages} Vision failed: ${err instanceof Error ? err.message : err}`,
        );
      }

      this.logger.warn(
        `Page ${page}/${totalPages} all methods failed, skipping`,
      );
    }

    await worker.terminate();
    await pdf.destroy();
    const fullText = pageTexts.join('\n\n--- Page Break ---\n\n');
    this.logger.log(
      `PDF extraction done (${elapsed(pdfStart)}, ${fullText.length} total chars)`,
    );
    return fullText;
  }
}
