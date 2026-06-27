import { describe, it, expect } from "vitest";
import { ApiResponseError } from "twitter-api-v2";
import { __testables } from "../reply-queue/reply-queue.service.js";

const {
  xAuthFailureMessage,
  X_NO_WRITE,
  X_AUTH_EXPIRED,
  X_REPLY_RESTRICTED,
  X_TOO_LONG,
  X_DUPLICATE,
} = __testables;

/**
 * Build a minimal ApiResponseError-shaped object. twitter-api-v2's real error
 * carries `code` (HTTP status) and `data` (parsed body). We only need those two
 * for the classifier, so we forge an instance and assign them.
 */
function apiError(code: number, detail?: string): ApiResponseError {
  const err = Object.create(ApiResponseError.prototype) as ApiResponseError;
  Object.assign(err, {
    code,
    message: `Request failed with code ${code}`,
    data: detail ? { detail, title: "Forbidden", status: code } : {},
  });
  return err;
}

describe("xAuthFailureMessage — X 403 reason classification", () => {
  it("maps reply engagement restriction to X_REPLY_RESTRICTED (the awanigeria case)", () => {
    const err = apiError(
      403,
      "Reply to this conversation is not allowed because you have not been mentioned or otherwise engaged by the author of the post you are replying to.",
    );
    expect(xAuthFailureMessage(err)).toBe(X_REPLY_RESTRICTED);
  });

  it("maps quote engagement restriction to X_REPLY_RESTRICTED", () => {
    const err = apiError(
      403,
      "Quoting this post is not allowed because you have not been mentioned or are not part of the conversation thread of the post you are quoting.",
    );
    expect(xAuthFailureMessage(err)).toBe(X_REPLY_RESTRICTED);
  });

  it("maps over-length 403 to X_TOO_LONG", () => {
    expect(xAuthFailureMessage(apiError(403, "Your Tweet text is too long."))).toBe(
      X_TOO_LONG,
    );
  });

  it("maps duplicate content 403 to X_DUPLICATE", () => {
    expect(
      xAuthFailureMessage(
        apiError(403, "You are not allowed to create a Tweet with duplicate content."),
      ),
    ).toBe(X_DUPLICATE);
  });

  it("falls back to X_NO_WRITE for a bare/unknown 403", () => {
    expect(xAuthFailureMessage(apiError(403))).toBe(X_NO_WRITE);
    expect(
      xAuthFailureMessage(apiError(403, "You are not permitted to perform this action.")),
    ).toBe(X_NO_WRITE);
  });

  it("maps 401 to X_AUTH_EXPIRED", () => {
    expect(xAuthFailureMessage(apiError(401, "Unauthorized"))).toBe(X_AUTH_EXPIRED);
  });

  it("maps refresh-token failures to X_AUTH_EXPIRED", () => {
    expect(
      xAuthFailureMessage(new Error("cannot refresh: token was invalid (invalid_grant)")),
    ).toBe(X_AUTH_EXPIRED);
  });

  it("returns null for non-auth content/transient errors (bubbles up as 500)", () => {
    expect(xAuthFailureMessage(apiError(400, "Some unrelated bad request"))).toBeNull();
    expect(xAuthFailureMessage(new Error("network timeout"))).toBeNull();
  });
});
