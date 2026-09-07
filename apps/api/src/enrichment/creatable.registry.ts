import { BadRequestException } from "@nestjs/common";
import { ensureTicketElections, slugifyName } from "@ournigeria/database";
import type { AnchorConfidence, Prisma } from "@ournigeria/database";
import { resolveStateSlug } from "./state-codes";
import {
  coerceEnum,
  CORRUPTION_CASE_TYPE,
  CORRUPTION_STATUS,
  LEGAL_CASE_TYPE,
  LEGAL_STATUS,
} from "./enum-coerce";

/**
 * Creatable-entity registry (Plan 45c, Fix #1) — the create-side parallel of
 * APPLIABLE_FIELDS. applyCreate() dispatches here by proposal.targetTable;
 * each entry validates its payload, preflights FKs/duplicates, and inserts
 * via raw SQL (the surrounding tx runs as SET LOCAL ROLE enrichment_apply).
 *
 * The generic biographical tables share one column-map-driven implementation;
 * councilors keep their bespoke two-row insert (official + position) and
 * migrate in as the first registry entry.
 */

/** Minimal tx surface used by entries ($queryRawUnsafe/$executeRawUnsafe). */
export interface RawTx {
  $queryRawUnsafe<T = unknown>(sql: string, ...params: unknown[]): Promise<T>;
  $executeRawUnsafe(sql: string, ...params: unknown[]): Promise<number>;
}

export interface CreateResult {
  /** Created fact row id — evidence rows copy onto this. */
  id: string;
  /** Set when the create affects an official's completeness. */
  officialId?: string;
}

export interface CreatableEntity {
  targetTable: string;
  /**
   * evidence.entry_type used when copying proposal_sources → evidence.
   * `null` skips the evidence copy entirely — used for non-uuid-keyed entities
   * (e.g. political_parties, keyed by varchar `acronym`) whose `id` cannot be
   * cast into the uuid `evidence.entry_id` column.
   */
  evidenceEntryType: string | null;
  /** Throws BadRequestException on a malformed payload. */
  validate(payload: unknown): Record<string, unknown>;
  /** FK existence / duplicate checks inside the tx (clean 400s, not raw FK 500s). */
  preflight?(tx: RawTx, payload: Record<string, unknown>): Promise<void>;
  insert(
    tx: RawTx,
    payload: Record<string, unknown>,
    /** sourceType defaults to 'agent'; the citizen apply path (Plan 55) passes 'citizen'. */
    ctx: { adminId: string; confidence: string; sourceType?: string },
  ): Promise<CreateResult>;
}

type ColType = "string" | "int" | "number" | "boolean" | "date" | "uuid";

interface ColumnSpec {
  /** payload key (camelCase) */
  key: string;
  /** SQL column */
  column: string;
  type: ColType;
  required?: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function coerce(spec: ColumnSpec, value: unknown): unknown {
  if (value === undefined || value === null) {
    if (spec.required) throw new BadRequestException(`missing required field: ${spec.key}`);
    return null;
  }
  switch (spec.type) {
    case "string":
      if (typeof value !== "string" || value.length === 0) {
        throw new BadRequestException(`field ${spec.key} must be a non-empty string`);
      }
      return value;
    case "int":
      if (!Number.isInteger(value)) throw new BadRequestException(`field ${spec.key} must be an integer`);
      return value;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new BadRequestException(`field ${spec.key} must be a number`);
      }
      return value;
    case "boolean":
      if (typeof value !== "boolean") throw new BadRequestException(`field ${spec.key} must be a boolean`);
      return value;
    case "date":
      if (typeof value !== "string" || !DATE_RE.test(value)) {
        throw new BadRequestException(`field ${spec.key} must be yyyy-mm-dd`);
      }
      return value;
    case "uuid":
      if (typeof value !== "string" || !UUID_RE.test(value)) {
        throw new BadRequestException(`field ${spec.key} must be a uuid`);
      }
      return value;
  }
}

/**
 * Generic official-scoped fact table entry. Payload shape:
 * { officialId: uuid, ...columns }. Provenance columns (confidence,
 * source_type='agent', review_status='reviewed', reviewed_by, last_verified_at)
 * are stamped by the insert, not taken from the payload.
 */
function officialFactEntity(
  targetTable: string,
  evidenceEntryType: string,
  columns: ColumnSpec[],
  preflight?: (tx: RawTx, payload: Record<string, unknown>) => Promise<void>,
): CreatableEntity {
  return {
    targetTable,
    evidenceEntryType,
    validate(raw: unknown): Record<string, unknown> {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const payload = raw as Record<string, unknown>;
      const out: Record<string, unknown> = {
        officialId: coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, payload.officialId),
      };
      for (const spec of columns) out[spec.key] = coerce(spec, payload[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      const exists = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
        payload.officialId,
      );
      if (exists.length === 0) {
        throw new BadRequestException(`official ${payload.officialId} does not exist`);
      }
      if (preflight) await preflight(tx, payload);
    },
    async insert(tx, payload, ctx) {
      const cols = ["official_id"];
      const values: unknown[] = [payload.officialId];
      const casts: string[] = ["::uuid"];
      for (const spec of columns) {
        const v = payload[spec.key];
        if (v === null) continue; // let column defaults apply
        cols.push(spec.column);
        values.push(v);
        casts.push(spec.type === "date" ? "::date" : spec.type === "uuid" ? "::uuid" : "");
      }
      cols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      values.push(ctx.confidence, ctx.sourceType ?? "agent", "reviewed", ctx.adminId);
      casts.push("", "", "", "");
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()");

      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO ${targetTable} (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")}) RETURNING id`,
        ...values,
      );
      return { id: rows[0].id, officialId: payload.officialId as string };
    },
  };
}

/**
 * Resolve the agent-supplied party to a canonical `political_parties.acronym`,
 * softening to null when unknown (mirrors the councilor behavior: never reject).
 *
 * `party_acronym` is an FK, and `political_parties.acronym` is mixed-case
 * (`Accord`, not `ACCORD`), so a raw exact match drops a mis-cased acronym or a
 * full party name to null (lost data) — or, if kept, would trip the FK. Match in
 * priority order — exact acronym → case-insensitive acronym → full name — and
 * rewrite `partyAcronym` to the canonical acronym so the insert's FK resolves.
 */
export async function softenUnknownParty(tx: RawTx, payload: Record<string, unknown>): Promise<void> {
  if (!payload.partyAcronym) return;
  const raw = String(payload.partyAcronym).trim();
  const rows = await tx.$queryRawUnsafe<{ acronym: string }[]>(
    `SELECT acronym FROM political_parties
     WHERE acronym = $1 OR upper(acronym) = upper($1) OR lower(name) = lower($1)
     ORDER BY (acronym = $1) DESC, (upper(acronym) = upper($1)) DESC
     LIMIT 1`,
    raw,
  );
  payload.partyAcronym = rows[0]?.acronym ?? null;
}

/**
 * Normalize/soften geo foreign keys before insert so an agent-supplied value the
 * agent got wrong can never trip an FK (all four target `nigerian_*` tables with
 * `ON DELETE SET NULL`, so NULL is a valid, human-reviewable fallback).
 *
 * - `stateCode`: resolved to a canonical `nigerian_states.code` slug (the agent
 *   emits ISO-style two-letter codes; the column is a slug) — softened to NULL
 *   when unresolvable. See [[state-codes]].
 * - `lgaCode` / `wardCode` / `constituencyCode`: softened to NULL if absent from
 *   their reference table (mirrors softenUnknownParty).
 */
