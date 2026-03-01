import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import { z } from "zod";

@Injectable()
export class BudgetSummarizerService {
  private readonly logger = new Logger(BudgetSummarizerService.name);
  private readonly model: LanguageModel;

  constructor(private readonly config: ConfigService) {
    // We can reuse the OCR configuration as it is typically a fast, cheap model (like gpt-4o-mini)
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

  async extractTotals(rawText: string) {
    this.logger.log(`Extracting totals from text (${rawText.length} chars)`);

    // Truncate text to avoid exceeding token limits (approx 100k chars ~ 25k tokens)
    const truncatedText = rawText.substring(0, 100000);

    const schema = z.object({
      sectors: z.array(
        z.object({
          sectorName: z
            .string()
            .describe(
              "The name of the sector (e.g., Health, Education, Infrastructure)",
            ),
          totalCapitalExpenditure: z
            .union([z.number(), z.null()])
            .describe(
              "Total capital expenditure for this sector in Naira. Return null if not found.",
            ),
          totalRecurrentExpenditure: z
            .union([z.number(), z.null()])
            .describe(
              "Total recurrent expenditure for this sector in Naira. Return null if not found.",
            ),
          grandTotal: z
            .number()
            .describe(
              "The grand total approved budget for this sector in Naira",
            ),
        }),
      ),
      overallStateBudget: z
        .number()
        .describe(
          "The total aggregate budget for the entire state/document across all sectors",
        ),
    });

    // Cast generateObject to any to bypass TS2589 (Type instantiation is excessively deep)
    // which occurs with complex Zod schemas and LanguageModel types in some TS versions.
    const res = await (generateObject as any)({
      model: this.model,
      schema,
      prompt: `Extract the total approved budget figures for each sector from the following budget document text. Return the numeric values in Naira. Only include sectors that are explicitly mentioned with totals. If a total is not found for a sector, omit it.

Document:
${truncatedText}`,
    });

    return res.object as z.infer<typeof schema>;
  }
}
