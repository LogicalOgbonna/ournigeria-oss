import type { ChartBlock } from "../types/charts";

const CHART_BLOCK_REGEX = /```chart\s*\n([\s\S]*?)\n\s*```/g;

/**
 * Extract ```chart``` blocks from agent markdown text.
 * Returns cleaned text (charts removed) and parsed chart blocks.
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
