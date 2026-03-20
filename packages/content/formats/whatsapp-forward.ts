/**
 * WhatsApp Forward Format Adapter
 *
 * Generates plain text messages optimized for WhatsApp forwarding.
 * Uses emoji for visual structure, keeps messages under 4096 chars
 * (WhatsApp message limit), and includes CTA link.
 */

import type { FormattedOutput, RecipeParams } from "../recipes/types.js";

const MAX_WHATSAPP_LENGTH = 4096;

/**
 * Format LLM output as a WhatsApp-friendly forwarding message.
 * Takes the raw content and wraps it with emoji structure and CTA.
 */
export function formatWhatsApp(
  llmOutput: string,
  params: RecipeParams,
  recipeId: string,
): FormattedOutput {
  const state = params.state ?? "Nigeria";
  const warnings: string[] = [];

  // Build the WhatsApp message
  const header = getHeader(recipeId, state, params.year);
  const body = cleanForWhatsApp(llmOutput);
  const cta = `\n\n---\n\nCheck am yourself: https://app.ournigeria.ng\n\nForward this message make your people know! `;

  let message = `${header}\n\n${body}${cta}`;

  if (message.length > MAX_WHATSAPP_LENGTH) {
    // Truncate body to fit
    const maxBody = MAX_WHATSAPP_LENGTH - header.length - cta.length - 50;
    const truncated = body.slice(0, maxBody).replace(/\s+\S*$/, "...");
    message = `${header}\n\n${truncated}${cta}`;
    warnings.push(
      `Message truncated from ${body.length} to ${truncated.length} chars`,
    );
  }

  return {
    type: "whatsapp",
    content: message,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function getHeader(recipeId: string, state: string, year?: number): string {
  const yearStr = year ? ` ${year}` : "";
  const headers: Record<string, string> = {
    "budget-expose": `*${state}${yearStr} Budget Wahala*`,
    "corruption-impact": `*Corruption Alert: ${state}*`,
    "state-comparison": `*State Comparison${yearStr}*`,
    "faac-allocation": `*FAAC Money Tracking: ${state}${yearStr}*`,
  };
  return headers[recipeId] ?? `*OurNigeria: ${state}${yearStr}*`;
}

/**
 * Clean LLM output for WhatsApp:
 * - Remove Tweet N: prefixes
 * - Remove markdown formatting
 * - Add emoji bullets for key points
 */
function cleanForWhatsApp(text: string): string {
  return text
    // Remove Tweet markers
    .replace(/^Tweet\s*\d+:\s*/gim, "")
    // Remove markdown headers
    .replace(/^#+\s*/gm, "")
    // Remove citation markers
    .replace(/\[\d+\]/g, "")
    // Convert markdown bold to WhatsApp bold
    .replace(/\*\*(.*?)\*\*/g, "*$1*")
    // Trim excessive whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
