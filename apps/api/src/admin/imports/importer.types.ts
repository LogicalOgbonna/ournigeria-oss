import type { PrismaService } from "@ournigeria/database";

/** A source attached to a proposal (mirrors ProposalSource columns). */
export interface ProposalSourceInput {
  url: string;
  publisher: string;
  snippet: string;
  format: string; // html | pdf | xlsx | ...
  sourceTier?: "canonical" | "official" | "web";
  confidence?: string; // low | medium | high
  retrievedAt?: string; // ISO; defaults to now
}

/** One change to apply through the enrichment pipeline. */
export interface ProposalSpec {
  targetTable: string;
  changeKind: "fill" | "correction" | "create";
  targetPk?: string; // required for fill/correction
  targetField?: string; // required for fill/correction
  proposedValue: unknown; // a value for fill/correction; the create payload for create
  confidence?: string;
  reasoning?: string;
  sources: ProposalSourceInput[];
  /** Stable human label for the preview ("APC · ideology", "APC · National Chairman"). */
  label: string;
}

export interface ImportDiff {
  creates: ProposalSpec[];
  updates: ProposalSpec[]; // fill/correction specs
  unchangedCount: number;
  /** First ~20 changes, for the preview UI. */
  sample: { kind: "create" | "update"; label: string; detail: string }[];
}

export interface DatasetImporter {
  name: string; // url-safe id, e.g. "party-profiles"
  label: string;
  description: string;
  autoApprove: boolean;
  /** Throw an Error (mapped to 400) if the uploaded JSON is the wrong shape. */
  validate(json: unknown): void;
  /** Compare uploaded rows to live data by natural key; only changed rows become specs. */
  diff(json: unknown, prisma: PrismaService): Promise<ImportDiff>;
}

export interface ImportResult {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  errors: { label: string; error: string }[];
}
