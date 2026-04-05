import { describe, it, expect } from "vitest";
import { isRetryableLLMError } from "../retry-utils";

describe("isRetryableLLMError", () => {
  // True cases — retryable errors
  it("returns true for 402 statusCode", () => {
    expect(isRetryableLLMError({ statusCode: 402 })).toBe(true);
  });

  it("returns true for 429 statusCode", () => {
    expect(isRetryableLLMError({ statusCode: 429 })).toBe(true);
  });

  it("returns true for 500 statusCode", () => {
    expect(isRetryableLLMError({ statusCode: 500 })).toBe(true);
  });

  it("returns true for 503 statusCode", () => {
    expect(isRetryableLLMError({ statusCode: 503 })).toBe(true);
  });

  it("returns true for cause.statusCode 402", () => {
    expect(isRetryableLLMError({ cause: { statusCode: 402 } })).toBe(true);
  });

  it("returns true for 'more credits' message", () => {
    expect(
      isRetryableLLMError({ message: "You need more credits to continue" }),
    ).toBe(true);
  });

  it("returns true for ETIMEDOUT", () => {
    expect(
      isRetryableLLMError({ message: "connect ETIMEDOUT 1.2.3.4:443" }),
    ).toBe(true);
  });

  it("returns true for ECONNRESET", () => {
    expect(isRetryableLLMError({ message: "read ECONNRESET" })).toBe(true);
  });

  // False cases — non-retryable errors
  it("returns false for 'Conversation not found'", () => {
    expect(isRetryableLLMError({ message: "Conversation not found" })).toBe(
      false,
    );
  });

  it("returns false for 400 statusCode", () => {
    expect(isRetryableLLMError({ statusCode: 400 })).toBe(false);
  });

  it("returns false for 404 statusCode", () => {
    expect(isRetryableLLMError({ statusCode: 404 })).toBe(false);
  });

  it("returns false for Prisma P2002", () => {
    expect(
      isRetryableLLMError({
        code: "P2002",
        message: "Unique constraint failed",
      }),
    ).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isRetryableLLMError(null)).toBe(false);
    expect(isRetryableLLMError(undefined)).toBe(false);
  });

  it("returns false for generic error", () => {
    expect(isRetryableLLMError(new Error("some random error"))).toBe(false);
  });

  // Edge: does NOT false-positive on '402' in message (eng review #6)
  it("returns false for message containing '402' without matching statusCode", () => {
    expect(isRetryableLLMError({ message: "processed 402 records" })).toBe(
      false,
    );
  });
});
