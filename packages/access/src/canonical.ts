/**
 * Deterministic JSON for hashing: recursively sorted object keys, `undefined`
 * treated as absent, Dates as ISO-8601 UTC strings. The output for a given
 * value NEVER changes across releases — it is part of the chain contract
 * (spec §10). Do not "improve" this function; additive event-shape changes
 * create a new chain epoch instead.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sortValue);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortValue(v);
    }
    return out;
  }
  return value;
}
