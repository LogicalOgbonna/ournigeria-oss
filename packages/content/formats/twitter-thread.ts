/**
 * Twitter Thread Format Adapter
 *
 * Parses LLM output into individual tweets, validates 280-char limit,
 * and optionally retries oversized tweets via LLM.
 */

import type { FormattedOutput, RecipeParams } from "../recipes/types.js";

const MAX_TWEET_LENGTH = 280;

/**
 * Parse "Tweet N: ..." format from LLM output into array of tweet strings.
 */
export function parseTweets(llmOutput: string): string[] {
  const lines = llmOutput.split("\n");
  const tweets: string[] = [];
  let currentTweet = "";

  for (const line of lines) {
    const tweetMatch = line.match(/^Tweet\s*\d+:\s*(.*)/i);
    if (tweetMatch) {
      if (currentTweet.trim()) {
        tweets.push(currentTweet.trim());
      }
      currentTweet = tweetMatch[1];
    } else if (currentTweet && line.trim()) {
      currentTweet += " " + line.trim();
    }
  }
  if (currentTweet.trim()) {
    tweets.push(currentTweet.trim());
  }

  return tweets;
}

/**
 * Build a retry prompt for oversized tweets.
 */
export function buildShortenPrompt(tweets: string[]): string {
  const oversizedIndices = tweets
    .map((t, i) => (t.length > MAX_TWEET_LENGTH ? i + 1 : null))
    .filter(Boolean);

  return `Some tweets are over 280 characters. Please shorten ONLY the oversized ones while keeping the Pidgin tone and ₦ amounts. Return the FULL thread with all tweets.

Current thread:
${tweets.map((t, i) => `Tweet ${i + 1}: ${t}`).join("\n")}

Oversized tweets (indices): ${oversizedIndices.join(", ")}`;
}

/**
 * Build markdown output for a Twitter thread.
 */
export function buildThreadMarkdown(
  tweets: string[],
  params: RecipeParams,
  recipeId: string,
): string {
  const now = new Date().toISOString();
  const state = params.state ?? params.state2 ?? "national";
  const year = params.year ?? "";
  const oversizedCount = tweets.filter(
    (t) => t.length > MAX_TWEET_LENGTH,
  ).length;

  let frontmatter = `---
type: ${recipeId}
state: ${state}
year: ${year}
generated: ${now}
status: draft`;

  if (oversizedCount > 0) {
    frontmatter += `\nwarning: "${oversizedCount} tweet(s) exceed 280 characters — review before posting"`;
  }

  frontmatter += "\n---";

  const tweetBlocks = tweets
    .map((tweet, i) => `### Tweet ${i + 1}\n${tweet}\n`)
    .join("\n");

  return `${frontmatter}

## Thread: ${state}${year ? ` ${year}` : ""} — ${recipeId}

${tweetBlocks}`;
}

/**
 * Format LLM output as a Twitter thread.
 */
export function formatTwitterThread(
  llmOutput: string,
  params: RecipeParams,
  recipeId: string,
): FormattedOutput {
  const tweets = parseTweets(llmOutput);
  const oversized = tweets.filter((t) => t.length > MAX_TWEET_LENGTH);
  const warnings: string[] = [];

  if (tweets.length === 0) {
    warnings.push("No parseable tweets in LLM output");
  }
  if (oversized.length > 0) {
    warnings.push(
      `${oversized.length} tweet(s) exceed ${MAX_TWEET_LENGTH} characters`,
    );
  }

  return {
    type: "twitter-thread",
    content: tweets,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