async function normalizeGeoRefs(tx: RawTx, payload: Record<string, unknown>): Promise<void> {
  if ("stateCode" in payload) {
    payload.stateCode = resolveStateSlug(payload.stateCode);
  }
  const refs: Array<[key: string, table: string]> = [
    ["lgaCode", "nigerian_lgas"],
    ["wardCode", "nigerian_wards"],
    ["constituencyCode", "nigerian_constituencies"],
  ];
  for (const [key, table] of refs) {
    if (!payload[key]) continue;
    const rows = await tx.$queryRawUnsafe<unknown[]>(
      `SELECT 1 FROM ${table} WHERE code = $1`,
      payload[key],
    );
    if (rows.length === 0) payload[key] = null;
  }
}

/**
 * Corruption involvement (compound): one corruption_cases row + one
 * corruption_case_parties row linking the official as an 'official' subject.
 * Payload: officialId, subjectName, title, caseType, status, role (+ optional
 * summary/forum/amountInvolved/currency/openedDate/chargeDate/verdictDate/outcome/
 * sentence/partyType). Slug is generated server-side (unique).
 */
function corruptionInvolvementEntity(): CreatableEntity {
  const CASE_OPTIONAL: ColumnSpec[] = [
    { key: "summary", column: "summary", type: "string" },
    { key: "forum", column: "forum", type: "string" },
    { key: "amountInvolved", column: "amount_involved", type: "number" },
    { key: "amountRecovered", column: "amount_recovered", type: "number" },
    { key: "currency", column: "currency", type: "string" },
    { key: "stateCode", column: "state_code", type: "string" },
    { key: "sector", column: "sector", type: "string" },
    { key: "openedDate", column: "opened_date", type: "date" },
    { key: "chargeDate", column: "charge_date", type: "date" },
    { key: "verdictDate", column: "verdict_date", type: "date" },
    { key: "outcome", column: "outcome", type: "string" },
    { key: "sentence", column: "sentence", type: "string" },
  ];
  return {
    targetTable: "corruption_cases",
    evidenceEntryType: "corruption_case",
    validate(raw: unknown): Record<string, unknown> {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw as Record<string, unknown>;
      const out: Record<string, unknown> = {
        officialId: coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, p.officialId),
        subjectName: coerce({ key: "subjectName", column: "subject_name", type: "string", required: true }, p.subjectName),
        title: coerce({ key: "title", column: "title", type: "string", required: true }, p.title),
        caseType: coerce({ key: "caseType", column: "case_type", type: "string", required: true }, p.caseType),
        status: coerce({ key: "status", column: "status", type: "string", required: true }, p.status),
        role: coerce({ key: "role", column: "role", type: "string", required: true }, p.role),
        partyType: coerce({ key: "partyType", column: "party_type", type: "string" }, p.partyType) ?? "person",
      };
      for (const spec of CASE_OPTIONAL) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      await normalizeGeoRefs(tx, payload);
      payload.caseType = coerceEnum(payload.caseType, CORRUPTION_CASE_TYPE);
      payload.status = coerceEnum(payload.status, CORRUPTION_STATUS);
      const exists = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
        payload.officialId,
      );
      if (exists.length === 0) {
        throw new BadRequestException(`official ${payload.officialId} does not exist`);
      }
    },
    async insert(tx, payload, ctx) {
      // Unique slug: {subject}-{title}, suffixed on collision.
      const base = slugifyName(`${payload.subjectName} ${payload.title}`).slice(0, 140) || "corruption-case";
      const clash = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM corruption_cases WHERE slug = $1`, base);
      const slug = clash.length > 0
        ? `${base}-${Math.abs(hashStr(String(payload.title) + String(payload.officialId))).toString(36).slice(0, 6)}`
        : base;

      const caseCols = ["slug", "title", "case_type", "status"];
      const caseVals: unknown[] = [slug, payload.title, payload.caseType, payload.status];
      const caseCasts: string[] = ["", "", "", ""];
      for (const spec of CASE_OPTIONAL) {
        const v = payload[spec.key];
        if (v === null) continue;
        caseCols.push(spec.column);
        caseVals.push(v);
        caseCasts.push(spec.type === "date" ? "::date" : "");
      }
      caseCols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      caseVals.push(ctx.confidence, "agent", "reviewed", ctx.adminId);
      caseCasts.push("", "", "", "");
      const casePlaceholders = caseVals.map((_, i) => `$${i + 1}${caseCasts[i] ?? ""}`);
      casePlaceholders.push("now()");

      const caseRows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO corruption_cases (${caseCols.map((c) => `"${c}"`).join(", ")})
         VALUES (${casePlaceholders.join(", ")}) RETURNING id`,
        ...caseVals,
      );
      const caseId = caseRows[0].id;

      await tx.$executeRawUnsafe(
        `INSERT INTO corruption_case_parties
           (case_id, subject_type, subject_id, subject_name, party_type, role,
            outcome, confidence, source_type, review_status, reviewed_by, last_verified_at)
         VALUES ($1::uuid, 'official', $2::uuid, $3, $4, $5, $6, $7, 'agent', 'reviewed', $8, now())`,
        caseId,
        payload.officialId,
        payload.subjectName,
        payload.partyType,
        payload.role,
        payload.outcome ?? null,
        ctx.confidence,
        ctx.adminId,
      );

      // Evidence attaches to the case row; officialId returned so the apply
      // service logs/recomputes (recompute is a no-op for corruption but safe).
      return { id: caseId, officialId: payload.officialId as string };
    },
  };
}

/** Known party-officer roles (singular per party). */
const PARTY_OFFICER_ROLES = new Set(["national_chairman", "national_secretary", "party_leader"]);
const PARTY_OFFICER_ORDER: Record<string, number> = {
  national_chairman: 0,
  national_secretary: 1,
  party_leader: 2,
};

/**
 * Party officer (chairman / secretary / party leader). Party-scoped (not
 * official-scoped), so it does not use officialFactEntity. Payload:
 * { partyAcronym, role, name, imageUrl?, sourceUrl? }.
 */
