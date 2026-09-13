import { describe, expect, it } from "vitest";
import {
  dateEncodingError,
  displayDate,
  electionStatusLabel,
  type ElectionReviewStatus,
  type ElectionStatus,
  type Tone,
} from "../elections";

type Row = {
  published: boolean;
  status: ElectionStatus;
  reviewStatus: ElectionReviewStatus;
};
const row = (
  published: boolean,
  status: ElectionStatus,
  reviewStatus: ElectionReviewStatus = "unreviewed",
): Row => ({ published, status, reviewStatus });

describe("electionStatusLabel", () => {
  it.each<[string, Row, string, Tone]>([
    ["a draft event", row(false, "scheduled"), "Draft", "neutral"],
    ["a published event", row(true, "scheduled", "reviewed"), "Published", "success"],
    [
      "a published event edited since review",
      row(true, "scheduled", "unreviewed"),
      "Published · re-review",
      "warning",
    ],
    [
      "a postponed published event",
      row(true, "postponed", "reviewed"),
      "Published · postponed",
      "warning",
    ],
    ["a postponed draft", row(false, "postponed"), "Draft · postponed", "warning"],
    // Terminal statuses win the label whatever `published` says — they drop
    // off the gate automatically.
    ["a concluded event", row(true, "concluded", "reviewed"), "Concluded", "neutral"],
    ["a cancelled event", row(false, "cancelled"), "Cancelled", "danger"],
  ])("labels %s", (_name, input, label, tone) => {
    expect(electionStatusLabel(input)).toEqual({ label, tone });
  });
});

describe("displayDate", () => {
  it("shows only the cycle year at year precision", () => {
    expect(
      displayDate({ year: 2027, electionDate: null, datePrecision: "year" }),
    ).toBe("2027");
  });

  it("shows month + year at month precision", () => {
    expect(
      displayDate({
        year: 2027,
        electionDate: "2027-01-01T00:00:00.000Z",
        datePrecision: "month",
      }),
    ).toBe("Jan 2027");
  });

  it("shows the full date at day precision, from UTC pieces", () => {
    // A @db.Date is UTC midnight — a western-timezone toLocaleString would
    // render 15 Jan; the UTC-piece formatting must not.
    expect(
      displayDate({
        year: 2027,
        electionDate: "2027-01-16T00:00:00.000Z",
        datePrecision: "day",
      }),
    ).toBe("16 Jan 2027");
  });

  it("falls back to the cycle year when a date is missing", () => {
    expect(
      displayDate({ year: 2026, electionDate: null, datePrecision: "day" }),
    ).toBe("2026");
  });
});

describe("dateEncodingError", () => {
  // E1.2/E1.4: ONE legal encoding per precision; no year-equality clause —
  // the date's calendar year may differ from the cycle year (a Dec→Jan
  // postponement).
  it.each<[string, "year" | "month" | "day", string | null, boolean]>([
    ["year precision with no date", "year", null, true],
    ["year precision carrying a date", "year", "2027-01-16", false],
    ["month precision on the first", "month", "2027-01-01", true],
    ["month precision mid-month", "month", "2027-01-16", false],
    ["month precision with no date", "month", null, false],
    ["day precision with a full date", "day", "2027-01-16", true],
    ["a postponed poll dated outside the cycle year", "day", "2028-01-16", true],
    ["day precision with no date", "day", null, false],
  ])("%s is %s", (_name, precision, date, legal) => {
    const err = dateEncodingError(precision, date);
    if (legal) expect(err).toBeNull();
    else expect(err).toBeTruthy();
  });
});
