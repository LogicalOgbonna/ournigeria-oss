import { generateText } from "ai";
import { chatModel } from "../mastra/rag/config";
import { estimateTokens } from "./token-utils";

/**
 * Minimum number of messages beyond the summary boundary before
 * we trigger a new summarization pass.
 */
const SUMMARIZE_THRESHOLD = 8;

/** Max tokens for the generated summary. */
const MAX_SUMMARY_TOKENS = 600;

const SUMMARIZE_PROMPT = `Condense this conversation history into a concise summary (under 400 words). Preserve:
- The user's core questions, interests, and intent
- Key facts: states, years, budget figures, official names, and amounts discussed
- Conclusions, comparisons, and analyses already made
- The direction of the conversation (what the user is likely to ask next)

Do NOT include greetings, filler, or repetitive details. Be factual and dense.`;

interface SummarizeInput {
  existingSummary: string | null;
  messages: Array<{ role: string; content: string }>;
}

/**
 * Generate a compressed summary of conversation history.
 * Merges the existing summary with new messages.
 */
export async function generateSummary({
  existingSummary,
  messages,
}: SummarizeInput): Promise<string> {
  const parts: string[] = [];

  if (existingSummary) {
    parts.push(`Previous summary:\n${existingSummary}`);
  }

  parts.push(
    `New messages:\n${messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n")}`,
  );

  const { text } = await generateText({
    model: chatModel,
    system: SUMMARIZE_PROMPT,
    prompt: parts.join("\n\n---\n\n"),
    maxOutputTokens: MAX_SUMMARY_TOKENS,
  });

  return text.trim();
}

/**
 * Check whether a conversation needs summarization and run it if so.
 * Returns the updated summary and summaryUpTo sequence number,
 * or null if no summarization was needed.
 */
export async function maybeSummarize(opts: {
  existingSummary: string | null;
  summaryUpTo: number | null;
  currentSeq: number;
  getMessages: (
    fromSeq: number,
    toSeq: number,
  ) => Promise<Array<{ role: string; content: string }>>;
}): Promise<{ summary: string; summaryUpTo: number } | null> {
  const { existingSummary, summaryUpTo, currentSeq, getMessages } = opts;
  const boundary = summaryUpTo ?? 0;

  // Number of messages beyond the summary that are NOT in the recent window
  // We keep the last 10 messages as "recent" and summarize everything before that
  const recentWindowSize = 10;
  const unsummarized = currentSeq - boundary;

  if (unsummarized < recentWindowSize + SUMMARIZE_THRESHOLD) {
    return null; // Not enough new messages to warrant summarization
  }

  // Summarize from boundary+1 up to currentSeq - recentWindowSize
  const summarizeUpTo = currentSeq - recentWindowSize;
  const messages = await getMessages(boundary + 1, summarizeUpTo);

  if (messages.length === 0) return null;

  // Skip summarization if the messages are very short (not worth the LLM call)
  const totalTokens = messages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0,
  );
  if (totalTokens < 200) return null;

  const summary = await generateSummary({ existingSummary, messages });

  return { summary, summaryUpTo: summarizeUpTo };
}
