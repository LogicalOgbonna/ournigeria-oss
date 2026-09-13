import { describe, expect, it } from "vitest";
import {
  ReasonCancelledError,
  cancelMessage,
  isReasonCancelled,
} from "../campaign-reason";

describe("cancelMessage", () => {
  it("names the action and why nothing was committed", () => {
    expect(cancelMessage("Upload", "cancelled")).toBe(
      "Upload cancelled — a reason is needed on a live ticket",
    );
    expect(cancelMessage("Remove", "cancelled")).toBe(
      "Remove cancelled — a reason is needed on a live ticket",
    );
  });

  it("blames the right thing when a second prompt superseded the first", () => {
    // The first action's toast must not claim the operator cancelled a dialog
    // they never saw — they started a second change while it was still open.
    expect(cancelMessage("Upload", "superseded")).toBe(
      "Upload cancelled — you started another change before giving a reason",
    );
  });
});

describe("isReasonCancelled", () => {
  it("recognises only a cancellation, so a real failure still reads as one", () => {
    expect(isReasonCancelled(new ReasonCancelledError("x", "cancelled"))).toBe(true);
    expect(isReasonCancelled(new Error("Upload failed (network)"))).toBe(false);
    expect(isReasonCancelled("Upload failed")).toBe(false);
    expect(isReasonCancelled(null)).toBe(false);
  });

  it("keeps the cause for callers that branch on it", () => {
    const err = new ReasonCancelledError(
      cancelMessage("Reorder", "superseded"),
      "superseded",
    );
    expect(err.cause).toBe("superseded");
    expect(err.name).toBe("ReasonCancelledError");
  });
});
