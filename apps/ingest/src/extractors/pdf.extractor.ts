import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ournigeria/database';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import { elapsed } from '../lib/timing.utils';
import { ITextExtractor, ExtractContext } from './extractor.interface';

const MIN_TEXT_THRESHOLD = 100;

/**
 * Strip common PDF noise that inflates char count without carrying real content:
 * page markers like "-- 1 of 7 --", form-feed chars, and runs of whitespace.
 */
function meaningfulText(raw: string): string {
  return raw
    .replaceAll(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replaceAll(/page\s*\d+\s*(of\s*\d+)?/gi, '')
    .replaceAll('\f', '')
    .replaceAll(' ', ' ')
    .trim();
}

const VISION_OCR_PROMPT = `You are a precise document OCR system. Extract ALL text from this document page image exactly as written.

Rules:
- Preserve the original structure: headings, subheadings, paragraphs, lists, and line breaks.
- For tables: reproduce them in a readable plain-text format using aligned columns or markdown table syntax. Include ALL rows and columns — do not summarize or truncate.
- Preserve all numbers, currency amounts, percentages, and codes exactly as they appear (e.g. "₦1,234,567.89", "N/A", "0.00").
- Keep hierarchical indentation for budget line items and nested categories.
- If text is partially obscured or unclear, transcribe your best reading and mark uncertain portions with [unclear].
- Do not add any commentary, explanation, or interpretation — return only the extracted text.`;

@Injectable()
export class PdfExtractor implements ITextExtractor {
  readonly supportedTypes = ['pdf'];
  private readonly logger = new Logger(PdfExtractor.name);
  private cachedProvider: ReturnType<typeof createOpenAI> | null = null;
  private cachedModel = '';
  private cachedKey = '';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private decrypt(ciphertext: string): string {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
    const key = crypto.createHash('sha256').update(secret).digest();
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) throw new Error('Invalid ciphertext format');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private async getOcrConfig(): Promise<{ baseUrl: string; apiKey: string; model: string }> {
    try {
      const rows = await this.prisma.systemSetting.findMany({
        where: { key: { in: ['ocr.base_url', 'ocr.api_key', 'ocr.model'] } },
      });

      if (rows.length > 0) {
        const get = (key: string) => {
          const row = rows.find((r) => r.key === key);
          if (!row) return '';
          if (row.encrypted) {
            try { return this.decrypt(row.value); } catch { return row.value; }
          }
          return row.value;
        };

        const baseUrl = get('ocr.base_url');
        const apiKey = get('ocr.api_key');
        const model = get('ocr.model');
        if (baseUrl && apiKey && model) return { baseUrl, apiKey, model };
      }
    } catch (err) {
      this.logger.warn('Failed to read OCR settings from DB, falling back to env vars', err);
    }

    return {
      baseUrl: this.config.getOrThrow<string>('OCR_BASE_URL'),
      apiKey: this.config.getOrThrow<string>('OCR_API_KEY'),
      model: this.config.getOrThrow<string>('OCR_MODEL'),
    };
  }

  private async getProviderAndModel() {
    const ocrConfig = await this.getOcrConfig();
    const cacheKey = `${ocrConfig.baseUrl}|${ocrConfig.model}`;

    if (this.cachedProvider && this.cachedKey === cacheKey) {
      return { provider: this.cachedProvider, model: this.cachedModel };
    }

    this.logger.log(`Building OCR provider: ${ocrConfig.model} @ ${ocrConfig.baseUrl}`);

    const timeoutMs = 5 * 60 * 1000;
    const fetchWithTimeout: typeof globalThis.fetch = (input, init) =>
      globalThis.fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });

    this.cachedProvider = createOpenAI({
      baseURL: ocrConfig.baseUrl,
      apiKey: ocrConfig.apiKey,
      fetch: fetchWithTimeout,
    });
    this.cachedModel = ocrConfig.model;
    this.cachedKey = cacheKey;
    return { provider: this.cachedProvider, model: this.cachedModel };
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
      const useful = meaningfulText(text);
      if (useful.length > MIN_TEXT_THRESHOLD) {
        this.logger.log(
          `getText() extracted ${useful.length} meaningful chars (${elapsed(pdfStart)}) — using digital text`,
        );
        await pdf.destroy();
        return text;
      }
      this.logger.log(
        `getText() returned only ${useful.length} meaningful chars (${text.length} raw), falling back to vision model`,
      );
    } catch {
      this.logger.log(`getText() failed, falling back to vision model`);
    }

    // --- Tier 2: Page-by-page Vision OCR ---
    const { provider, model: ocrModel } = await this.getProviderAndModel();
    const info = await pdf.getInfo();
    const totalPages = info.total;
    this.logger.log(
      `Total pages: ${totalPages}, starting page-by-page vision OCR`,
    );

    const pageTexts: string[] = [];

    // TODO: Add parallel processing for better performance
    for (let page = 1; page <= totalPages; page++) {
      const screenshots = await pdf.getScreenshot({
        partial: [page],
        imageDataUrl: true,
        scale: 2,
      });

      if (screenshots.pages.length === 0) {
        this.logger.warn(
          `Page ${page}/${totalPages} - no screenshot produced, skipping`,
        );
        continue;
      }

      const pageData = screenshots.pages[0];

      try {
        const ocrStart = Date.now();
        const { text } = await generateText({
          model: provider.chat(ocrModel),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: VISION_OCR_PROMPT,
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
        this.logger.warn(
          `Page ${page}/${totalPages} Vision returned empty text, skipping`,
        );
      } catch (err) {
        this.logger.warn(
          `Page ${page}/${totalPages} Vision failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    await pdf.destroy();
    const fullText = pageTexts.join('\n\n--- Page Break ---\n\n');
    this.logger.log(
      `PDF extraction done (${elapsed(pdfStart)}, ${fullText.length} total chars)`,
    );
    return fullText;
  }
}
