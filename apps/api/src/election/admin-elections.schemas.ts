import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

/**
 * Every admin body is a WHITELIST (plan 68 §6 + D5). `published` and `status`
 * are never body fields — they move only through the verbs; `office`, `year`,
 * `round` and `slug` are the event's identity and never PATCH-able (E1.2).
 */

/** campaigns.election_type vocabulary MINUS 'other' (D10.6) — mirrors chk_elections_office. */
export const ELECTION_OFFICES = [
  "presidential",
  "gubernatorial",
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "lga_chairman",
  "councilor",
] as const;
export type ElectionOffice = (typeof ELECTION_OFFICES)[number];

export const ELECTION_ROUNDS = ["general", "runoff", "supplementary", "rerun", "bye"] as const;
export const ELECTION_STATUSES = ["scheduled", "postponed", "concluded", "cancelled"] as const;
export const DATE_PRECISIONS = ["year", "month", "day"] as const;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (max: number) => z.string().trim().max(max);
/** z.string().url() happily accepts javascript: and data: — pin the scheme. */
const httpUrl = (max: number) => z.string().url().max(max).regex(/^https?:\/\//i, "must be an http(s) URL");
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be a YYYY-MM-DD date");

/**
 * D4 + D10.3 as amended by E1.2/E1.4 — ONE legal encoding per precision:
 * year ⇒ date NULL; month ⇒ date = YYYY-MM-01; day ⇒ full date. Deliberately
 * no year-equality clause: `year` is the cycle key, not the poll calendar
 * year. Shared by the create schema and the service's merged PATCH check so
 * they cannot drift; returns the message WITHOUT the field name.
 */
export function dateEncodingError(precision: string, electionDate: string | null): string | null {
  if (precision === "year") {
    return electionDate ? "a year-precision event must not carry a date" : null;
  }
  if (!electionDate) return `${precision} precision requires electionDate`;
  if (precision === "month" && !/-01$/.test(electionDate)) {
    return "month precision stores the first of the month (YYYY-MM-01)";
  }
  return null;
}

const scopeFields = {
  stateCode: text(30).nullish(),
  constituencyCode: text(80).nullish(),
  lgaCode: text(60).nullish(),
  wardCode: text(100).nullish(),
};

const excludedStatesSchema = z
  .array(text(30).min(1))
  .max(40)
  .refine((s) => new Set(s.map((c) => c.toLowerCase())).size === s.length, { message: "state codes must be unique" });

const provenanceFields = {
  confidence: z.enum(["high", "medium", "low"]).optional(),
  sourceUrl: httpUrl(2_000).nullish(),
};

export const createSchema = z
  .object({
    office: z.enum(ELECTION_OFFICES),
    year: z.number().int().min(1999).max(2100),
    round: z.enum(ELECTION_ROUNDS).default("general"),
    slug: z.string().regex(SLUG_RE).min(2).max(160).optional(),
    label: text(120).nullish(),
    electionDate: dateStr.nullish(),
    datePrecision: z.enum(DATE_PRECISIONS).default("year"),
    ...scopeFields,
    excludedStates: excludedStatesSchema.default([]),
    ...provenanceFields,
  })
  .superRefine((v, ctx) => {
    const err = dateEncodingError(v.datePrecision, v.electionDate ?? null);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["electionDate"], message: err });
  });
export type CreateInput = z.infer<typeof createSchema>;

/**
 * Unknown keys such as `published` and `status` are dropped (zod object
 * default = strip) — the test pins this. The electionDate/datePrecision pair
 * is validated against the MERGED row in the service (a patch may move only
 * one half of the encoding).
 */
export const patchSchema = z.object({
  reason: text(500).min(3).optional(),
  label: text(120).nullish(),
  electionDate: dateStr.nullish(),
  datePrecision: z.enum(DATE_PRECISIONS).optional(),
  ...scopeFields,
  excludedStates: excludedStatesSchema.optional(),
  ...provenanceFields,
});
export type PatchInput = z.infer<typeof patchSchema>;

export const reasonSchema = z.object({ reason: text(500).min(3) });
export const gateSchema = z.object({ enabled: z.boolean() });

export const listQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  office: z.enum(ELECTION_OFFICES).optional(),
  round: z.enum(ELECTION_ROUNDS).optional(),
  status: z.enum(ELECTION_STATUSES).optional(),
  published: z.enum(["true", "false"]).optional(),
  state: text(30).optional(),
  q: text(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export function parseOrThrow<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
    throw new BadRequestException(`${path}${issue.message}`);
  }
  return parsed.data;
}
