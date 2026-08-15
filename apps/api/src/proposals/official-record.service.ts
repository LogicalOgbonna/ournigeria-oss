import { Injectable, BadRequestException } from "@nestjs/common";
import { getCreatableEntity, RawTx } from "../enrichment/creatable.registry";
import { isAppliable } from "../enrichment/enrichment.constants";
import { getRecordSchema, validateRecordData } from "@ournigeria/official-records";

/**
 * Applies APPROVED citizen structured contributions by consuming the existing
 * CREATABLE_ENTITIES insert path (Plan 55). Every method assumes the caller's
 * tx has already run `SET LOCAL ROLE enrichment_apply`. Table/column names are
 * interpolated ONLY from the static registry — never from user input.
 */
@Injectable()
export class OfficialRecordService {
  async applyAdd(
    tx: RawTx,
    args: { recordType: string; officialId: string; data: unknown; adminId: string },
  ): Promise<{ factId: string }> {
    const schema = getRecordSchema(args.recordType);
    if (!schema) throw new BadRequestException(`unknown recordType: ${args.recordType}`);
    const entity = getCreatableEntity(schema.table);
    if (!entity) throw new BadRequestException(`no creatable entity for ${schema.table}`);
    const v = validateRecordData(schema, args.data);
    if (!v.ok) throw new BadRequestException(`invalid record: ${JSON.stringify(v.errors)}`);
    const payload = entity.validate({ officialId: args.officialId, ...v.data });
    if (entity.preflight) await entity.preflight(tx, payload);
    const created = await entity.insert(tx, payload, {
      adminId: args.adminId,
      confidence: "medium",
      sourceType: "citizen",
    });
    return { factId: created.id };
  }

  async applyEdit(
    tx: RawTx,
    args: {
      recordType: string;
      officialId: string;
      targetPk: string;
      field: string;
      value: unknown;
      adminId: string;
    },
  ): Promise<void> {
    const schema = getRecordSchema(args.recordType);
    if (!schema) throw new BadRequestException(`unknown recordType: ${args.recordType}`);
    const fieldDef = schema.fields.find((f) => f.key === args.field);
    if (!fieldDef?.editable || !isAppliable(schema.table, fieldDef.column)) {
      throw new BadRequestException(`${args.recordType}.${args.field} is not correctable`);
    }
    const v = validateRecordData(schema, { [args.field]: args.value });
    if (v.errors[args.field]) throw new BadRequestException(v.errors[args.field]);
    const cast = fieldDef.input === "date" ? "::date" : "";
    const n = await tx.$executeRawUnsafe(
      `UPDATE "${schema.table}" SET "${fieldDef.column}" = $1${cast}
       WHERE id = $2::uuid AND official_id = $3::uuid`,
      v.data[args.field] ?? null,
      args.targetPk,
      args.officialId,
    );
    if (n === 0) throw new BadRequestException("target record no longer exists");
  }

  /** Citizen evidence row from a bare sourceUrl — synthesizes evidence's NOT NULL columns. */
  async insertCitizenEvidence(
    tx: RawTx,
    args: { entryType: string; entryId: string; field: string | null; url: string; retrievedAt: Date },
  ): Promise<void> {
    let publisher = "citizen source";
    try {
      publisher = new URL(args.url).hostname;
    } catch {
      /* keep fallback */
    }
    await tx.$executeRawUnsafe(
      `INSERT INTO evidence
         (entry_type, entry_id, field, url, publisher, snippet, format, source_tier, confidence, retrieved_at)
       VALUES ($1, $2::uuid, $3, $4, $5, 'Citizen-submitted source', 'html', 'web', 'medium', $6)`,
      args.entryType,
      args.entryId,
      args.field,
      args.url,
      publisher,
      args.retrievedAt,
    );
  }
}
