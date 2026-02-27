import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { elapsed } from '../lib/timing.utils';
import { ITextExtractor, ExtractContext } from './extractor.interface';

const MIN_TEXT_THRESHOLD = 100;
const MIN_IMAGE_SIZE = 10 * 1024; // skip images < 10 KB (icons, logos)

const VISION_OCR_PROMPT = `You are a precise document OCR system. Extract ALL text from this document page image exactly as written.

Rules:
- Preserve the original structure: headings, subheadings, paragraphs, lists, and line breaks.
- For tables: reproduce them in a readable plain-text format using aligned columns or markdown table syntax. Include ALL rows and columns — do not summarize or truncate.
- Preserve all numbers, currency amounts, percentages, and codes exactly as they appear (e.g. "₦1,234,567.89", "N/A", "0.00").
- Keep hierarchical indentation for budget line items and nested categories.
- If text is partially obscured or unclear, transcribe your best reading and mark uncertain portions with [unclear].
- Do not add any commentary, explanation, or interpretation — return only the extracted text.`;

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function imageMime(ext: string): string | null {
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
  };
  return map[ext.toLowerCase()] ?? null;
}

@Injectable()
export class XpsExtractor implements ITextExtractor {
  readonly supportedTypes = ['xps'];
  private readonly logger = new Logger(XpsExtractor.name);
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
    const start = Date.now();
    const stat = fs.statSync(filePath);
    this.logger.log(`XPS file (${(stat.size / 1024).toFixed(0)} KB)`);

    // --- Tier 1: Extract text from Glyphs in .fpage XAML files ---
    const pageTexts: string[] = [];
    try {
      const fileList = execSync(`unzip -l "${filePath}"`, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
      });

      const fpageFiles = fileList
        .split('\n')
        .map((line) => line.trim().split(/\s+/).pop() ?? '')
        .filter((name) => name.endsWith('.fpage'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/(\d+)\.fpage$/)?.[1] ?? '0');
          const numB = parseInt(b.match(/(\d+)\.fpage$/)?.[1] ?? '0');
          return numA - numB;
        });

      this.logger.log(`Found ${fpageFiles.length} XPS pages`);

      for (const fpageFile of fpageFiles) {
        try {
          const xml = execSync(`unzip -p "${filePath}" "${fpageFile}"`, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
          });

          const texts: string[] = [];
          for (const match of xml.matchAll(/UnicodeString="([^"]*)"/g)) {
            const decoded = decodeXmlEntities(match[1]).trim();
            if (decoded) texts.push(decoded);
          }

          if (texts.length > 0) {
            pageTexts.push(texts.join('\n'));
            this.logger.log(
              `${fpageFile}: ${texts.length} text elements, ${texts.join('\n').length} chars`,
            );
          }
        } catch {
          this.logger.warn(`Failed to extract ${fpageFile}`);
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to list XPS contents: ${err instanceof Error ? err.message : err}`,
      );
    }

    const fullText = pageTexts.join('\n\n--- Page Break ---\n\n');
    if (fullText.length > MIN_TEXT_THRESHOLD) {
      this.logger.log(
        `Text extraction got ${fullText.length} chars (${elapsed(start)}) — using digital text`,
      );
      return fullText;
    }

    this.logger.log(
      `Text extraction got only ${fullText.length} chars, falling back to vision model`,
    );

    // --- Tier 2: Vision OCR on embedded images ---
    const imageTexts = await this.extractImagesWithVision(filePath);
    if (imageTexts.length > 0) {
      const visionText = imageTexts.join('\n\n--- Page Break ---\n\n');
      this.logger.log(
        `XPS extraction done via vision (${elapsed(start)}, ${visionText.length} total chars)`,
      );
      return visionText;
    }

    this.logger.warn(
      `XPS extraction failed — no text or images found (${elapsed(start)})`,
    );
    return fullText;
  }

  private async extractImagesWithVision(filePath: string): Promise<string[]> {
    const tmpDir = path.join(os.tmpdir(), `xps_images_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    const texts: string[] = [];

    try {
      const fileList = execSync(`unzip -l "${filePath}"`, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
      });

      const imageFiles = fileList
        .split('\n')
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          const size = parseInt(parts[0]);
          const name = parts[parts.length - 1];
          return { name, size };
        })
        .filter(({ name, size }) => {
          const ext = path.extname(name).toLowerCase();
          return imageMime(ext) !== null && size > MIN_IMAGE_SIZE;
        });

      this.logger.log(`Found ${imageFiles.length} images for vision OCR`);

      for (const { name } of imageFiles) {
        const tmpFile = path.join(tmpDir, path.basename(name));
        try {
          execSync(`unzip -p "${filePath}" "${name}" > "${tmpFile}"`, {
            shell: '/bin/sh',
          });

          const imgBuffer = fs.readFileSync(tmpFile);
          const ext = path.extname(name).toLowerCase();
          const mime = imageMime(ext)!;
          const dataUrl = `data:${mime};base64,${imgBuffer.toString('base64')}`;

          const ocrStart = Date.now();
          const { text } = await generateText({
            model: this.openaiProvider.chat(this.ocrModel),
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: VISION_OCR_PROMPT },
                  { type: 'image', image: dataUrl },
                ],
              },
            ],
          });

          if (text.trim().length > 0) {
            texts.push(text.trim());
            this.logger.log(
              `Image ${name} Vision OK (${elapsed(ocrStart)}, ${text.trim().length} chars)`,
            );
          }
        } catch (err) {
          this.logger.warn(
            `Image ${name} Vision failed: ${err instanceof Error ? err.message : err}`,
          );
        } finally {
          try {
            fs.unlinkSync(tmpFile);
          } catch {}
        }
      }
    } finally {
      try {
        fs.rmdirSync(tmpDir);
      } catch {}
    }

    return texts;
  }
}
