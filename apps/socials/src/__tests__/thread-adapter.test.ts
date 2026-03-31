import { describe, it, expect } from "vitest";
import { validateThread } from "../content/thread-adapter.js";

describe("validateThread", () => {
  it("reports issues when a tweet in the thread exceeds 280 chars", () => {
    const tweets = [
      "First tweet is fine.",
      "A".repeat(300), // 300 chars — over limit
      "Third tweet is also fine.",
    ];

    const result = validateThread(tweets);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Tweet 2 exceeds 280 chars"),
      ]),
    );
  });
});
