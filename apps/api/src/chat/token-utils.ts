/**
 * Lightweight token estimation without external dependencies.
 * Uses word-based heuristic: ~1.3 tokens per word for English text.
 * This is intentionally conservative to avoid context overflow.
 */

const TOKENS_PER_WORD = 1.3;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * TOKENS_PER_WORD);
}

/** Default context budget allocations (in tokens). */
export const CONTEXT_BUDGET = {
  /** System prompt + agent instructions (reserved, not counted here) */
  systemPrompt: 2000,
  /** RAG chunks injected into the prompt */
  ragContext: 4000,
  /** Running conversation summary */
  summary: 1000,
  /** Recent messages (filled newest-first until budget exhausted) */
  recentMessages: 6000,
  /** Reserved for LLM generation output */
  responseHeadroom: 4000,
} as const;

/**
 * Select as many recent messages as fit within a token budget.
 * Messages are added newest-first so the most recent context is preserved.
 */
export function selectMessagesByTokenBudget(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Array<{ role: string; content: string }> {
  let used = 0;
  const selected: Array<{ role: string; content: string }> = [];

  // Walk backwards (newest first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const cost = estimateTokens(msg.content) + 10; // +10 for role label overhead
    if (used + cost > maxTokens) break;
    used += cost;
    selected.unshift(msg);
  }

  return selected;
}
