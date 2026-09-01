const SECRET_KEY_PATTERN =
  /(password|token|secret|apikey|api_key|authorization|cookie|credential)/i;
const MAX_DEPTH = 6;
const MAX_STRING = 2000;

/** Deep-copy `value` with secret-looking keys replaced by "[REDACTED]". */
export function redactSecrets(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[TRUNCATED]";
  if (typeof value === "string") {
    return value.length > MAX_STRING
      ? value.slice(0, MAX_STRING) + "…"
      : value;
  }
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redactSecrets(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEY_PATTERN.test(k)
      ? "[REDACTED]"
      : redactSecrets(v, depth + 1);
  }
  return out;
}
