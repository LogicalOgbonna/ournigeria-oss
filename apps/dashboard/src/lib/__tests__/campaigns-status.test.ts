import { describe, expect, it } from "vitest";
import {
  seatStateCode,
  statusLabel,
  type CampaignStatus,
  type ReviewStatus,
  type Tone,
} from "../campaigns";

type Row = {
  status: CampaignStatus;
  reviewStatus: ReviewStatus;
  reviewRequestedAt: string | null;
};
const row = (
  status: CampaignStatus,
  reviewStatus: ReviewStatus,
  reviewRequestedAt: string | null = null,
): Row => ({ status, reviewStatus, reviewRequestedAt });

describe("statusLabel", () => {
  it.each<[string, Row, string, Tone]>([
    ["a never-submitted draft", row("draft", "unreviewed"), "Draft", "neutral"],
    ["a submitted draft", row("draft", "unreviewed", "2026-09-07"), "In review", "info"],
    [
      "a draft the reviewer bounced",
      row("draft", "disputed", "2026-09-07"),
      "Changes requested",
      "warning",
    ],
    ["an approved ticket", row("active", "reviewed"), "Live", "success"],
    [
      "a live ticket edited since approval",
      row("active", "unreviewed", "2026-09-07"),
      "Live · re-review",
      "warning",
    ],
    ["an unpublished ticket", row("suspended", "reviewed"), "Hidden", "danger"],
    ["a withdrawn ticket", row("withdrawn", "reviewed"), "Withdrawn", "danger"],
    ["a finished race", row("concluded", "reviewed"), "Concluded", "neutral"],
  ])("labels %s", (_name, input, label, tone) => {
    expect(statusLabel(input)).toEqual({ label, tone });
  });

  it.each<[string, Row, string, Tone]>([
    // request-changes keeps reviewRequestedAt set (admin-campaigns.service.ts
    // requestChanges) — "Changes requested" must win over "In review".
    ["disputed outranks the submitted stamp", row("draft", "disputed"), "Changes requested", "warning"],
    // PATCH on a non-draft re-runs reviewFlagData(), so a concluded ticket can
    // be edited back into the review queue.
    [
      "a concluded ticket edited since approval",
      row("concluded", "unreviewed", "2026-09-07"),
      "Concluded · re-review",
      "warning",
    ],
    // unpublish leaves reviewStatus untouched — suspended reads "Hidden" either way.
    ["a suspended ticket that was never reviewed", row("suspended", "unreviewed", "2026-09-07"), "Hidden", "danger"],
    ["a dissolved ticket", row("dissolved", "reviewed"), "Dissolved", "danger"],
  ])("handles the API's real edge transition: %s", (_name, input, label, tone) => {
    expect(statusLabel(input)).toEqual({ label, tone });
  });
});

describe("seatStateCode", () => {
  const STATES = ["abia", "akwa_ibom", "cross_river", "bayelsa", "imo", "lagos"];

  it.each<[string, string, string[], string]>([
    ["an LGA code", "abia_aba_north", STATES, "abia"],
    // State codes contain underscores — splitting on "_" would answer "akwa".
    ["an LGA in a two-word state", "akwa_ibom_eastern_obolo", STATES, "akwa_ibom"],
    ["a senatorial district", "sen_abia_abia_north", STATES, "abia"],
    ["a federal constituency", "fed_cross_river_calabar", STATES, "cross_river"],
    ["a state constituency", "state_bayelsa_brass_1", STATES, "bayelsa"],
    ["an upper-cased code", "STATE_IMO_AHIAZU", STATES, "imo"],
    // Longest prefix wins: "cross" also matches, but "cross_river" is the owner.
    ["an ambiguous prefix", "cross_river_akamkpa", ["cross", "cross_river"], "cross_river"],
    ["a bare state code", "lagos", STATES, "lagos"],
  ])("resolves %s", (_name, code, states, expected) => {
    expect(seatStateCode(code, states)).toBe(expected);
  });

  it.each<[string, string | null]>([
    ["null", null],
    ["an empty string", ""],
    ["a state that is not in the list", "sen_zamfara_north"],
  ])("returns null for %s", (_name, code) => {
    expect(seatStateCode(code, STATES)).toBeNull();
  });
});
