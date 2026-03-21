import { describe, it, expect } from "vitest";
import { parseTweets, buildShortenPrompt, formatTwitterThread, buildThreadMarkdown } from "../formats/twitter-thread.js";

describe("parseTweets", () => {
  it("parses standard Tweet N: format", () => {
    const input = `Tweet 1: First tweet here
Tweet 2: Second tweet
Tweet 3: Third tweet`;
    const tweets = parseTweets(input);
    expect(tweets).toHaveLength(3);
    expect(tweets[0]).toBe("First tweet here");
    expect(tweets[1]).toBe("Second tweet");
    expect(tweets[2]).toBe("Third tweet");
  });

  it("handles multi-line tweets", () => {
    const input = `Tweet 1: This is a long tweet
that continues on the next line
Tweet 2: Short one`;
    const tweets = parseTweets(input);
    expect(tweets).toHaveLength(2);
    expect(tweets[0]).toBe("This is a long tweet that continues on the next line");
  });

  it("handles case-insensitive tweet markers", () => {
    const input = `tweet 1: lowercase
TWEET 2: uppercase`;
    const tweets = parseTweets(input);
    expect(tweets).toHaveLength(2);
  });

  it("returns empty array for unparseable input", () => {
    const input = "This is just a paragraph with no tweet markers.";
    const tweets = parseTweets(input);
    expect(tweets).toHaveLength(0);
  });

  it("handles tweets without spaces after number", () => {
    const input = `Tweet1: No space
Tweet2: Also no space`;
    const tweets = parseTweets(input);
    expect(tweets).toHaveLength(2);
  });
});

describe("buildShortenPrompt", () => {
  it("identifies oversized tweets", () => {
    const tweets = [
      "Short tweet",
      "A".repeat(300), // oversized
      "Another short one",
    ];
    const prompt = buildShortenPrompt(tweets);
    expect(prompt).toContain("Oversized tweets (indices): 2");
    expect(prompt).toContain("Tweet 1:");
    expect(prompt).toContain("Tweet 2:");
    expect(prompt).toContain("Tweet 3:");
  });
});

describe("formatTwitterThread", () => {
  it("formats valid tweets", () => {
    const input = "Tweet 1: Hello world\nTweet 2: Goodbye world";
    const result = formatTwitterThread(input, { state: "Lagos" }, "budget-expose");
    expect(result.type).toBe("twitter-thread");
    expect(result.content).toHaveLength(2);
    expect(result.warnings).toBeUndefined();
  });

  it("warns on oversized tweets", () => {
    const input = `Tweet 1: ${"A".repeat(300)}\nTweet 2: Short`;
    const result = formatTwitterThread(input, { state: "Lagos" }, "budget-expose");
    expect(result.warnings).toBeDefined();
    expect(result.warnings![0]).toContain("exceed 280");
  });

  it("warns on no parseable tweets", () => {
    const result = formatTwitterThread("Random text", { state: "Lagos" }, "budget-expose");
    expect(result.warnings).toBeDefined();
    expect(result.warnings![0]).toContain("No parseable tweets");
  });
});

describe("buildThreadMarkdown", () => {
  it("generates valid markdown with frontmatter", () => {
    const md = buildThreadMarkdown(
      ["First tweet", "Second tweet"],
      { state: "Lagos", year: 2024 },
      "budget-expose",
    );
    expect(md).toContain("---");
    expect(md).toContain("type: budget-expose");
    expect(md).toContain("state: Lagos");
    expect(md).toContain("### Tweet 1");
    expect(md).toContain("### Tweet 2");
  });

  it("adds warning for oversized tweets", () => {
    const md = buildThreadMarkdown(
      ["Short", "A".repeat(300)],
      { state: "Lagos" },
      "budget-expose",
    );
    expect(md).toContain("warning:");
    expect(md).toContain("exceed 280");
  });
});