function partyOfficerEntity(): CreatableEntity {
  return {
    targetTable: "party_officers",
    evidenceEntryType: "party_officer",
    validate(raw: unknown): Record<string, unknown> {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw as Record<string, unknown>;
      const role = coerce({ key: "role", column: "role", type: "string", required: true }, p.role) as string;
      if (!PARTY_OFFICER_ROLES.has(role)) {
        throw new BadRequestException(`unknown party officer role: ${role}`);
      }
      return {
        partyAcronym: coerce({ key: "partyAcronym", column: "party_acronym", type: "string", required: true }, p.partyAcronym),
        role,
        name: coerce({ key: "name", column: "name", type: "string", required: true }, p.name),
        imageUrl: coerce({ key: "imageUrl", column: "image_url", type: "string" }, p.imageUrl),
        bio: coerce({ key: "bio", column: "biography", type: "string" }, p.bio),
        gender: coerce({ key: "gender", column: "gender", type: "string" }, p.gender),
        dateOfBirth: coerce({ key: "dateOfBirth", column: "date_of_birth", type: "date" }, p.dateOfBirth),
        twitterHandle: coerce({ key: "twitterHandle", column: "twitter_handle", type: "string" }, p.twitterHandle),
        facebookUrl: coerce({ key: "facebookUrl", column: "facebook_url", type: "string" }, p.facebookUrl),
        sourceUrl: coerce({ key: "sourceUrl", column: "source_url", type: "string" }, p.sourceUrl),
      };
    },
    async preflight(tx, payload) {
      const party = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.partyAcronym,
      );
      if (party.length === 0) {
        throw new BadRequestException(`party ${payload.partyAcronym} does not exist`);
      }
      const dup = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM party_officers WHERE party_acronym = $1 AND role = $2`,
        payload.partyAcronym,
        payload.role,
      );
      if (dup.length > 0) {
        throw new BadRequestException(`${payload.partyAcronym} already has a ${payload.role}`);
      }
    },
    async insert(tx, payload, ctx) {
      // Find-or-create the linked official, then link party_officers.official_id.
      // chk_official_type has no 'party_officer' value; officer-only people are
      // created untyped (null), matching the seed-party-officers.ts precedent.
      // Matched governors/senators keep their existing type (find branch).
      const officialId = await findOrCreateOfficial(tx, {
        name: payload.name as string,
        imageUrl: payload.imageUrl as string | null,
        biography: payload.bio as string | null,
        gender: payload.gender as string | null,
        dateOfBirth: payload.dateOfBirth as string | null,
        twitterHandle: payload.twitterHandle as string | null,
        facebookUrl: payload.facebookUrl as string | null,
        officialType: null,
      });

      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO party_officers
           (party_acronym, role, name, image_url, official_id, source_url, display_order,
            confidence, source_type, review_status, last_verified_at)
         VALUES ($1, $2, $3, $4, $5::uuid, $6, $7, $8, 'agent', 'reviewed', now())
         RETURNING id`,
        payload.partyAcronym,
        payload.role,
        payload.name,
        payload.imageUrl ?? null,
        officialId,
        payload.sourceUrl ?? null,
        PARTY_OFFICER_ORDER[payload.role as string] ?? 0,
        ctx.confidence,
      );
      return { id: rows[0].id, officialId };
    },
  };
}

/** Per-process cache: do official_legal_cases.role/record_kind columns exist yet? */
let legalCaseNewColsPresent: boolean | null = null;

/** official_elections columns (same set the generic officialFactEntity used). */
const ELECTION_COLUMNS: ColumnSpec[] = [
  { key: "electionType", column: "election_type", type: "string", required: true },
  { key: "isPrimary", column: "is_primary", type: "boolean" },
  { key: "year", column: "year", type: "int", required: true },
  { key: "electionDate", column: "election_date", type: "date" },
  { key: "partyAcronym", column: "party_acronym", type: "string" },
  { key: "stateCode", column: "state_code", type: "string" },
  { key: "constituencyCode", column: "constituency_code", type: "string" },
  { key: "lgaCode", column: "lga_code", type: "string" },
  { key: "wardCode", column: "ward_code", type: "string" },
  { key: "result", column: "result", type: "string", required: true },
  { key: "votes", column: "votes", type: "int" },
  { key: "votePercentage", column: "vote_percentage", type: "number" },
  { key: "winnerName", column: "winner_name", type: "string" },
  { key: "resultedInPositionId", column: "resulted_in_position_id", type: "uuid" },
  { key: "notes", column: "notes", type: "string" },
];

/**
 * official_elections create. Accepts EITHER `officialId` (agent path — find the
 * official) OR `officialName` (curated import path — find-or-create the official),
 * exactly one required. `imageUrl`/`bio` are optional and used only when creating
 * a new official. All other columns match the prior officialFactEntity registration,
 * and the insert stamps the same audit columns (confidence, source_type='agent',
 * review_status='reviewed', reviewed_by, last_verified_at) — so the officialId
 * branch is byte-for-byte identical to the old behavior.
 */
function electionEntity(): CreatableEntity {
  return {
    targetTable: "official_elections",
    evidenceEntryType: "election",
    validate(raw: unknown): Record<string, unknown> {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw as Record<string, unknown>;
      const hasId = p.officialId !== undefined && p.officialId !== null;
      const hasName = p.officialName !== undefined && p.officialName !== null;
      if (hasId === hasName) {
        throw new BadRequestException("exactly one of officialId or officialName is required");
      }
      const out: Record<string, unknown> = {
        officialId: hasId
          ? coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, p.officialId)
          : null,
        officialName: hasName
          ? coerce({ key: "officialName", column: "name", type: "string", required: true }, p.officialName)
          : null,
        // Optional deterministic slug for the CREATE path (plan 60 F1): bare-name
        // find-or-create collapses same-name different-seat people; a caller-supplied
        // slug keys the person on the unique slug column instead. Ignored with officialId.
        officialSlugHint: coerce({ key: "officialSlugHint", column: "slug", type: "string" }, p.officialSlugHint),
        imageUrl: coerce({ key: "imageUrl", column: "image_url", type: "string" }, p.imageUrl),
        bio: coerce({ key: "bio", column: "biography", type: "string" }, p.bio),
      };
      for (const spec of ELECTION_COLUMNS) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      await softenUnknownParty(tx, payload);
      await normalizeGeoRefs(tx, payload);
      if (payload.officialId) {
        const exists = await tx.$queryRawUnsafe<unknown[]>(
          `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
          payload.officialId,
        );
        if (exists.length === 0) {
          throw new BadRequestException(`official ${payload.officialId} does not exist`);
        }
      }
    },
    async insert(tx, payload, ctx) {
      const officialId =
        (payload.officialId as string | null) ??
        (await findOrCreateOfficial(tx, {
          name: payload.officialName as string,
          imageUrl: (payload.imageUrl as string | null) ?? null,
          biography: (payload.bio as string | null) ?? null,
          gender: null,
          dateOfBirth: null,
          twitterHandle: null,
          facebookUrl: null,
          // A primary CANDIDATE is not an office-holder (plan 60 §4.3): created
          // untyped (null, the party-officer precedent) so office-holder read
          // filters exclude them. Non-primary paths keep the legacy 'elected'.
          officialType: payload.isPrimary === true ? null : "elected",
          slug: (payload.officialSlugHint as string | null) ?? undefined,
        }));

      const cols = ["official_id"];
      const values: unknown[] = [officialId];
      const casts: string[] = ["::uuid"];
      for (const spec of ELECTION_COLUMNS) {
        const v = payload[spec.key];
        if (v === null || v === undefined) continue; // let column defaults apply
        cols.push(spec.column);
        values.push(v);
        casts.push(spec.type === "date" ? "::date" : spec.type === "uuid" ? "::uuid" : "");
      }
      cols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      values.push(ctx.confidence, ctx.sourceType ?? "agent", "reviewed", ctx.adminId);
      casts.push("", "", "", "");
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()");

      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO official_elections (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")}) RETURNING id`,
        ...values,
      );

      // For primary winners, create a contested position so their profile
      // page reflects the office they're running for.
      // Only gubernatorial can be created here — senator/rep need constituency_code
      // which the import-level data doesn't carry, and there's no president role.
      if (payload.isPrimary && payload.electionType === "gubernatorial" && payload.stateCode) {
        const stateCode = payload.stateCode as string;
        const alreadyExists = await tx.$queryRawUnsafe<unknown[]>(
          `SELECT 1 FROM official_positions
           WHERE official_id = $1::uuid AND role = 'governor' AND state_code = $2
           LIMIT 1`,
          officialId,
          stateCode,
        );
        if (alreadyExists.length === 0) {
          // start_date is NOT NULL; a 'contesting' seat has no real start yet, so
          // stamp the prospective term start (May 29 of the election year — the
          // inauguration convention). Reads filter status='active', so this
          // placeholder never surfaces as a sitting term.
          const electionYear = Number(payload.year) || new Date().getFullYear();
          await tx.$queryRawUnsafe(
            `INSERT INTO official_positions
               (official_id, role, state_code, status, appointment_type, start_date,
                confidence, source_type, review_status, reviewed_by, last_verified_at)
             VALUES ($1::uuid, 'governor', $2, 'contesting', 'elected', make_date($3::int, 5, 29),
                     $4, 'manual', 'reviewed', $5, now())`,
            officialId,
            stateCode,
            electionYear,
            ctx.confidence,
            ctx.adminId,
          );
        }
      }

      return { id: rows[0].id, officialId };
    },
  };
}

