export const CHART_PALETTE = [
  "#059669", // Emerald 600 (primary)
  "#0891b2", // Cyan 600
  "#d97706", // Amber 600
  "#65a30d", // Lime 600
  "#7c3aed", // Violet 600
  "#e11d48", // Rose 600
  "#0284c7", // Sky 600
  "#ea580c", // Orange 600
  "#4f46e5", // Indigo 600
  "#be185d", // Pink 700
];

export function formatChartValue(
  value: number,
  format: "naira" | "percent" | "number" | "compact" = "number",
): string {
  switch (format) {
    case "naira":
      if (value >= 1e12) return `₦${(value / 1e12).toFixed(1)}T`;
      if (value >= 1e9) return `₦${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `₦${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `₦${(value / 1e3).toFixed(0)}K`;
      return `₦${value.toLocaleString()}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "compact":
      return Intl.NumberFormat("en", { notation: "compact" }).format(value);
    default:
      return value.toLocaleString();
  }
}

export function getChartColors(count: number, custom?: string[]): string[] {
  const palette = custom ?? CHART_PALETTE;
  return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}
