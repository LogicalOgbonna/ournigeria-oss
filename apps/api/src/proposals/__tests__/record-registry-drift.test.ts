import { describe, it, expect } from "vitest";
import { RECORD_SCHEMAS } from "@ournigeria/official-records";
import { getCreatableEntity } from "../../enrichment/creatable.registry";
import { isAppliable } from "../../enrichment/enrichment.constants";

const OFFICIAL_ID = "11111111-1111-1111-1111-111111111111";

function sentinel(input: string, options?: readonly string[]): unknown {
  switch (input) {
    case "year": return 2020;
    case "number": case "money": return 1; // integer — passes both int and number coercion
    case "boolean": return true;
    case "date": return "2020-01-01";
    case "select": return options![0];
    default: return "sentinel";
  }
}

describe("official-records registry ↔ CREATABLE_ENTITIES drift", () => {
  for (const schema of Object.values(RECORD_SCHEMAS)) {
    it(`${schema.recordType}: entity exists and validate() keeps every field`, () => {
      const entity = getCreatableEntity(schema.table);
      expect(entity, `no creatable entity for ${schema.table}`).toBeTruthy();
      const payload: Record<string, unknown> = { officialId: OFFICIAL_ID };
      for (const f of schema.fields) payload[f.key] = sentinel(f.input, f.options);
      const out = entity!.validate(payload);
      for (const f of schema.fields) {
        expect(out[f.key], `${schema.recordType}.${f.key} dropped by entity.validate`).not.toBeNull();
        expect(out[f.key]).not.toBeUndefined();
      }
    });
    it(`${schema.recordType}: every editable column is appliable`, () => {
      for (const f of schema.fields.filter((f) => f.editable)) {
        expect(isAppliable(schema.table, f.column), `${schema.table}.${f.column}`).toBe(true);
      }
    });
  }
});
