import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateText } from "ai";
import { createHash } from "crypto";
import { chatModelSmall } from "../rag/config";
import { cache as cacheManager } from "@ournigeria/cache";

const impactCache = cacheManager.namespace("contextual-impact");

const VALID_ICONS = [
  "school",
  "hospital",
  "home",
  "graduation",
  "droplet",
  "road",
  "zap",
  "heart-pulse",
  "shield",
  "swords",
  "book-open",
  "streetlight",
  "truck",
  "baby",
  "wheat",
  "laptop",
  "stethoscope",
  "building",
  "users",
  "briefcase",
] as const;

const equivalentItemSchema = z.object({
  icon: z.enum(VALID_ICONS),
  label: z.string().describe("Short label, e.g. 'Primary Schools' or 'Teachers (1 yr)'"),
  count: z.number().int().describe("How many units the amount could fund"),
  unitCost: z.number().describe("Cost per unit in Naira"),
  unitLabel: z.string().describe("Formatted unit cost, e.g. '₦20M per school'"),
  contextNote: z
    .string()
    .nullable()
    .transform((v) => v ?? "")
    .describe("Brief contextual note, e.g. 'Ebonyi currently has only 13 general hospitals'. Empty string if not applicable"),
});

const equivalentSchema = z.object({
  title: z
    .string()
    .describe(
      "Card title, e.g. 'What Ebonyi 2026 Education Budget Could Fund' or 'What Kogi Citizens Lost'",
    ),
  subtitle: z
    .string()
    .describe("Subtitle for additional context. Empty string if not needed"),
  items: z
    .array(equivalentItemSchema)
    .describe("Context-relevant impact equivalents, return exactly 6-9 items"),
});

export type ContextualImpactResult = z.infer<typeof equivalentSchema>;

/** Bucket an amount into a range key for cache hit improvement. */
function amountBucket(amount: number): string {
  if (amount >= 1e12) return `${Math.round(amount / 1e11)}e11`;
  if (amount >= 1e9) return `${Math.round(amount / 1e8)}e8`;
  if (amount >= 1e6) return `${Math.round(amount / 1e5)}e5`;
  return `${Math.round(amount / 1e3)}e3`;
}

function buildCacheKey(
  amount: number,
  opts: { sector?: string; state?: string; domain: string },
): string {
  const raw = `${amountBucket(amount)}|${opts.sector ?? ""}|${opts.state ?? ""}|${opts.domain}`;
  return createHash("sha256").update(raw).digest("hex");
}