/**
 * political_parties create. PK is the varchar `acronym` (NOT a uuid), so this
 * entity returns `id = acronym` and registers `evidenceEntryType: null` — the
 * apply service skips copySourcesToEvidence (evidence.entry_id is uuid) and logs
 * the nil uuid in activity_log (target_id is uuid), carrying the acronym in
 * metadata. Mirrors the existing party-FILL behavior (which also skips evidence).
 */
const PARTY_OPTIONAL_COLUMNS: ColumnSpec[] = [
  { key: "isActive", column: "is_active", type: "boolean" },
  { key: "color", column: "color", type: "string" },
  { key: "description", column: "description", type: "string" },
  { key: "email", column: "email", type: "string" },
  { key: "facebookUrl", column: "facebook_url", type: "string" },
  { key: "foundingYear", column: "founding_year", type: "int" },
  { key: "hqAddress", column: "hq_address", type: "string" },
  { key: "ideology", column: "ideology", type: "string" },
  { key: "inecStatus", column: "inec_status", type: "string" },
  { key: "leaderName", column: "leader_name", type: "string" },
  { key: "logoUrl", column: "logo_url", type: "string" },
  { key: "phoneNumber", column: "phone_number", type: "string" },
  { key: "slogan", column: "slogan", type: "string" },
  { key: "twitterHandle", column: "twitter_handle", type: "string" },
  { key: "website", column: "website", type: "string" },
];

function politicalPartyEntity(): CreatableEntity {
  return {
    targetTable: "political_parties",
    evidenceEntryType: null, // non-uuid PK → no evidence copy (see apply service guard)
    validate(raw: unknown): Record<string, unknown> {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw as Record<string, unknown>;
      const out: Record<string, unknown> = {
        acronym: coerce({ key: "acronym", column: "acronym", type: "string", required: true }, p.acronym),
        name: coerce({ key: "name", column: "name", type: "string", required: true }, p.name),
      };
      for (const spec of PARTY_OPTIONAL_COLUMNS) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      const dup = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.acronym,
      );
      if (dup.length > 0) {
        throw new BadRequestException(`party ${payload.acronym} already exists`);
      }
    },
    async insert(tx, payload) {
      // is_active is NOT NULL — coalesce the (optional) provided value to true.
      const isActive = payload.isActive === null || payload.isActive === undefined ? true : payload.isActive;

      const cols = ["acronym", "name", "is_active"];
      const values: unknown[] = [payload.acronym, payload.name, isActive];
      const casts: string[] = ["", "", ""];
      for (const spec of PARTY_OPTIONAL_COLUMNS) {
        if (spec.key === "isActive") continue; // handled above (NOT NULL, always set)
        const v = payload[spec.key];
        if (v === null || v === undefined) continue; // let column defaults / NULL apply
        cols.push(spec.column);
        values.push(v);
        casts.push("");
      }
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()", "now()"); // created_at, updated_at
      cols.push("created_at", "updated_at");

      await tx.$executeRawUnsafe(
        `INSERT INTO political_parties (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")})`,
        ...values,
      );
      // No uuid id — the natural key (acronym) is the row id for downstream logging.
      return { id: payload.acronym as string };
    },
  };
}

/** Tiny stable string hash for slug disambiguation (not security-sensitive). */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Find or create a nigerian_officials row.
 *
 * Two keying modes:
 * - `slug` provided (plan 60): key on the UNIQUE slug column — deterministic and
 *   safe for same-name different-person candidates ("Mohammed Abubakar" the
 *   Bauchi gubernatorial candidate vs the Niger house_of_reps candidate get
 *   distinct slugs from their seat context). The caller has already decided
 *   create-vs-link, so no name matching happens in this mode.
 * - no `slug` (legacy): case-insensitive exact-name match, then create with a
 *   generated slug (slugifyName + hash disambiguation).
 *
 * Returns the official's id. Runs inside the apply tx (enrichment_apply has
 * SELECT + INSERT on nigerian_officials).
 */
async function findOrCreateOfficial(
  tx: RawTx,
  o: {
    name: string;
    imageUrl?: string | null;
    biography?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    twitterHandle?: string | null;
    facebookUrl?: string | null;
    officialType: string | null;
    slug?: string;
  },
): Promise<string> {
  let slug: string;
  if (o.slug) {
    const bySlug = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM nigerian_officials WHERE slug = $1 LIMIT 1`,
      o.slug,
    );
    if (bySlug.length > 0) return bySlug[0].id;
    slug = o.slug;
  } else {
    const existing = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM nigerian_officials WHERE lower(name) = lower($1) LIMIT 1`,
      o.name,
    );
    if (existing.length > 0) return existing[0].id;

    slug = slugifyName(o.name) || `official-${Math.abs(hashStr(o.name)).toString(36).slice(0, 6)}`;
    const clash = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM nigerian_officials WHERE slug = $1`, slug);
    if (clash.length > 0) {
      slug = `${slug}-${Math.abs(hashStr(o.name + (o.officialType ?? ""))).toString(36).slice(0, 4)}`;
    }
  }

  const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO nigerian_officials
       (name, slug, official_type, image_url, biography, gender, date_of_birth, twitter_handle, facebook_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9) RETURNING id`,
    o.name,
    slug,
    o.officialType,
    o.imageUrl ?? null,
    o.biography ?? null,
    o.gender ?? null,
    o.dateOfBirth ?? null,
    o.twitterHandle ?? null,
    o.facebookUrl ?? null,
  );
  return rows[0].id;
}

/**
 * Read a string field out of payload.profile (the nested enrichment blob).
 * Returns null unless the value is a non-empty string.
 */
function prof(p: Record<string, unknown>, k: string): string | null {
  const pr = (p.profile ?? null) as Record<string, unknown> | null;
  const v = pr?.[k];
  return typeof v === "string" && v ? v : null;
}

/** Flatten profile.education (string[] or string) into a single text column. */
function educationText(p: Record<string, unknown>): string | null {
  const pr = (p.profile ?? null) as Record<string, unknown> | null;
  const e = pr?.education;
  if (Array.isArray(e)) return e.filter(Boolean).join("; ") || null;
  return typeof e === "string" && e ? e : null;
}

