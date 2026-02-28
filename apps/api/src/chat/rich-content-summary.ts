import type { AIResponseContent } from "../types";

/**
 * Generate a compact text summary of richContent so the agent
 * remembers what data it previously presented (charts, stats, officials, etc.).
 */
export function summarizeRichContent(rich: unknown): string {
  if (!rich || typeof rich !== "object") return "";

  const r = rich as Partial<AIResponseContent>;
  const parts: string[] = [];

  if (r.stats?.length) {
    parts.push(
      `Key figures: ${r.stats.map((s) => `${s.label}: ${s.value}`).join(", ")}`,
    );
  }

  if (
    r.moneyEquivalents &&
    typeof r.moneyEquivalents.amount === "number" &&
    r.moneyEquivalents.amount > 0
  ) {
    const amt = r.moneyEquivalents.amount;
    const formatted =
      amt >= 1e12
        ? `₦${(amt / 1e12).toFixed(1)}T`
        : amt >= 1e9
          ? `₦${(amt / 1e9).toFixed(1)}B`
          : `₦${(amt / 1e6).toFixed(1)}M`;
    parts.push(`Amount discussed: ${formatted}`);
  }

  if (r.officials?.length) {
    for (const o of r.officials) {
      const names = o.officials.map((off) => `${off.name} (${off.role})`);
      parts.push(`${o.state} ${o.year} officials: ${names.join(", ")}`);
    }
  }

  if (r.sources?.length) {
    const unique = new Set(
      r.sources
        .map((s) => [s.state, s.year].filter(Boolean).join(" "))
        .filter(Boolean),
    );
    if (unique.size > 0) {
      parts.push(`Sources referenced: ${Array.from(unique).join(", ")}`);
    }
  }

  if (r.charts?.length) {
    parts.push(
      `Charts shown: ${r.charts.map((c) => c.title || c.type).join(", ")}`,
    );
  }

  return parts.join(". ");
}
