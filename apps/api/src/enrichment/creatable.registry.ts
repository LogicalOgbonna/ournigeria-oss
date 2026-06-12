import { BadRequestException } from "@nestjs/common";

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
  /** evidence.entry_type used when copying proposal_sources → evidence. */
  evidenceEntryType: string;
  /** Throws BadRequestException on a malformed payload. */
  validate(payload: unknown): Record<string, unknown>;
  /** FK existence / duplicate checks inside the tx (clean 400s, not raw FK 500s). */
  preflight?(tx: RawTx, payload: Record<string, unknown>): Promise<void>;
  insert(
    tx: RawTx,
    payload: Record<string, unknown>,
    ctx: { adminId: string; confidence: string },
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
      values.push(ctx.confidence, "agent", "reviewed", ctx.adminId);
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

/** Soft party check — mirrors the councilor behavior: unknown party → null, never reject. */
async function softenUnknownParty(tx: RawTx, payload: Record<string, unknown>): Promise<void> {
  if (!payload.partyAcronym) return;
  const p = await tx.$queryRawUnsafe<unknown[]>(
    `SELECT 1 FROM political_parties WHERE acronym = $1`,
    payload.partyAcronym,
  );
  if (p.length === 0) payload.partyAcronym = null;
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
  official_elections: officialFactEntity(
    "official_elections",
    "election",
    [
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
    ],
    softenUnknownParty,
  ),
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
    { key: "relatedCorruptionCaseId", column: "related_corruption_case_id", type: "uuid" },
  ]),
};

export function getCreatableEntity(targetTable: string): CreatableEntity | null {
  return CREATABLE_ENTITIES[targetTable] ?? null;
}
