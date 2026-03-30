/**
 * Thread adapter: validates and formats thread content.
 * Bridges to packages/content/ thread recipes when available.
 */
export function formatThread(tweets: string[]): string[] {
  return tweets.map((tweet, i) => {
    if (tweet.length <= 280) return tweet;

    // Try to truncate at sentence boundary
    const truncated = tweet.slice(0, 277);
    const lastBreak = Math.max(
      truncated.lastIndexOf("."),
      truncated.lastIndexOf("?"),
    );

    if (lastBreak > 200) {
      return tweet.slice(0, lastBreak + 1);
    }

    return truncated + "...";
  });
}

export function validateThread(tweets: string[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (tweets.length < 2) {
    issues.push("Thread must have at least 2 tweets");
  }

  if (tweets.length > 10) {
    issues.push("Thread too long (max 10 tweets)");
  }

  tweets.forEach((tweet, i) => {
    if (tweet.length > 280) {
      issues.push(`Tweet ${i + 1} exceeds 280 chars (${tweet.length})`);
    }
  });

  return { valid: issues.length === 0, issues };
}