/** Soft party check (return acronym only if it exists; never reject). */
async function validParty(tx: RawTx, acr: string | null): Promise<string | null> {
  if (!acr) return null;
  const r = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM political_parties WHERE acronym = $1`, acr);
  return r.length ? acr : null;
}

/**
 * Assembly member (State House of Assembly — role 'mha'). Find-or-creates the
 * official, fills profile fields, upserts the active 'mha' position for the
 * constituency seat, and ATOMICALLY downgrades any other active holder on that
 * seat in the same tx (one active member per seat invariant).
 *
 * Schema constraints honored (see migrations 20260403150702 / 20260404200000):
 *  - chk_role_scope: an 'mha' position must set constituency_code ONLY
 *    (state_code/lga_code/ward_code all NULL) — so state_code is NOT inserted,
 *    even though it is derived from the constituency for validation.
 *  - chk_source_type: source_type IN (election_result, official_site, news,
 *    manual) — 'curated' is NOT allowed, so we write 'manual'.
 *  - chk_end_reason: end_reason IN (term_end, impeached, resigned, deceased,
 *    tribunal_sacked, dissolved) — 'superseded' is NOT allowed, so the seat
 *    downgrade leaves end_reason NULL and only flips status → 'contested'.
 *  - chk_status: 'active'/'contested' both valid; chk_confidence: high/medium/low;
 *    chk_review_status: 'reviewed' valid. evidence.entry_type 'position' valid.
 */
export const assemblyMemberEntity: CreatableEntity = {
  targetTable: "assembly_member",
  evidenceEntryType: "position",
  validate(raw: unknown): Record<string, unknown> {
    if (!raw || typeof raw !== "object") throw new BadRequestException("malformed assembly_member payload");
    const p = raw as Record<string, unknown>;
    if (typeof p.name !== "string" || !p.name) throw new BadRequestException("name required");
    if (typeof p.constituencyCode !== "string" || !p.constituencyCode) {
      throw new BadRequestException("constituencyCode required");
    }
    return p; // name, constituencyCode, party?, gender?, leadershipRole?, startDate?, imageUrl?, profile?
  },
  async preflight(tx, p) {
    const c = await tx.$queryRawUnsafe<unknown[]>(
      `SELECT 1 FROM nigerian_constituencies WHERE code = $1`,
      p.constituencyCode,
    );
    if (c.length === 0) throw new BadRequestException(`constituency ${p.constituencyCode} does not exist`);
  },
  async insert(tx, p, ctx) {
    // 0. authoritative state_code from the constituency row (validate it resolves;
    //    NOT trusted from the payload, and NOT inserted into the position — chk_role_scope
    //    forbids state_code on an mha row — but used for logging/return integrity).
    const cc = await tx.$queryRawUnsafe<{ state_code: string }[]>(
      `SELECT state_code FROM nigerian_constituencies WHERE code = $1`,
      p.constituencyCode,
    );
    if (!cc.length || !cc[0].state_code) {
      throw new BadRequestException(`constituency ${p.constituencyCode} has no state_code`);
    }

    // 1. find-or-create the official (reuse in-file helper: slug + base profile on create)
    const officialId = await findOrCreateOfficial(tx, {
      name: p.name as string,
      imageUrl: (p.imageUrl as string) ?? null,
      biography: prof(p, "biography"),
      gender: (p.gender as string) ?? null,
      dateOfBirth: prof(p, "date_of_birth"),
      twitterHandle: prof(p, "twitter"),
      facebookUrl: prof(p, "facebook"),
      // official_type is the appointment *category* (chk_official_type allows
      // elected/appointed/civil_servant/judicial/security/traditional/other) — an mha
      // is elected. The role "mha" belongs on official_positions.role, NOT here.
      officialType: "elected",
    });
    // COALESCE-fill the fields findOrCreateOfficial doesn't set, and the already-existing case.
    await tx.$executeRawUnsafe(
      `UPDATE nigerian_officials SET
         image_url      = COALESCE(image_url, $2),
         gender         = COALESCE(gender, $3),
         biography      = COALESCE(biography, $4),
         date_of_birth  = COALESCE(date_of_birth, $5::date),
         email          = COALESCE(email, $6),
         phone_number   = COALESCE(phone_number, $7),
         office_address = COALESCE(office_address, $8),
         twitter_handle = COALESCE(twitter_handle, $9),
         facebook_url   = COALESCE(facebook_url, $10),
         education      = COALESCE(education, $11),
         updated_at     = now()
       WHERE id = $1`,
      officialId,
      p.imageUrl ?? null,
      p.gender ?? null,
      prof(p, "biography"),
      prof(p, "date_of_birth"),
      prof(p, "email"),
      prof(p, "phone"),
      prof(p, "office_address"),
      prof(p, "twitter"),
      prof(p, "facebook"),
      educationText(p),
    );

    // 2. upsert the active mha position for this seat held by THIS official.
    const party = await validParty(tx, (p.party as string | null) ?? null);
    const existing = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM official_positions WHERE official_id = $1 AND constituency_code = $2 AND role = 'mha' LIMIT 1`,
      officialId,
      p.constituencyCode,
    );
    let positionId: string;
    if (existing.length) {
      await tx.$executeRawUnsafe(
        `UPDATE official_positions SET status='active', party_acronym=$2, leadership_role=$3,
           source_type='manual', confidence=$4, review_status='reviewed', reviewed_by=$5,
           end_date=NULL, end_reason=NULL
         WHERE id=$1`,
        existing[0].id,
        party,
        (p.leadershipRole as string | null) ?? null,
        ctx.confidence ?? "high",
        ctx.adminId,
      );
      positionId = existing[0].id;
    } else {
      // chk_role_scope: mha → constituency_code ONLY (no state_code).
      const pos = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO official_positions
           (official_id, role, constituency_code, appointment_type, status, start_date,
            party_acronym, leadership_role, source_type, confidence, review_status, reviewed_by)
         VALUES ($1::uuid,'mha',$2,'elected','active',$3::date,$4,$5,'manual',$6,'reviewed',$7) RETURNING id`,
        officialId,
        p.constituencyCode,
        (p.startDate as string | null) ?? "2023-06-13",
        party,
        (p.leadershipRole as string | null) ?? null,
        ctx.confidence ?? "high",
        ctx.adminId,
      );
      positionId = pos[0].id;
    }

    // 3. ATOMIC INVARIANT: downgrade every OTHER active mha on this seat in the SAME tx.
    //    chk_end_reason has no 'superseded' value, so we leave end_reason NULL and only
    //    flip status → 'contested' (a valid chk_status value).
    await tx.$executeRawUnsafe(
      `UPDATE official_positions
         SET status='contested'
       WHERE role='mha' AND constituency_code=$1 AND status='active' AND id <> $2`,
      p.constituencyCode,
      positionId,
    );
    return { id: positionId, officialId };
  },
};


/**
 * campaigns create — the bulk-import path for election tickets (campaign
 * dashboard sub-plan 1, Task 14). The tx handed to insert() is the Prisma
 * transaction client (RawTx is its raw subset), so the multi-row write uses
 * the Prisma API; the role is still enrichment_apply (grants in
 * 20260908090100_campaigns_enrichment_apply_grants). Rows land as DRAFT +
 * unreviewed and enter the review queue — this path never publishes.
 *
 * DUPLICATION IS DELIBERATE: the campaign/media/document row-builder below is a
 * second copy of the one in packages/database/scripts/seed-campaigns.ts. The
 * seed is a standalone CLI outside the API's dependency graph (it talks to a
 * raw PrismaClient over its own pg pool and must run without the Nest app), so
 * neither side can import the other. **Change both together** — a field added
 * to the dataset here and not there (or vice versa) silently drops on one path.
 * The same note is repeated in the seed's header.
 *
 * People: an existing official whose slug is slugifyName(name) — or of any of
 * the person's `aka` names — is reused, but only when reusing is safe (see
 * `person()`); otherwise a candidate-typed (official_type NULL) row is created
 * under a per-race slug hint, so a same-name stranger never gets the ticket.
 * Linking to a different existing official is a dashboard job.
 */
const CDN_BASE = (process.env.CDN_BASE_URL ?? "https://cdn.ournigeria.ng").replace(/\/+$/, "");
const cdnKey = (key: unknown): string | null =>
  typeof key === "string" && key ? `${CDN_BASE}/${key.replace(/^\/+/, "")}` : null;

interface ImportPerson {
  name: string;
  shortName?: string;
  dateOfBirth?: string;
  gender?: string;
  poster?: string;
  card?: string;
  /** Alternate spellings/orderings; each is tried as a reuse key. */
  aka?: string[];
  /**
   * Operator assertion: this candidate IS the sitting office holder of the same
   * name. Without it a name that resolves to someone holding an active position
   * gets a fresh per-race row — a false split is a merge away, a false merge
   * puts a ticket on a stranger's profile. Mirrors seed-campaigns.ts.
   */
  knownOfficeHolder?: boolean;
}

/** campaign_documents.kind / .subject — the dataset's closed vocabularies. */
export const CAMPAIGN_DOCUMENT_KINDS = ["manifesto", "cv", "achievements"] as const;
export const CAMPAIGN_DOCUMENT_SUBJECTS = ["ticket", "candidate", "running_mate"] as const;

/**
 * Resolve a ticket person onto an EXISTING nigerian_officials row, or null when
 * the import should mint a fresh per-race row instead.
 *
 * Keyed on the plain slug of the person's name and of every `aka` spelling, so
 * "Adebayo Adewole Ebenezer" still lands on the "Adewole Adebayo" row the DB
 * already has.
 *
 * OFFICE-HOLDER GATE (mirrors seed-campaigns.ts): a plain-slug hit is only
 * reused when either
 *   (a) the dataset asserts `knownOfficeHolder: true` — the operator has
 *       confirmed the candidate IS the sitting office holder, or
 *   (b) that official holds no ACTIVE official_positions row — i.e. it is a
 *       candidate/position-less row (very likely the one a previous import or
 *       seed-party-candidates created), not somebody's office-holder profile.
 * Otherwise we return null and the caller creates a separate per-race row: a
 * false split is one dashboard merge away, a false merge hangs a presidential
 * ticket off a stranger's profile.
 *
 * Raw SQL rather than the Prisma model API because preflight() only receives
 * the RawTx surface; the queries are the exact equivalent of
 * nigerianOfficial.findFirst + officialPosition.count({ status: 'active' }).
 */
async function resolveExistingPerson(
  tx: RawTx,
  p: ImportPerson,
  /** Per-race fallback slug (`{plain}-{year}-{party}`) — the row a previous run of this import minted. */
  fallbackSlug?: string,
): Promise<string | null> {
  const bySlug = async (slug: string): Promise<string | null> => {
    const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM nigerian_officials WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`,
      slug,
    );
    return rows[0]?.id ?? null;
  };

  const slugs = [...new Set([p.name, ...(p.aka ?? [])].map((n) => slugifyName(n)).filter(Boolean))];
  for (const slug of slugs) {
    const id = await bySlug(slug);
    if (!id) continue;
    if (p.knownOfficeHolder === true) return id;
    const held = await tx.$queryRawUnsafe<unknown[]>(
      `SELECT 1 FROM official_positions WHERE official_id = $1::uuid AND status = 'active' LIMIT 1`,
      id,
    );
    if (held.length === 0) return id;
    // Name collides with a sitting office holder and the dataset did not vouch
    // for the merge — stop consulting plain slugs and fall through to the
    // per-race row (which a previous run of this import may already have made).
    break;
  }
  // The per-race slug is by construction a candidate row this import created,
  // so it needs no office-holder gate — but it MUST be consulted, or a re-import
  // under a different campaign slug would mint a second copy of the same person.
  return fallbackSlug ? await bySlug(fallbackSlug) : null;
}

