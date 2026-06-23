// Human label for a state code (lowercase, underscore form used across the API,
// e.g. "akwa_ibom" -> "Akwa Ibom", "fct" -> "FCT").
const SPECIAL: Record<string, string> = { fct: "FCT" };

export function stateLabel(code: string): string {
  if (SPECIAL[code]) return SPECIAL[code];
  return code
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