function formatNairaShort(amount: number): string {
  if (amount >= 1e12) {
    const v = amount / 1e12;
    return `₦${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}T`;
  }
  if (amount >= 1e9) {
    const v = amount / 1e9;
    return `₦${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (amount >= 1e6) {
    const v = amount / 1e6;
    return `₦${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (amount >= 1e3) {
    const v = amount / 1e3;
    return `₦${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return `₦${amount.toLocaleString()}`;
}

function buildImpactPrompt(
  amount: number,
  opts: {
    sector?: string;
    state?: string;
    year?: number;
    domain: string;
    topic?: string;
  },
): string {
  const formatted = formatNairaShort(amount);
  const parts: string[] = [];

  parts.push(
    `You are a Nigerian public finance analyst. Given an amount of ${formatted} (${amount.toLocaleString()} Naira), generate context-relevant real-world impact equivalents.`,
  );

  if (opts.state) {
    parts.push(`State: ${opts.state}`);
  }
  if (opts.sector) {
    parts.push(`Sector: ${opts.sector}`);
  }
  if (opts.year) {
    parts.push(`Year: ${opts.year}`);
  }
  if (opts.topic) {
    parts.push(`Topic: ${opts.topic}`);
  }

  // Domain-specific framing
  if (opts.domain === "corruption") {
    parts.push(
      `\nFRAMING: This amount relates to alleged corruption/looting. Frame the title as "What [State/Nigerian] Citizens Lost" and items as what was denied to communities. If the case has been ongoing for years, mention that in the subtitle.`,
    );
  } else if (opts.domain === "budget") {
    parts.push(
      `\nFRAMING: This is a budget allocation. Frame the title as "What [State] [Year] [Sector] Budget Could Fund" and items as what the money could achieve.`,
    );
  } else if (opts.domain === "govspend") {
    parts.push(
      `\nFRAMING: This relates to government spending/payments. Frame the title around what taxpayer money was spent on vs what it could have funded.`,
    );
  } else if (opts.domain === "faac") {
    parts.push(
      `\nFRAMING: This is a Federal Allocation (FAAC). Frame the title as "What [State]'s [Month/Year] FAAC Allocation Could Fund".`,
    );
  }

  // Sector-specific guidance
  if (opts.sector) {
    parts.push(
      `\nSECTOR RELEVANCE: Since this is about ${opts.sector}, prioritize items directly relevant to ${opts.sector}. At least 5 of the items should be specific to this sector. For example:
- Education → classrooms, teachers, scholarships, textbooks, school desks, computer labs, school buses, student meals, libraries
- Health → hospitals, primary health centers, ambulances, nurses, doctors, hospital beds, lab equipment, vaccines, community health workers
- Infrastructure → roads (per km), bridges, housing units, water treatment plants, electricity connections, drainage systems
- Agriculture → tractors, irrigation systems, grain silos, farm inputs (per hectare), extension workers, processing plants
- Security → police stations, patrol vehicles, officers, surveillance systems, fire stations`,
    );
  }

  // State-specific guidance
  if (opts.state) {
    parts.push(
      `\nSTATE CONTEXT: Consider the specific needs and context of ${opts.state} State. Urban states (Lagos, Abuja/FCT, Rivers) may need mass transit, housing estates, tech hubs. Rural/conflict-affected states (Borno, Yobe, Zamfara) may need security infrastructure, IDP camps, reconstruction. Agricultural states need farming infrastructure.`,
    );
  }

  parts.push(
    `\nRULES:
1. Use realistic current Nigerian cost estimates for each item.
2. Calculate count = floor(${amount} / unitCost). Every count must be >= 1.
3. Format unitLabel as shorthand: "₦20M per school", "₦1.5M/yr salary", etc.
4. Return 6-9 items, sorted by impact (most resonant first).
5. Mix infrastructure AND personnel items (at least 2 of each).
6. Each item's icon must be one of: school, hospital, home, graduation, droplet, road, zap, heart-pulse, shield, swords, book-open, streetlight, truck, baby, wheat, laptop, stethoscope, building, users, briefcase.
7. Do NOT repeat the same category twice. Each item should be distinct.
8. The title should be specific — include state name, year, and sector where available.`,
  );

  return parts.join("\n");
}

// ─── Static fallback (matches existing behavior) ────────────────────────

const STATIC_AMENITIES = [
  { icon: "school" as const, label: "Primary Schools", unitCost: 20_000_000, unitLabel: "₦20M per school" },
  { icon: "hospital" as const, label: "Hospitals", unitCost: 500_000_000, unitLabel: "₦500M per hospital" },
  { icon: "home" as const, label: "Houses", unitCost: 25_000_000, unitLabel: "₦25M per house" },
  { icon: "road" as const, label: "Km of Roads", unitCost: 200_000_000, unitLabel: "₦200M per km" },
  { icon: "droplet" as const, label: "Boreholes", unitCost: 5_000_000, unitLabel: "₦5M per borehole" },
  { icon: "heart-pulse" as const, label: "Health Workers (1 yr)", unitCost: 1_500_000, unitLabel: "₦1.5M annual salary" },
  { icon: "shield" as const, label: "Police Officers (1 yr)", unitCost: 1_000_000, unitLabel: "₦1M annual salary" },
  { icon: "swords" as const, label: "Soldiers (1 yr)", unitCost: 1_200_000, unitLabel: "₦1.2M annual salary" },
  { icon: "book-open" as const, label: "Lecturers (1 yr)", unitCost: 3_000_000, unitLabel: "₦3M annual salary" },
  { icon: "streetlight" as const, label: "Street Lights", unitCost: 350_000, unitLabel: "₦350K per unit" },
  { icon: "graduation" as const, label: "Scholarships", unitCost: 500_000, unitLabel: "₦500K per year" },
  { icon: "zap" as const, label: "Solar Power Systems", unitCost: 15_000_000, unitLabel: "₦15M per system" },
];

export function computeStaticEquivalents(
  amount: number,
  title: string,
): ContextualImpactResult {
  const items = STATIC_AMENITIES.map((a) => ({
    ...a,
    count: Math.floor(amount / a.unitCost),
    contextNote: "",
  }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 9);

  return { title, subtitle: "", items };
}

// ─── Main tool ──────────────────────────────────────────────────────────

export const contextualImpactTool = createTool({
  id: "contextual-impact",
  description:
    "Generate context-aware real-world impact equivalents for a Naira amount. Returns items relevant to the specific sector, state, and topic being discussed. Use this instead of impact-calculator when you know the sector, state, or topic for more relevant comparisons.",
  inputSchema: z.object({
    amount: z
      .number()
      .describe("The amount in Nigerian Naira to calculate real-world equivalents for"),
    sector: z
      .string()
      .optional()
      .describe("Budget sector if applicable, e.g. 'education', 'health', 'infrastructure'"),
    state: z
      .string()
      .optional()
      .describe("Nigerian state for geographic context, e.g. 'Lagos', 'Ebonyi', 'Borno'"),
    year: z.number().optional().describe("Budget year if applicable"),
    domain: z
      .enum(["budget", "corruption", "govspend", "faac"])
      .describe("The domain context for appropriate framing"),
    topic: z
      .string()
      .optional()
      .describe("Brief description of what the amount relates to, e.g. 'Ebonyi education sector allocation'"),
  }),
  outputSchema: equivalentSchema,
  execute: async ({ amount, sector: _sector, state: _state, year: _year, domain, topic: _topic }) => {
    const sector = _sector ?? undefined;
    const state = _state ?? undefined;
    const year = _year ?? undefined;
    const topic = _topic ?? undefined;
    // Build default title for fallback
    const titleParts: string[] = [];
    if (domain === "corruption") {
      titleParts.push("What");
      titleParts.push(state ? `${state} Citizens` : "Nigerians");
      titleParts.push("Lost");
    } else {
      titleParts.push("What");
      if (state) titleParts.push(state);
      if (year) titleParts.push(String(year));
      if (sector) titleParts.push(sector.charAt(0).toUpperCase() + sector.slice(1));
      titleParts.push("Budget Could Fund");
    }
    const fallbackTitle = titleParts.join(" ");

    // Check cache
    const cacheKey = buildCacheKey(amount, { sector, state, domain });
    const cached = await impactCache.get<ContextualImpactResult>(cacheKey);
    if (cached) return cached;

    // Try LLM generation with timeout
    try {
      const prompt = buildImpactPrompt(amount, { sector, state, year, domain, topic });
      const jsonInstruction = `\n\nIMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no explanation, no code fences). The JSON must match this exact schema:
{
  "title": "string - card title",
  "subtitle": "string - subtitle or empty string",
  "items": [
    {
      "icon": "one of: school, hospital, home, graduation, droplet, road, zap, heart-pulse, shield, swords, book-open, streetlight, truck, baby, wheat, laptop, stethoscope, building, users, briefcase",
      "label": "string - short label",
      "count": "integer - how many units",
      "unitCost": "number - cost per unit in Naira",
      "unitLabel": "string - formatted cost e.g. ₦20M per school",
      "contextNote": "string - brief note or empty string"
    }
  ]
}`;
      const { text: rawText } = await generateText({
        model: chatModelSmall,
        prompt: prompt + jsonInstruction,
        abortSignal: AbortSignal.timeout(10_000),
      });

      // Extract JSON from response (handle possible markdown fences)
      let jsonStr = rawText.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();

      const parsed = equivalentSchema.parse(JSON.parse(jsonStr));

      // Validate counts are correct (LLM may hallucinate)
      const validated: ContextualImpactResult = {
        title: parsed.title,
        subtitle: parsed.subtitle,
        items: parsed.items
          .map((item: ContextualImpactResult["items"][number]) => ({
            ...item,
            count: Math.floor(amount / item.unitCost),
          }))
          .filter((item: ContextualImpactResult["items"][number]) => item.count > 0)
          .slice(0, 9),
      };

      // Must have at least 4 items
      if (validated.items.length < 4) {
        const fallback = computeStaticEquivalents(amount, fallbackTitle);
        await impactCache.set(cacheKey, fallback, 30 * 60 * 1000);
        return fallback;
      }

      await impactCache.set(cacheKey, validated, 30 * 60 * 1000);
      return validated;
    } catch {
      // Timeout or LLM error — fall back to static
      const fallback = computeStaticEquivalents(amount, fallbackTitle);
      return fallback;
    }
  },
});
