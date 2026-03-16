import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import { z } from "zod";
import * as crypto from "node:crypto";

/* ────── Zod schemas for structured FAAC extraction ────── */

const revenueSourceSchema = z.object({
  statutory: z.number().describe("Statutory allocation amount, use 0 if not present"),
  good_and_value_consideration: z.number().describe("Good & Value Consideration, use 0 if not present"),
  additional_funds_nnpc: z.number().describe("Additional Funds From NNPC, use 0 if not present"),
  forex_exploitation_fund: z.number().describe("FOREX Exploitation Fund, use 0 if not present"),
  exchange_gain: z.number().describe("Exchange Gain amount, use 0 if not present"),
  vat: z.number().describe("VAT amount, use 0 if not present"),
  other: z.number().describe("Any other revenue sources not listed above, use 0 if not present"),
});

const deductionsSchema = z.object({
  external_debt: z.number().describe("External debt deduction, use 0 if not present"),
  ispo: z.number().describe("ISPO deduction, use 0 if not present"),
  other: z.number().describe("Other deductions, use 0 if not present"),
});

const nationalSummarySchema = z.object({
  fgn_total: z.number().describe("Total allocation to Federal Government"),
  states_total: z.number().describe("Total allocation to all states"),
  lgcs_total: z.number().describe("Total allocation to all local governments"),
  derivation_13_pct: z
    .number()
    .describe("13% derivation fund for oil-producing states, use 0 if not present"),
  grand_total: z.number().describe("Grand total disbursed"),
  revenue_sources: revenueSourceSchema,
});

const stateEntrySchema = z.object({
  name: z
    .string()
    .describe("State name as it appears in the PDF, e.g. ABIA, LAGOS"),
  num_lgcs: z.number().describe("Number of LGAs in the state, use 0 if not present"),
  gross_statutory: z.number().describe("Gross statutory allocation, use 0 if not present"),
  derivation_13_pct: z.number().describe("13% derivation, use 0 if not present"),
  gross_total: z.number().describe("Gross total, use 0 if not present"),
  deductions: deductionsSchema,
  net_statutory: z.number().describe("Net statutory allocation, use 0 if not present"),
  vat: z.number().describe("VAT allocation, use 0 if not present"),
  exchange_gain: z.number().describe("Exchange gain, use 0 if not present"),
  emtl: z.number().describe("EMTL allocation, use 0 if not present"),
  ecology: z.number().describe("Ecology allocation, use 0 if not present"),
  total_gross: z.number().describe("Total gross allocation, use 0 if not present"),
  total_net: z.number().describe("Total net allocation, use 0 if not present"),
});

const lgaEntrySchema = z.object({
  state: z
    .string()
    .describe("State this LGA belongs to, e.g. ABIA, LAGOS"),
  name: z.string().describe("LGA name as it appears in the PDF, e.g. ABA NORTH"),
  gross_statutory: z.number().describe("Gross statutory allocation, use 0 if not present"),
  deduction: z.number().describe("Deduction amount, use 0 if not present"),
  exchange_gain: z.number().describe("Exchange gain, use 0 if not present"),
  vat: z.number().describe("VAT allocation, use 0 if not present"),
  emtl: z.number().describe("EMTL allocation, use 0 if not present"),
  ecology: z.number().describe("Ecology allocation, use 0 if not present"),
  total_allocation: z.number().describe("Total allocation, use 0 if not present"),
});

export const faacExtractionSchema = z.object({
  disbursement_month: z
    .string()
    .describe("The month the disbursement was made, e.g. January, February"),
  disbursement_year: z
    .number()
    .describe("The year the disbursement was made, e.g. 2025"),
  revenue_month: z
    .string()
    .describe(
      "The month the revenue was generated (often different from disbursement), e.g. December. Use empty string if not found.",
    ),
  revenue_year: z
    .number()
    .describe("The year the revenue was generated, e.g. 2024. Use 0 if not found."),
  national_summary: nationalSummarySchema,
  states: z
    .array(stateEntrySchema)
    .describe("Per-state allocation data (37 entries: 36 states + FCT)"),
  lgas: z
    .array(lgaEntrySchema)
    .describe("Per-LGA allocation data (up to 774 LGAs across 36 states + FCT)"),
});

export type FaacExtraction = z.infer<typeof faacExtractionSchema>;

/* ────── Service ────── */

