import type { ChartBlock, ChartPoint } from "@/types/charts";

const CHART_BLOCK_REGEX = /```chart\s*\n([\s\S]*?)\n\s*```/g;

/**
 * Common x-axis field names that LLMs produce instead of "name".
 * Order matters — first match wins.
 */
const X_AXIS_ALIASES = [
  "year",
  "date",
  "period",
  "month",
  "quarter",
  "category",
  "label",
  "state",
  "sector",
  "item",
  "bin",
];

/** Chart types that use config.series for multi-line/area rendering. */
const SERIES_CHART_TYPES = new Set([
  "line",
  "area",
  "stacked-area",
  "stacked-bar",
  "radar",
]);

/** Chart types that need x/y coordinate pairs. */
const XY_CHART_TYPES = new Set(["scatter", "bubble"]);

/**
 * Normalize chart data keys so renderers always find the keys they expect.
 *
 * Returns a new ChartBlock with normalized data and config, or null if the
 * data cannot be meaningfully normalized (no numeric fields at all).
 *
 * Rules:
 * 1. X-axis: if data lacks "name" (or "x"), map the first known alias to "name".
 * 2. Series charts: if config.series keys don't exist in data, remap series to
 *    the actual numeric fields found in the data.
 * 3. Single-value charts: if data lacks "value", map the first numeric field to "value".
 */
export function normalizeChartData(block: ChartBlock): ChartBlock | null {
  if (!block.data.length) return null;

  const sample = block.data[0];
  const allKeys = Object.keys(sample);
  const numericKeys = allKeys.filter(
    (k) => typeof sample[k] === "number" && !k.startsWith("_"),
  );
  const stringKeys = allKeys.filter(
    (k) => typeof sample[k] === "string" && !k.startsWith("_"),
  );

  if (numericKeys.length === 0) return null;

  // --- XY charts (scatter, bubble) ---
  if (XY_CHART_TYPES.has(block.type)) {
    const hasX = "x" in sample;
    const hasY = "y" in sample;
    if (hasX && hasY) return block;
    // Try to map first two numeric fields to x/y
    if (numericKeys.length >= 2) {
      const [xKey, yKey] = numericKeys;
      const data = block.data.map((d) => {
        const point: ChartPoint = { ...d };
        if (!hasX) {
          point.x = d[xKey] as number;
        }
        if (!hasY) {
          point.y = d[yKey] as number;
        }
        return point;
      });
      return { ...block, data };
    }
    return null;
  }

  // --- Determine if x-axis key needs mapping ---
  const hasName = "name" in sample;
  const hasX = "x" in sample;
  let xSourceKey: string | null = null;

  if (!hasName && !hasX) {
    // Find the first alias present in data
    xSourceKey =
      X_AXIS_ALIASES.find((alias) => alias in sample) ??
      (stringKeys.length > 0 ? stringKeys[0] : null);
  }

  // --- Series charts (line, area, stacked, radar) ---
  if (SERIES_CHART_TYPES.has(block.type)) {
    const series = block.config?.series ?? [{ key: "value", label: "Value" }];
    const seriesKeysExist = series.every((s) => s.key in sample);

    if (seriesKeysExist && !xSourceKey) return block;

    // Remap series keys to actual numeric fields in data
    let remappedSeries = series;
    if (!seriesKeysExist) {
      // Exclude the x-axis source key from numeric candidates
      const valueKeys = numericKeys.filter(
        (k) => k !== xSourceKey && k !== "name" && k !== "x",
      );
      if (valueKeys.length === 0) return null;

      remappedSeries = series.map((s, i) => {
        if (s.key in sample) return s;
        const replacement = valueKeys[i % valueKeys.length];
        return { ...s, key: replacement };
      });
    }

    const data = xSourceKey
      ? block.data.map((d) => ({
          ...d,
          name: String(d[xSourceKey] ?? ""),
        }))
      : block.data;

    return {
      ...block,
      data,
      config: { ...block.config, series: remappedSeries },
    };
  }

  // --- Single-value charts (bar, column, pie, donut, treemap, etc.) ---
  const hasValue = "value" in sample && typeof sample.value === "number";
  if (hasValue && !xSourceKey) return block;

  // Find the best numeric field for "value"
  const valueKey = hasValue
    ? null
    : numericKeys.find((k) => k !== xSourceKey && k !== "name" && k !== "x") ??
      numericKeys[0];

  const data = block.data.map((d) => {
    const point: ChartPoint = { ...d };
    if (xSourceKey && !("name" in d)) {
      point.name = String(d[xSourceKey] ?? "");
    }
    if (valueKey && !("value" in d && typeof d.value === "number")) {
      point.value = Number(d[valueKey]) || 0;
    }
    return point;
  });

  return { ...block, data };
}

/**
 * Extract chart blocks from markdown text.
 * Returns the cleaned text (charts removed) and parsed chart blocks.
 */
export function extractChartBlocks(markdown: string): {
  text: string;
  charts: ChartBlock[];
} {
  const charts: ChartBlock[] = [];

  const cleanedText = markdown.replace(CHART_BLOCK_REGEX, (_match, json) => {
    try {
      const parsed = JSON.parse(json);
      if (isValidChartBlock(parsed)) {
        charts.push(parsed);
        return "";
      }
    } catch {
      // Invalid JSON — leave in text as code block
    }
    return _match;
  });

  return { text: cleanedText.trim(), charts };
}

function isValidChartBlock(obj: unknown): obj is ChartBlock {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("type" in obj) ||
    !("title" in obj) ||
    !("data" in obj)
  )
    return false;

  const block = obj as ChartBlock;
  return (
    typeof block.type === "string" &&
    block.type.length > 0 &&
    typeof block.title === "string" &&
    block.title.length > 0 &&
    block.title.length <= 200 &&
    Array.isArray(block.data) &&
    block.data.length > 0
  );
}
