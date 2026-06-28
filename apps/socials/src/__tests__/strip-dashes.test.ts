import { describe, it, expect } from "vitest";
import { stripDashes } from "../intelligence/agent.service.js";

describe("stripDashes — guarantees no em/en-dashes ever ship", () => {
  it("turns a spaced clause em-dash into a comma", () => {
    expect(
      stripDashes("Allocation reaches LGAs — but FAAC only shows receipts."),
    ).toBe("Allocation reaches LGAs, but FAAC only shows receipts.");
  });

  it("turns a spaced en-dash into a comma", () => {
    expect(stripDashes("Feb 2026 – the figure")).toBe("Feb 2026, the figure");
  });

  it("keeps a tight range/compound dash as a hyphen", () => {
    expect(stripDashes("Jan–Apr 2026")).toBe("Jan-Apr 2026");
    expect(stripDashes("2024—2025")).toBe("2024-2025");
  });

  it("leaves clean text untouched", () => {
    const s = "Gaya (Kano) got ₦597.7M in Feb 2026.";
    expect(stripDashes(s)).toBe(s);
  });

  it("never lets an em or en dash survive", () => {
    for (const i of ["a — b — c", "x–y", "1—2", "Jan–Apr — really", "no dashes"]) {
      expect(/[—–]/.test(stripDashes(i))).toBe(false);
    }
  });

  it("does not produce double commas", () => {
    expect(/,\s*,/.test(stripDashes("states, — but really"))).toBe(false);
  });
});