/** `{plain-name}-{year}-{party}` — the per-race slug the import mints for a new person. */
const perRaceSlug = (name: string, year: number, party: string) =>
  `${slugifyName(name)}-${year}-${party.toLowerCase()}`;

function campaignEntity(): CreatableEntity {
  return {
    targetTable: "campaigns",
    evidenceEntryType: null, // evidence rows are per official/position, not per ticket
    validate(raw: unknown): Record<string, unknown> {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw as Record<string, unknown>;
      for (const k of ["slug", "party", "electionType", "year", "candidate"]) {
        if (p[k] === undefined || p[k] === null) throw new BadRequestException(`${k} is required`);
      }
      if (typeof p.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) {
        throw new BadRequestException("slug must be lower-case kebab");
      }
      if (!Number.isInteger(p.year)) throw new BadRequestException("year must be an integer");
      const cand = p.candidate as Partial<ImportPerson>;
      if (typeof cand !== "object" || typeof cand.name !== "string" || !cand.name.trim()) {
        throw new BadRequestException("candidate.name is required");
      }
      // Geo codes: the dataset may carry ISO-style ("LA") state codes or the
      // slug itself ("lagos"); the column is a slug. Anything resolveStateSlug
      // cannot map is kept lower-cased as-is so preflight fails loudly on it
      // (a full name like "Lagos State" is NOT normalised). Constituency/LGA
      // codes are lower-case slugs in their reference tables.
      if (p.stateCode !== undefined && p.stateCode !== null) {
        // Keep an unresolvable value rather than nulling it: preflight turns it
        // into a named 400 instead of silently dropping the ticket's scope.
        p.stateCode = resolveStateSlug(p.stateCode) ?? (String(p.stateCode).trim().toLowerCase() || null);
      }
      for (const k of ["constituencyCode", "lgaCode"]) {
        const v = p[k];
        if (typeof v === "string") p[k] = v.trim().toLowerCase() || null;
      }
      // Documents ride a closed vocabulary; an off-list value would silently
      // render as an unlabeled card on the public ticket page.
      const docs = p.documents;
      if (docs !== undefined && docs !== null) {
        if (!Array.isArray(docs)) throw new BadRequestException("documents must be an array");
        docs.forEach((d, i) => {
          const doc = d as Record<string, unknown>;
          if (!CAMPAIGN_DOCUMENT_KINDS.includes(doc?.kind as never)) {
            throw new BadRequestException(`documents[${i}].kind must be one of ${CAMPAIGN_DOCUMENT_KINDS.join(", ")}`);
          }
          if (!CAMPAIGN_DOCUMENT_SUBJECTS.includes(doc?.subject as never)) {
            throw new BadRequestException(`documents[${i}].subject must be one of ${CAMPAIGN_DOCUMENT_SUBJECTS.join(", ")}`);
          }
          if (typeof doc?.title !== "string" || !doc.title.trim()) {
            throw new BadRequestException(`documents[${i}].title is required`);
          }
        });
      }
      return p;
    },
    async preflight(tx, payload) {
      const exists = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM campaigns WHERE slug = $1`, payload.slug);
      if (exists.length) throw new BadRequestException(`campaign ${payload.slug} already exists`);
      const party = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        String(payload.party).toUpperCase(),
      );
      if (!party.length) throw new BadRequestException(`unknown party ${payload.party}`);

      // Scope FKs are a hard 400 here, not a soften-to-NULL (normalizeGeoRefs):
      // a down-ballot ticket with no scope is unfindable on the public race
      // pages, so a bad code must be fixed in the dataset, not swallowed.
      const geo: Array<[key: string, column: string, table: string]> = [
        ["stateCode", "state_code", "nigerian_states"],
        ["constituencyCode", "constituency_code", "nigerian_constituencies"],
        ["lgaCode", "lga_code", "nigerian_lgas"],
      ];
      for (const [key, column, table] of geo) {
        const v = payload[key];
        if (!v) continue;
        const rows = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM ${table} WHERE code = $1`, v);
        if (!rows.length) throw new BadRequestException(`unknown ${column} ${String(v)}`);
      }

      // Duplicate-anchor guard: the same person cannot hold two tickets for the
      // same race. Only checked when the candidate resolves to an EXISTING
      // official — a to-be-created person has no tickets by definition.
      const cand = payload.candidate as ImportPerson;
      const existingCandidate = await resolveExistingPerson(
        tx,
        cand,
        perRaceSlug(cand.name, Number(payload.year), String(payload.party)),
      );
      if (existingCandidate) {
        const dupe = await tx.$queryRawUnsafe<{ slug: string }[]>(
          `SELECT slug FROM campaigns
            WHERE candidate_official_id = $1::uuid
              AND election_type = $2 AND year = $3::int AND party_acronym = $4
              AND status NOT IN ('withdrawn', 'dissolved')
            LIMIT 1`,
          existingCandidate,
          String(payload.electionType),
          Number(payload.year),
          String(payload.party).toUpperCase(),
        );
        if (dupe.length) {
          throw new BadRequestException(
            `${cand.name} already has a ticket for this race: ${dupe[0].slug}`,
          );
        }
      }
    },
    async insert(rawTx, payload, ctx) {
      const tx = rawTx as unknown as Prisma.TransactionClient;
      const year = Number(payload.year);
      const party = String(payload.party).toUpperCase();
      // campaigns.confidence is a free string column; official_elections and
      // campaign_documents take the 3-value enum. Coerce ONCE here so the
      // ticket, its documents and its anchor can never disagree.
      const confidence: AnchorConfidence =
        ctx.confidence === "high" || ctx.confidence === "low" ? ctx.confidence : "medium";

      const person = async (p: ImportPerson | null) => {
        if (!p) return null;
        const imageUrl = cdnKey(p.card ?? p.poster);
        const slugHint = perRaceSlug(p.name, year, party);
        // Reuse only when the office-holder gate says it is safe — see
        // resolveExistingPerson. Same call preflight makes, so the duplicate
        // check and the write can never disagree about who this person is.
        const existingId = await resolveExistingPerson(rawTx, p, slugHint);
        if (existingId) return { id: existingId, name: p.name, imageUrl };
        const id = await findOrCreateOfficial(rawTx, {
          name: p.name,
          imageUrl,
          gender: p.gender ?? null,
          dateOfBirth: p.dateOfBirth ?? null,
          officialType: null, // a candidate is not an office-holder (plan 60 §4.3)
          slug: slugHint,
        });
        return { id, name: p.name, imageUrl };
      };

      const cand = (await person(payload.candidate as ImportPerson))!;
      const mateInput = (payload.runningMate as ImportPerson | null | undefined) ?? null;
      const mate = await person(mateInput);
      const c = payload.candidate as ImportPerson;
      const blurbs = (payload.documentBlurbs as Record<string, string> | undefined) ?? {};
      const art = payload.posterArt as
        | { urlColor?: string; candidate: object; mate?: object; chip?: object; scrim?: object }
        | undefined;

      const media: { type: string; url: string; metadata?: object; displayOrder: number }[] = [];
      const push = (type: string, key: unknown, metadata?: object) => {
        const url = cdnKey(key);
        if (url) media.push({ type, url, metadata, displayOrder: media.length });
      };
      push(
        "poster_candidate",
        c.poster,
        art ? { box: art.candidate, chip: art.chip ?? null, scrim: art.scrim ?? null, urlColor: art.urlColor ?? null } : undefined,
      );
      push("poster_mate", mateInput?.poster, art?.mate ? { box: art.mate } : undefined);
      push("card_candidate", c.card);
      push("card_mate", mateInput?.card);
      push("quote_photo", payload.quotePhoto);
      push("bio_photo", payload.bioPhoto);
      push("logo", payload.logo);

      type Doc = { kind: string; subject: string; title: string; blurb?: string; cover?: string; file?: string; pageCount?: number };
      const documents = ((payload.documents as Doc[] | undefined) ?? []).map((d) => ({
        kind: d.kind,
        subject: d.subject,
        title: d.title,
        blurb: d.blurb ?? blurbs[d.kind] ?? null,
        coverUrl: cdnKey(d.cover),
        fileUrl: cdnKey(d.file),
        pageCount: d.pageCount ?? null,
        confidence,
        sourceType: "import",
      }));

      const row = await tx.campaign.create({
        data: {
          slug: String(payload.slug),
          electionType: String(payload.electionType),
          year,
          partyAcronym: party,
          stateCode: (payload.stateCode as string | null) ?? null,
          constituencyCode: (payload.constituencyCode as string | null) ?? null,
          lgaCode: (payload.lgaCode as string | null) ?? null,
          candidateOfficialId: cand.id,
          candidateName: cand.name,
          candidateShortName: c.shortName ?? null,
          candidateImageUrl: cand.imageUrl,
          runningMateOfficialId: mate?.id ?? null,
          runningMateName: mate?.name ?? null,
          runningMateImageUrl: mate?.imageUrl ?? null,
          candidateBio: (payload.candidateBio as string | null) ?? null,
          visionLine: (payload.visionLine as string | null) ?? null,
          fineprint: (payload.fineprint as string | null) ?? null,
          pullQuote: (payload.pullQuote as string | null) ?? null,
          pullQuoteBg: (payload.pullQuoteBg as string | null) ?? null,
          brandColor: (payload.brandColor as string | null) ?? null,
          factionLabel: (payload.factionLabel as string | null) ?? null,
          isDisputed: Boolean(payload.isDisputed),
          status: "draft",
          reviewStatus: "unreviewed",
          reviewRequestedAt: new Date(),
          reviewRequestedBy: ctx.adminId,
          confidence,
          sourceType: "import",
          sourceUrl: (payload.sourceUrl as string | null) ?? null,
          documents: { create: documents },
          media: { create: media },
        },
        select: {
          id: true,
          electionType: true,
          year: true,
          partyAcronym: true,
          stateCode: true,
          constituencyCode: true,
          lgaCode: true,
          candidateOfficialId: true,
          candidateName: true,
          runningMateOfficialId: true,
          runningMateName: true,
          officialElectionId: true,
        },
      });
      const anchor = await ensureTicketElections(tx, row, {
        result: "pending",
        reviewedBy: ctx.adminId,
        sourceType: "import",
        confidence,
        // Nobody has looked at a machine-created anchor yet; the ticket itself
        // lands review_status='unreviewed' and the anchor must match.
        reviewStatus: "unreviewed",
      });
      if (anchor.candidateElectionId) {
        await tx.campaign.update({ where: { id: row.id }, data: { officialElectionId: anchor.candidateElectionId } });
      }
      return { id: row.id, officialId: cand.id };
    },
  };
}

