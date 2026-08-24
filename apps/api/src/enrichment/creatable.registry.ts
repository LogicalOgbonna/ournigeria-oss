import { BadRequestException } from "@nestjs/common";
import { slugifyName } from "@ournigeria/database";
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
          officialType: "elected",
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
 * Find (by case-insensitive exact name) or create a nigerian_officials row.
 * On create, generates a unique slug (slugifyName + hash fallback/disambiguation)
 * and stamps official_type + optional bio/image/gender/dob/social fields.
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
  },
): Promise<string> {
  const existing = await tx.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM nigerian_officials WHERE lower(name) = lower($1) LIMIT 1`,
    o.name,
  );
  if (existing.length > 0) return existing[0].id;

  let slug = slugifyName(o.name) || `official-${Math.abs(hashStr(o.name)).toString(36).slice(0, 6)}`;
  const clash = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM nigerian_officials WHERE slug = $1`, slug);
  if (clash.length > 0) {
    slug = `${slug}-${Math.abs(hashStr(o.name + (o.officialType ?? ""))).toString(36).slice(0, 4)}`;
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
    if (legalCaseNewColsPresent === null) {
      const cols = await tx.$queryRawUnsafe<{ column_name: string }[]>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'official_legal_cases' AND column_name IN ('role','record_kind')`,
      );
      legalCaseNewColsPresent = cols.length === 2;
    }
    if (!legalCaseNewColsPresent) {
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
};

export function getCreatableEntity(targetTable: string): CreatableEntity | null {
  return CREATABLE_ENTITIES[targetTable] ?? null;
}
