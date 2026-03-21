/**
 * Shared LLM client for content generation.
 * Reuses the same OpenAI-compatible client pattern from generate.ts.
 */

import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getLLMClient(): OpenAI {
  if (_client) return _client;

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing LLM_API_KEY. Run with: infisical run --env dev -- npx tsx ...",
    );
    process.exit(1);
  }

  _client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL || undefined,
  });

  return _client;
}

export function getLLMModel(): string {
  return process.env.LLM_MODEL ?? "gpt-4o";
}

/**
 * Retry wrapper for LLM API calls with exponential backoff.
 * Retries on 429 (rate limit), 500, 502, 503 errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status =
        err instanceof OpenAI.APIError ? err.status : undefined;
      const retryable =
        status === 429 || status === 500 || status === 502 || status === 503;

      if (!retryable || attempt === maxRetries) {
        throw err;
      }

      const delay = Math.pow(2, attempt) * 1000;
      console.log(
        `  [${label}] Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries}, status ${status})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // TypeScript: unreachable, but satisfies return type
  throw new Error(`${label}: max retries exceeded`);
}
