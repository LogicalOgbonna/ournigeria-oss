import { describe, it, expect } from "vitest";
import { TopicMatcher } from "../intelligence/topic-matcher.js";

function createMatcher(): TopicMatcher {
  return new TopicMatcher();
}

describe("TopicMatcher", () => {
  it("matches corruption domain when text contains EFCC or corruption keywords", () => {
    const matcher = createMatcher();
    const result = matcher.match(
      "EFCC arrests governor for corruption and money laundering",
    );
    expect(result.domain).toBe("corruption");
  });

  it("matches budget domain when text contains budget or allocation keywords", () => {
    const matcher = createMatcher();
    const result = matcher.match(
      "The 2024 budget allocation for capital expenditure was increased",
    );
    expect(result.domain).toBe("budget");
  });

  it("extracts Nigerian states from text", () => {
    const matcher = createMatcher();
    const result = matcher.match(
      "Lagos and Kano states received the largest FAAC allocation",
    );
    expect(result.entities.states).toContain("lagos");
    expect(result.entities.states).toContain("kano");
  });

  it("returns general domain when no keywords match", () => {
    const matcher = createMatcher();
    const result = matcher.match(
      "The weather in Abuja is sunny today",
    );
    expect(result.domain).toBe("general");
  });
});
