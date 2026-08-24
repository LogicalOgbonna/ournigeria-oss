import { RecordSchemaDef, RecordFieldDef } from "./registry";

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  /** coerced copy: ""/null/undefined dropped, year/number strings → numbers */
  data: Record<string, unknown>;
}

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function coerceField(f: RecordFieldDef, raw: unknown): { value?: unknown; error?: string } {
  if (raw === undefined || raw === null || raw === "") {
    return f.required ? { error: `${f.label} is required` } : {};
  }
  switch (f.input) {
    case "year": {
      const n = typeof raw === "string" ? Number(raw) : raw;
      if (!Number.isInteger(n) || (n as number) < YEAR_MIN || (n as number) > YEAR_MAX) {
        return { error: `${f.label} must be a year (${YEAR_MIN}–${YEAR_MAX})` };
      }
      return { value: n };
    }
    case "number":
    case "money": {
      const n = typeof raw === "string" ? Number(raw) : raw;
      if (typeof n !== "number" || !Number.isFinite(n)) return { error: `${f.label} must be a number` };
      return { value: n };
    }
    case "boolean":
      if (typeof raw !== "boolean") return { error: `${f.label} must be yes/no` };
      return { value: raw };
    case "date":
      if (typeof raw !== "string" || !DATE_RE.test(raw)) return { error: `${f.label} must be yyyy-mm-dd` };
      return { value: raw };
    case "select":
      if (typeof raw !== "string" || !f.options?.includes(raw)) {
        return { error: `${f.label} must be one of: ${f.options?.join(", ")}` };
      }
      return { value: raw };
    default: // text, textarea, party, geo:*
      if (typeof raw !== "string" || raw.trim().length === 0) {
        return { error: `${f.label} must be text` };
      }
      return { value: raw.trim() };
  }
}

export function validateRecordData(schema: RecordSchemaDef, raw: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: { _: "malformed record" }, data };
  }
  const input = raw as Record<string, unknown>;
  for (const f of schema.fields) {
    const r = coerceField(f, input[f.key]);
    if (r.error) errors[f.key] = r.error;
    else if (r.value !== undefined) data[f.key] = r.value;
  }
  // reject unknown keys — the entity insert would silently drop them
  for (const k of Object.keys(input)) {
    if (!schema.fields.some((f) => f.key === k)) errors[k] = "unknown field";
  }
  return { ok: Object.keys(errors).length === 0, errors, data };
}
