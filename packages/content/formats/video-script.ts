/**
 * Video Script Format Adapter
 *
 * Generates JSON props compatible with the Remotion video compositions
 * in apps/videos/. Output is a JSON object that can be passed to
 * `pnpm videos:generate --recipe <type> --props <json>`.
 */

import type { FormattedOutput, RecipeParams } from "../recipes/types.js";

interface VideoScript {
  composition: string;
  props: Record<string, unknown>;
  narration: string[];
}

/**
 * Parse LLM output into video script format.
 * Expects structured output with scenes:
 *   Scene 1 (Hook): [narration text]
 *   Scene 2 (Data): [narration text]
 *   Scene 3 (Impact): [narration text]
 *   Scene 4 (CTA): [narration text]
 */
export function parseVideoScript(llmOutput: string): string[] {
  const narration: string[] = [];
  const lines = llmOutput.split("\n");

  for (const line of lines) {
    const sceneMatch = line.match(/^Scene\s*\d+\s*\([^)]+\):\s*(.*)/i);
    if (sceneMatch && sceneMatch[1].trim()) {
      narration.push(sceneMatch[1].trim());
    }
  }

  // Fallback: split by paragraphs if no Scene markers
  if (narration.length === 0) {
    const paragraphs = llmOutput
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);
    narration.push(...paragraphs.slice(0, 4));
  }

  return narration;
}

/**
 * Map recipe ID to Remotion composition name.
 */
function recipeToComposition(recipeId: string): string {
  const map: Record<string, string> = {
    "budget-expose": "StateBudget",
    "corruption-impact": "CorruptionCase",
    "state-comparison": "StateComparison",
    "faac-allocation": "FAACAllocation",
  };
  return map[recipeId] ?? "StateBudget";
}

/**
 * Format LLM output as a video script with Remotion composition reference.
 */
export function formatVideoScript(
  llmOutput: string,
  params: RecipeParams,
  recipeId: string,
): FormattedOutput {
  const narration = parseVideoScript(llmOutput);
  const composition = recipeToComposition(recipeId);
  const warnings: string[] = [];

  if (narration.length === 0) {
    warnings.push("No parseable narration in LLM output");
  }

  const script: VideoScript = {
    composition,
    props: {
      state: params.state ?? "Nigeria",
      year: params.year ?? new Date().getFullYear(),
      state2: params.state2,
    },
    narration,
  };

  return {
    type: "video-script",
    content: JSON.stringify(script, null, 2),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
