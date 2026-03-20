/**
 * Content Recipe Type System
 *
 * Recipes are declarative configs that define:
 * 1. What data to fetch (dataSources array)
 * 2. What prompt template to use (promptBuilder function)
 * 3. What output formats to generate (formats array)
 * 4. What parameters are required/optional
 *
 * ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
 * │   Recipe     │────▶│   Engine     │────▶│   Formats    │
 * │  (config)    │     │  (executor)  │     │  (adapters)  │
 * └─────────────┘     └──────────────┘     └──────────────┘
 *       │                    │                     │
 *       ▼                    ▼                     ▼
 *  dataSources          fetch + LLM           twitter/
 *  promptBuilder        transform             instagram/
 *  formats                                    video/
 *  requiredParams                             whatsapp
 */

// ─── Data Source Types ──────────────────────────────────────────

export type DataDomain = "budget" | "corruption" | "faac" | "govspend";

export interface DbDataSource {
  type: "db";
  domain: DataDomain;
}

export interface FilesystemDataSource {
  type: "filesystem";
  domain: DataDomain;
  /** Glob pattern relative to packages/source/, e.g. "corruption/{official}/" */
  pathPattern: string;
  /** Which .md file sections to read (e.g. ["overview", "charges", "case_outcome"]) */
  sections?: string[];
}

export type DataSourceConfig = DbDataSource | FilesystemDataSource;

// ─── Format Types ───────────────────────────────────────────────

export type FormatType = "twitter-thread" | "instagram-carousel" | "video-script" | "whatsapp";

// ─── Recipe Parameters ──────────────────────────────────────────

export interface RecipeParams {
  state?: string;
  state2?: string;
  year?: number;
  official?: string;
  sector?: string;
  metric?: string;
}

// ─── Prompt Builder ─────────────────────────────────────────────

export interface PromptResult {
  system: string;
  user: string;
}

export type PromptBuilder = (
  data: Record<string, unknown>,
  params: RecipeParams,
) => PromptResult;

// ─── Recipe Definition ──────────────────────────────────────────

export interface Recipe {
  /** Unique recipe identifier, e.g. "budget-expose" */
  id: string;

  /** Human-readable name */
  name: string;

  /** Short description of what this recipe produces */
  description: string;

  /** Data sources to fetch — engine processes in order and merges results */
  dataSources: DataSourceConfig[];

  /** Output format adapters to run */
  formats: FormatType[];

  /** Build the LLM prompt from assembled data */
  promptBuilder: PromptBuilder;

  /** Parameters that must be provided */
  requiredParams: (keyof RecipeParams)[];

  /** Parameters that may be provided */
  optionalParams: (keyof RecipeParams)[];
}

// ─── Engine Output ──────────────────────────────────────────────

export interface ContentPiece {
  recipeId: string;
  params: RecipeParams;
  generatedAt: string;
  /** Raw LLM output before formatting */
  rawContent: string;
  /** Formatted outputs keyed by format type */
  formatted: Partial<Record<FormatType, FormattedOutput>>;
}

export interface FormattedOutput {
  type: FormatType;
  /** For twitter: array of tweet strings. For others: single string or JSON */
  content: string | string[];
  /** For image formats: paths to generated images */
  imagePaths?: string[];
  /** Warnings (e.g., oversized tweets) */
  warnings?: string[];
}

// ─── Content Index ──────────────────────────────────────────────

export interface ContentIndexEntry {
  id: string;
  recipeId: string;
  params: RecipeParams;
  generatedAt: string;
  outputFiles: string[];
  status: "draft" | "approved" | "posted" | "skipped";
  /** Optional engagement data (populated after posting) */
  engagement?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
  };
}

export interface ContentIndex {
  version: 1;
  entries: ContentIndexEntry[];
}

// ─── Calendar ───────────────────────────────────────────────────

export interface CalendarDay {
  date: string;
  slots: CalendarSlot[];
}

export interface CalendarSlot {
  recipeId: string;
  params: RecipeParams;
  /** Which index entry this corresponds to */
  indexEntryId: string;
}

export interface ContentCalendar {
  generatedAt: string;
  startDate: string;
  endDate: string;
  days: CalendarDay[];
}
