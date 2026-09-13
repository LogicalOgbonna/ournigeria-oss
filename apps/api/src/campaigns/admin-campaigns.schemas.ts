import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { CAMPAIGN_ELECTION_TYPES } from "./campaigns.service";

/**
 * Every admin body is a WHITELIST. status, review_*, display_order,
 * source_type and official_election_id are never body fields — they move only
 * through verbs, PUT /order, and the services themselves.
 */

export const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const colour = z.string().regex(HEX_COLOUR, "colour must be #rgb or #rrggbb");
const text = (max: number) => z.string().trim().max(max);
/** z.string().url() happily accepts javascript: and data: — pin the scheme. */
const httpUrl = (max: number) => z.string().url().max(max).regex(/^https?:\/\//i, "must be an http(s) URL");

export const raceKeySchema = z.object({
  electionType: z.enum(CAMPAIGN_ELECTION_TYPES),
  year: z.number().int().min(1999).max(2100),
  stateCode: text(30).nullish(),
  constituencyCode: text(80).nullish(),
  lgaCode: text(60).nullish(),
});
export type RaceKeyInput = z.infer<typeof raceKeySchema>;

export interface RaceKey {
  electionType: string;
  year: number;
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
}

/** Which scope column a race type needs; null = national. */
const SCOPE_COLUMN: Record<string, "stateCode" | "constituencyCode" | "lgaCode" | null> = {
  presidential: null,
  gubernatorial: "stateCode",
  senatorial: "constituencyCode",
  house_of_reps: "constituencyCode",
  state_assembly: "constituencyCode",
  lga_chairman: "lgaCode",
  councilor: "lgaCode",
  other: null,
};

/** Validate the scope arc for a race type and normalise codes to lower case. */
export function raceScopeFor(input: RaceKeyInput): { key: RaceKey } | { error: string } {
  const need = SCOPE_COLUMN[input.electionType];
  const given = (["stateCode", "constituencyCode", "lgaCode"] as const).filter((c) => input[c]);
  if (need === null && given.length > 0) return { error: `${input.electionType} must not carry a scope` };
  if (need !== null && (given.length !== 1 || given[0] !== need)) return { error: `${input.electionType} needs ${need}` };
  return {
    key: {
      electionType: input.electionType,
      year: input.year,
      stateCode: input.stateCode?.toLowerCase() ?? null,
      constituencyCode: input.constituencyCode?.toLowerCase() ?? null,
      lgaCode: input.lgaCode?.toLowerCase() ?? null,
    },
  };
}

export const personSchema = z
  .object({
    officialId: z.string().uuid().nullish(),
    name: text(200).min(2).nullish(),
    imageUrl: httpUrl(500).nullish(),
  })
  .refine((p) => Boolean(p.officialId || p.name), { message: "officialId or name is required" });

const copyFields = {
  candidateShortName: text(60).nullish(),
  candidateBio: text(10_000).nullish(),
  visionLine: text(2_000).nullish(),
  fineprint: text(1_000).nullish(),
  pullQuote: text(1_000).nullish(),
  pullQuoteBg: colour.nullish(),
  brandColor: colour.nullish(),
  factionLabel: text(100).nullish(),
  isDisputed: z.boolean().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  sourceUrl: httpUrl(2_000).nullish(),
};

export const createSchema = raceKeySchema.extend({
  partyAcronym: text(20).min(1),
  slug: z.string().regex(SLUG_RE).min(2).max(160).optional(),
  candidate: personSchema,
  runningMate: personSchema.nullish(),
  ...copyFields,
});
export type CreateInput = z.infer<typeof createSchema>;

/** Unknown keys such as status are dropped (zod object default = strip) — the test pins this. */
export const patchSchema = z.object({
  reason: text(500).min(3).optional(),
  candidateName: text(200).min(2).optional(),
  runningMateName: text(200).min(2).nullish(),
  candidateImageUrl: httpUrl(500).nullish(),
  runningMateImageUrl: httpUrl(500).nullish(),
  ...copyFields,
});
export type PatchInput = z.infer<typeof patchSchema>;

export const slugSchema = z.object({ slug: z.string().regex(SLUG_RE).min(2).max(160), reason: text(500).optional() });
export const reasonSchema = z.object({ reason: text(500).min(3) });
export const noteSchema = z.object({ note: text(2_000).min(3) });
/** DELETE bodies carry nothing but an optional audit reason (and may be absent entirely). */
export const reasonOnlySchema = z.object({ reason: text(500).optional() });

export const orderSchema = raceKeySchema
  .extend({ ids: z.array(z.string().uuid()).min(1).max(500) })
  .refine((o) => new Set(o.ids).size === o.ids.length, { message: "ids must be unique" });
export type OrderInput = z.infer<typeof orderSchema>;

export const listQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  type: z.enum(CAMPAIGN_ELECTION_TYPES).optional(),
  state: text(30).optional(),
  constituency: text(80).optional(),
  lga: text(60).optional(),
  party: text(20).optional(),
  status: z.enum(["draft", "active", "suspended", "withdrawn", "dissolved", "concluded"]).optional(),
  reviewStatus: z.enum(["unreviewed", "reviewed", "disputed"]).optional(),
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

// ---------- council: role catalog + members ----------

export const roleSchema = z.object({
  code: z.string().regex(/^[a-z][a-z0-9_]{1,59}$/),
  label: text(100).min(2),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});
export type RoleInput = z.input<typeof roleSchema>;
export const rolePatchSchema = roleSchema.omit({ code: true }).partial();
export type RolePatch = z.infer<typeof rolePatchSchema>;

/**
 * Base object kept separate from the refine: `.refine()` returns a ZodEffects,
 * which cannot be `.partial()`-ed, and the patch body needs every field
 * optional (a patch that only moves displayOrder must not demand a name).
 */
const memberBaseSchema = z.object({
  roleCode: z.string().max(60),
  officialId: z.string().uuid().nullish(),
  name: text(200).min(2).optional(),
  imageUrl: httpUrl(500).nullish(),
  scopeLevel: z.enum(["national", "state", "lga"]).default("national"),
  stateCode: text(30).nullish(),
  lgaCode: text(60).nullish(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  displayOrder: z.number().int().min(0).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  sourceUrl: httpUrl(2_000).nullish(),
  reason: text(500).optional(),
});

export const memberSchema = memberBaseSchema.refine((m) => Boolean(m.officialId || m.name), {
  message: "officialId or name is required",
});
/** Input side: `scopeLevel` carries a default, so callers may omit it. */
export type MemberInput = z.input<typeof memberSchema>;
export const memberPatchSchema = memberBaseSchema.partial();
export type MemberPatch = z.infer<typeof memberPatchSchema>;

export const endMemberSchema = z.object({
  endReason: z.enum(["resigned", "removed", "reshuffled", "deceased", "campaign_ended"]),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  reason: text(500).min(1),
});
export type EndMemberInput = z.infer<typeof endMemberSchema>;

// ---------------------------------------------------------------------------
// Assets (sub-plan 2): presigned staging uploads, media, documents, purge.
// ---------------------------------------------------------------------------

/** One row per ticket — a second upload REPLACES the row in place. */
export const MEDIA_SLOT_TYPES = ["poster_candidate", "poster_mate", "card_candidate", "card_mate", "quote_photo", "bio_photo", "logo"] as const;
/** Many rows per ticket — each upload appends. */
export const MEDIA_APPEND_TYPES = ["banner", "photo"] as const;
export const MEDIA_TYPES = [...MEDIA_SLOT_TYPES, ...MEDIA_APPEND_TYPES] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const presignSchema = z.object({
  kind: z.enum(["image", "pdf"]),
  contentType: z.string().max(60),
  size: z.number().int().positive(),
});
export type PresignInput = z.infer<typeof presignSchema>;

/**
 * Staging keys are scoped to the ticket they were presigned for:
 * `staging/<campaignId>/<uuid>`. The service re-checks the campaign segment, so
 * a manager cannot commit another ticket's staged bytes onto theirs. Both
 * segments are real UUIDs — `[0-9a-f-]{36}` also matched `------…`.
 */
const UUID_RE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const stagingKey = z
  .string()
  .regex(new RegExp(`^staging/${UUID_RE}/${UUID_RE}$`, "i"), "stagingKey must be a staging/<campaignId>/<uuid> key");

export const mediaCommitSchema = z.object({
  stagingKey,
  type: z.enum(MEDIA_TYPES),
  caption: text(255).nullish(),
  displayOrder: z.number().int().min(0).max(1000).optional(),
  metadata: z.unknown().optional(), // validated per type in the service (posterArtSchema / matePosterArtSchema)
  sourceUrl: httpUrl(2_000).nullish(),
  reason: text(500).optional(),
});
export type MediaCommitInput = z.infer<typeof mediaCommitSchema>;

export const mediaPatchSchema = mediaCommitSchema.omit({ stagingKey: true, type: true }).partial().extend({ reason: text(500).optional() });
export type MediaPatchInput = z.infer<typeof mediaPatchSchema>;

export const documentPutSchema = z.object({
  stagingKey: stagingKey.optional(),
  coverStagingKey: stagingKey.optional(),
  title: text(100).min(1),
  blurb: text(255).nullish(),
  pageCount: z.number().int().min(1).max(5000).nullish(),
  sourceUrl: httpUrl(2_000).nullish(),
  reason: text(500).optional(),
});
export type DocumentPutInput = z.infer<typeof documentPutSchema>;
export const DOCUMENT_KINDS = ["manifesto", "cv", "achievements"] as const;
export const DOCUMENT_SUBJECTS = ["ticket", "candidate", "running_mate"] as const;

export const councilPhotoSchema = z.object({ stagingKey, reason: text(500).optional() });
export type CouncilPhotoInput = z.infer<typeof councilPhotoSchema>;

const objectKey = z
  .string()
  .min(1)
  .max(500)
  .regex(/^[a-z0-9][a-z0-9._\/-]*$/i, "key must be a plain object key")
  .refine((k) => !k.includes("..") && !k.includes("//"), "key must not contain .. or //");
export const purgeSchema = z.object({ keys: z.array(objectKey).min(1).max(100), reason: text(500).min(3) });
export type PurgeInput = z.infer<typeof purgeSchema>;
