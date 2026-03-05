import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import { z } from "zod";

/* ────── Zod schemas for structured FAAC extraction ────── */

const revenueSourceSchema = z.record(z.string(), z.number()).describe(
  "Revenue sources and their amounts, e.g. { statutory: 123456, vat: 789012, exchange_gain: 345678, emtl: 12345 }",
);

const deductionsSchema = z.object({
  external_debt: z.number().default(0),
  ispo: z.number().default(0),
  other: z.number().default(0),
});

const nationalSummarySchema = z.object({
  fgn_total: z.number().describe("Total allocation to Federal Government"),
  states_total: z.number().describe("Total allocation to all states"),
  lgcs_total: z.number().describe("Total allocation to all local governments"),
  derivation_13_pct: z
    .number()
    .default(0)
    .describe("13% derivation fund for oil-producing states"),
  grand_total: z.number().describe("Grand total disbursed"),
  revenue_sources: revenueSourceSchema,
});

const stateEntrySchema = z.object({
  name: z
    .string()
    .describe("State name as it appears in the PDF, e.g. ABIA, LAGOS"),
  num_lgcs: z.number().default(0).describe("Number of LGAs in the state"),
  gross_statutory: z.number().default(0),
  derivation_13_pct: z.number().default(0),
  gross_total: z.number().default(0),
  deductions: deductionsSchema.default({
    external_debt: 0,
    ispo: 0,
    other: 0,
  }),
  net_statutory: z.number().default(0),
  vat: z.number().default(0),
  exchange_gain: z.number().default(0),
  emtl: z.number().default(0),
  ecology: z.number().default(0),
  total_gross: z.number().default(0),
  total_net: z.number().default(0),
});

const lgaEntrySchema = z.object({
  state: z
    .string()
    .describe("State this LGA belongs to, e.g. ABIA, LAGOS"),
  name: z.string().describe("LGA name as it appears in the PDF, e.g. ABA NORTH"),
  gross_statutory: z.number().default(0),
  deduction: z.number().default(0),
  exchange_gain: z.number().default(0),
  vat: z.number().default(0),
  emtl: z.number().default(0),
  ecology: z.number().default(0),
  total_allocation: z.number().default(0),
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
    .default("")
    .describe(
      "The month the revenue was generated (often different from disbursement), e.g. December",
    ),
  revenue_year: z
    .number()
    .default(0)
    .describe("The year the revenue was generated, e.g. 2024"),
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
  private readonly model: LanguageModel;

  constructor(private readonly config: ConfigService) {
    const llmModel = this.config.getOrThrow<string>("OCR_MODEL");

    const timeoutMs = 5 * 60 * 1000;
    const fetchWithTimeout: typeof globalThis.fetch = (input, init) =>
      globalThis.fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

    const openaiProvider = createOpenAI({
      baseURL: this.config.getOrThrow<string>("OCR_BASE_URL"),
      apiKey: this.config.getOrThrow<string>("OCR_API_KEY"),
      fetch: fetchWithTimeout,
    });

    this.model = openaiProvider.chat(llmModel);
  }

  async extract(rawText: string, year: number, month: string): Promise<FaacExtraction> {
    this.logger.log(
      `Extracting FAAC data for ${month} ${year} (${rawText.length} chars)`,
    );

    // Truncate to ~100k chars to avoid token limits
    const truncatedText = rawText.substring(0, 100_000);

    const prompt = `${EXTRACTION_PROMPT}${truncatedText}\n\nThis document is the FAAC disbursement for ${month} ${year}. Extract all data according to the schema.`;

    // Cast needed: Zod schema type recursion exceeds TS depth limit with generateObject's generics
    const res = await (generateObject as any)({
      model: this.model,
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
