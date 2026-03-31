import { describe, it, expect } from "vitest";
import {
  formatOpinionTweet,
  validateTweetLength,
} from "../content/opinion-tweet.recipe.js";

describe("formatOpinionTweet", () => {
  it("returns content unchanged when within 280 chars", () => {
    const content = "Lagos 2024 budget don allocate ₦47M for one borehole. How?";
    expect(content.length).toBeLessThanOrEqual(280);
    const result = formatOpinionTweet(content);
    expect(result).toBe(content);
  });

  it("truncates content that exceeds 280 chars", () => {
    // Build a string longer than 280 chars with a sentence boundary after char 200
    const longContent =
      "A".repeat(210) +
      ". " +
      "B".repeat(80) +
      ". This is way too long to fit in a single tweet and should be truncated properly.";
    expect(longContent.length).toBeGreaterThan(280);

    const result = formatOpinionTweet(longContent);
    expect(result.length).toBeLessThanOrEqual(280);
  });
});
