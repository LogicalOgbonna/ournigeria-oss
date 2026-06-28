import { describe, it, expect } from "vitest";
import { ApiResponseError } from "twitter-api-v2";
import {
  isEngagementRestricted,
  statusUrl,
} from "../platforms/twitter/twitter.adapter.js";

function apiError(code: number, detail?: string): ApiResponseError {
  const err = Object.create(ApiResponseError.prototype) as ApiResponseError;
  Object.assign(err, {
    code,
    message: `Request failed with code ${code}`,
    data: detail ? { detail, title: "Forbidden", status: code } : {},
  });
  return err;
}

describe("isEngagementRestricted — drives the quote-by-URL fallback", () => {
  it("true for the reply engagement restriction", () => {
    expect(
      isEngagementRestricted(
        apiError(
          403,
          "Reply to this conversation is not allowed because you have not been mentioned or otherwise engaged by the author of the post you are replying to.",
        ),
      ),
    ).toBe(true);
  });

  it("true for the quote engagement restriction", () => {
    expect(
      isEngagementRestricted(
        apiError(
          403,
          "Quoting this post is not allowed because you have not been mentioned or are not part of the conversation thread of the post you are quoting.",
        ),
      ),
    ).toBe(true);
  });

  it("false for a generic write-permission 403 (don't pseudo-quote those)", () => {
    expect(
      isEngagementRestricted(
        apiError(403, "You are not permitted to perform this action."),
      ),
    ).toBe(false);
  });

  it("false for non-403 errors and non-API errors", () => {
    expect(isEngagementRestricted(apiError(401, "Unauthorized"))).toBe(false);
    expect(isEngagementRestricted(new Error("network"))).toBe(false);
    expect(isEngagementRestricted(null)).toBe(false);
  });
});

describe("statusUrl", () => {
  it("uses the handle when known", () => {
    expect(statusUrl("123", "awanigeria")).toBe(
      "https://x.com/awanigeria/status/123",
    );
  });
  it("falls back to the id-only web URL", () => {
    expect(statusUrl("123")).toBe("https://x.com/i/web/status/123");
  });
});