export const CREATABLE_ENTITIES: Record<string, CreatableEntity> = {
  official_education: officialFactEntity("official_education", "education", [
    { key: "institution", column: "institution", type: "string", required: true },
    { key: "institutionType", column: "institution_type", type: "string" },
    { key: "qualification", column: "qualification", type: "string" },
    { key: "field", column: "field", type: "string" },
    { key: "startYear", column: "start_year", type: "int" },
    { key: "endYear", column: "end_year", type: "int" },
    { key: "graduated", column: "graduated", type: "boolean" },
    { key: "location", column: "location", type: "string" },
  ]),
  official_careers: officialFactEntity("official_careers", "career", [
    { key: "organization", column: "organization", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "industry", column: "industry", type: "string" },
    { key: "employmentType", column: "employment_type", type: "string" },
    { key: "startYear", column: "start_year", type: "int" },
    { key: "endYear", column: "end_year", type: "int" },
    { key: "description", column: "description", type: "string" },
  ]),
  official_party_affiliations: officialFactEntity(
    "official_party_affiliations",
    "party_affiliation",
    [
      { key: "partyAcronym", column: "party_acronym", type: "string", required: true },
      { key: "startDate", column: "start_date", type: "date" },
      { key: "endDate", column: "end_date", type: "date" },
      { key: "reason", column: "reason", type: "string" },
    ],
    async (tx, payload) => {
      // Party is the point of this table — unknown party is a hard 400 here.
      const p = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.partyAcronym,
      );
      if (p.length === 0) {
        throw new BadRequestException(`party ${payload.partyAcronym} does not exist`);
      }
    },
  ),
  official_committees: officialFactEntity("official_committees", "committee", [
    { key: "committeeName", column: "committee_name", type: "string", required: true },
    { key: "chamber", column: "chamber", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "positionId", column: "position_id", type: "uuid" },
    { key: "termId", column: "term_id", type: "uuid" },
    { key: "startDate", column: "start_date", type: "date" },
    { key: "endDate", column: "end_date", type: "date" },
  ]),
  official_sponsored_bills: officialFactEntity("official_sponsored_bills", "bill", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "billNumber", column: "bill_number", type: "string" },
    { key: "chamber", column: "chamber", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "status", column: "status", type: "string" },
    { key: "introducedDate", column: "introduced_date", type: "date" },
    { key: "statusDate", column: "status_date", type: "date" },
    { key: "summary", column: "summary", type: "string" },
  ]),
  // Elections accept EITHER officialId (agent path) OR officialName (curated
  // import — find-or-create). Bespoke entity; behavior with officialId present
  // is identical to the prior officialFactEntity registration.
  official_elections: electionEntity(),
  official_asset_declarations: officialFactEntity("official_asset_declarations", "asset", [
    { key: "year", column: "year", type: "int", required: true },
    { key: "declaredTo", column: "declared_to", type: "string" },
    { key: "amount", column: "amount", type: "number" },
    { key: "currency", column: "currency", type: "string" },
    { key: "summary", column: "summary", type: "string" },
  ]),
  official_awards: officialFactEntity("official_awards", "award", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "awardedBy", column: "awarded_by", type: "string" },
    { key: "year", column: "year", type: "int" },
    { key: "category", column: "category", type: "string" },
    { key: "description", column: "description", type: "string" },
  ]),
  official_publications: officialFactEntity("official_publications", "publication", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "type", column: "type", type: "string" },
    { key: "publisher", column: "publisher", type: "string" },
    { key: "year", column: "year", type: "int" },
  ]),
  official_family_members: officialFactEntity("official_family_members", "family", [
    { key: "relationship", column: "relationship", type: "string", required: true },
    { key: "name", column: "name", type: "string" },
    { key: "relatedOfficialId", column: "related_official_id", type: "uuid" },
    { key: "isPublicFigure", column: "is_public_figure", type: "boolean" },
    { key: "notes", column: "notes", type: "string" },
  ]),
  official_legal_cases: officialFactEntity("official_legal_cases", "legal_case", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "caseType", column: "case_type", type: "string", required: true },
    { key: "status", column: "status", type: "string", required: true },
    { key: "forum", column: "forum", type: "string" },
    { key: "caseNumber", column: "case_number", type: "string" },
    { key: "filedDate", column: "filed_date", type: "date" },
    { key: "resolvedDate", column: "resolved_date", type: "date" },
    { key: "outcome", column: "outcome", type: "string" },
    { key: "role", column: "role", type: "string" },
    { key: "recordKind", column: "record_kind", type: "string" },
    { key: "relatedCorruptionCaseId", column: "related_corruption_case_id", type: "uuid" },
  ], async (tx, payload) => {
    // Soften raw agent enums onto chk_legal_case_type / chk_legal_status.
    payload.caseType = coerceEnum(payload.caseType, LEGAL_CASE_TYPE);
    payload.status = coerceEnum(payload.status, LEGAL_STATUS);
    // role / record_kind are NULLABLE — soften anything off-list to null
    // (plan 59: never assert a role the record doesn't prove).
    const ROLES = ["defendant", "plaintiff", "claimant", "respondent", "named_in"];
    const KINDS = ["adjudicated", "allegation", "listing", "appearance"];
    const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    payload.role = ROLES.includes(norm(payload.role)) ? norm(payload.role) : null;
    payload.recordKind = KINDS.includes(norm(payload.recordKind)) ? norm(payload.recordKind) : null;
    // DEPLOY-ORDER GUARD: the enrichment agent (which files role/recordKind) can
    // deploy before the API applies migration 20260824021900. Approving such a
    // proposal pre-migration would 500 on a nonexistent column — the exact bug
    // class PR #193 fixed. Soften to null (insert skips null columns) when the
    // columns aren't there yet; the values remain visible in proposed_value.
    // Cache only the POSITIVE result: once the columns exist they never vanish,
    // but a skipped-then-applied migration must be picked up without an API
    // restart, so a missing-columns answer is re-probed on every apply.
    if (legalCaseNewColsPresent !== true) {
      const cols = await tx.$queryRawUnsafe<{ column_name: string }[]>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'official_legal_cases' AND column_name IN ('role','record_kind')`,
      );
      legalCaseNewColsPresent = cols.length === 2;
    }
    if (!legalCaseNewColsPresent) {
      // eslint-disable-next-line no-console -- deliberate: softening must be visible in API logs
      console.warn(
        "[enrichment] official_legal_cases.role/record_kind columns missing (migration 20260824021900 not applied) — softening both to null",
      );
      payload.role = null;
      payload.recordKind = null;
    }
  }),
  // Corruption involvement is a COMPOUND create: a corruption_cases row + a
  // corruption_case_parties row linking the official (subjectType='official').
  // Evidence attaches to the case. Bespoke (two-row), like councilors.
  corruption_cases: corruptionInvolvementEntity(),
  // Party officers (chairman/secretary/party leader) — party-scoped, no official.
  party_officers: partyOfficerEntity(),
  // Brand-new political parties (curated import). PK is varchar `acronym`, not a
  // uuid — evidenceEntryType:null so the apply service skips evidence/uuid casts.
  political_parties: politicalPartyEntity(),
  // Assembly member (State House of Assembly, role 'mha'): find-or-create official,
  // upsert active mha position for the seat, atomic downgrade of other holders.
  assembly_member: assemblyMemberEntity,
  // Election tickets (bulk import): draft campaign + media + documents + anchor.
  campaigns: campaignEntity(),
};

export function getCreatableEntity(targetTable: string): CreatableEntity | null {
  return CREATABLE_ENTITIES[targetTable] ?? null;
}
