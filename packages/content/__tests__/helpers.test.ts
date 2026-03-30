import { describe, it, expect } from "vitest";
import { formatNairaShort } from "../templates/helpers.js";

describe("formatNairaShort", () => {
  it("formats trillions", () => {
    expect(formatNairaShort(1_500_000_000_000)).toBe("₦1.5T");
  });

  it("formats billions", () => {
    expect(formatNairaShort(2_300_000_000)).toBe("₦2.3B");
  });

  it("formats millions", () => {
    expect(formatNairaShort(871_000_000)).toBe("₦871M");
  });

  it("formats thousands", () => {
    expect(formatNairaShort(45_000)).toBe("₦45K");
  });

  it("formats small values", () => {
    expect(formatNairaShort(500)).toBe("₦500");
  });
});