const EXTRACTION_PROMPT = `You are an expert data extractor for Nigerian FAAC (Federation Account Allocation Committee) disbursement PDFs.

Extract ALL structured allocation data from the document text. The document contains:

1. **National Summary** (usually Table I or the first summary table):
   - Total to Federal Government, States, Local Governments, 13% Derivation
   - Revenue sources (statutory, VAT, exchange gain, EMTL, ecology, etc.)

2. **State-level allocations** (usually Table III):
   - For each of the 36 states + FCT: gross statutory, 13% derivation, deductions (external debt, ISPO, others), net statutory, VAT, exchange gain, EMTL, ecology, total
   - Extract ALL 37 rows (36 states + FCT)

3. **LGA-level allocations** (usually Table IV, spanning multiple pages):
   - For each LGA: state, LGA name, gross statutory, deduction, exchange gain, VAT, EMTL, ecology, total
   - There are approximately 774 LGAs. Extract as many as appear in the document.

IMPORTANT:
- Column names/order vary across years. Map them to the schema fields by meaning, not position.
- Numbers are in Naira. Remove commas and parse as numbers.
- If a column is missing or a value is not present, use 0.
- The disbursement month/year is usually in the title. The revenue month is often stated as "Revenue for [month] [year]".
- State names should be in UPPERCASE as they appear (e.g., "ABIA", "AKWA IBOM", "FCT-ABUJA").
- LGA names should be in UPPERCASE as they appear.

Document text:
`;

@Injectable()
export class FaacExtractorService {
  private readonly logger = new Logger(FaacExtractorService.name);
  private cachedModel: LanguageModel | null = null;
  private cachedModelKey = "";

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Decrypt a value encrypted with AES-256-GCM using ADMIN_SESSION_SECRET.
   * Matches the encryption format used by AdminConnectionsService.
   */
  private decrypt(ciphertext: string): string {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
    const key = crypto.createHash("sha256").update(secret).digest();
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Invalid ciphertext format");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  /**
   * Resolve OCR config: check DB system settings first, fall back to env vars.
   */
  private async getOcrConfig(): Promise<{
    baseUrl: string;
    apiKey: string;
    model: string;
  }> {
    try {
      const rows = await this.prisma.systemSetting.findMany({
        where: {
          key: { in: ["ocr.base_url", "ocr.api_key", "ocr.model"] },
        },
      });

      if (rows.length > 0) {
        const get = (key: string) => {
          const row = rows.find((r) => r.key === key);
          if (!row) return "";
          if (row.encrypted) {
            try {
              return this.decrypt(row.value);
            } catch {
              return row.value;
            }
          }
          return row.value;
        };

        const baseUrl = get("ocr.base_url");
        const apiKey = get("ocr.api_key");
        const model = get("ocr.model");

        if (baseUrl && apiKey && model) {
          return { baseUrl, apiKey, model };
        }
      }
    } catch (err) {
      this.logger.warn("Failed to read OCR settings from DB, falling back to env vars", err);
    }

    // Fall back to env vars
    return {
      baseUrl: this.config.getOrThrow<string>("OCR_BASE_URL"),
      apiKey: this.config.getOrThrow<string>("OCR_API_KEY"),
      model: this.config.getOrThrow<string>("OCR_MODEL"),
    };
  }

  /**
   * Build or reuse the LLM model. Rebuilds if config has changed.
   */
  private async getModel(): Promise<LanguageModel> {
    const ocrConfig = await this.getOcrConfig();
    const cacheKey = `${ocrConfig.baseUrl}|${ocrConfig.model}`;

    if (this.cachedModel && this.cachedModelKey === cacheKey) {
      return this.cachedModel;
    }

    this.logger.log(`Building OCR model: ${ocrConfig.model} @ ${ocrConfig.baseUrl}`);

    const timeoutMs = 5 * 60 * 1000;
    const fetchWithTimeout: typeof globalThis.fetch = (input, init) =>
      globalThis.fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

    const provider = createOpenAI({
      baseURL: ocrConfig.baseUrl,
      apiKey: ocrConfig.apiKey,
      fetch: fetchWithTimeout,
    });

    this.cachedModel = provider.chat(ocrConfig.model);
    this.cachedModelKey = cacheKey;
    return this.cachedModel;
  }

  async extract(rawText: string, year: number, month: string): Promise<FaacExtraction> {
    this.logger.log(
      `Extracting FAAC data for ${month} ${year} (${rawText.length} chars)`,
    );

    const model = await this.getModel();

    // Truncate to ~100k chars to avoid token limits
    const truncatedText = rawText.substring(0, 100_000);

    const prompt = `${EXTRACTION_PROMPT}${truncatedText}\n\nThis document is the FAAC disbursement for ${month} ${year}. Extract all data according to the schema.`;

    const res = await (generateObject as any)({
      model,
      schema: faacExtractionSchema,
      prompt,
    });

    const extraction = res.object as FaacExtraction;

    // Sanity check: log counts
    this.logger.log(
      `Extracted: ${extraction.states.length} states, ${extraction.lgas.length} LGAs, ` +
      `grand total: ₦${extraction.national_summary.grand_total.toLocaleString()}`,
    );

    return extraction;
  }
}
