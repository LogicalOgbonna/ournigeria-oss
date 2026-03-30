/**
 * Opinion tweet recipe: single tweet, max 280 chars.
 * Formula: [Pidgin hook] + [data point] + [implicit question/outrage]
 */
export function formatOpinionTweet(content: string): string {
  // Ensure within 280 chars
  if (content.length <= 280) {
    return content;
  }

  // Try truncating at last sentence boundary before 280
  const truncated = content.slice(0, 277);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastQuestion = truncated.lastIndexOf("?");
  const lastBreak = Math.max(lastPeriod, lastQuestion);

  if (lastBreak > 200) {
    return content.slice(0, lastBreak + 1);
  }

  // Hard truncate with ellipsis
  return truncated + "...";
}

export function validateTweetLength(content: string): {
  valid: boolean;
  length: number;
} {
  return {
    valid: content.length <= 280,
    length: content.length,
  };
}
