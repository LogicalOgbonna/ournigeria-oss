import { describe, expect, it } from "vitest";
import {
  eventSpecificity,
  findSubsumingElection,
  type AttachableRow,
  type ElectionEventLite,
} from "../seed-elections";

const event = (over: Partial<ElectionEventLite> & { slug: string }): ElectionEventLite => ({
  id: over.slug,
  office: "presidential",
  year: 2027,
  round: "general",
  stateCode: null,
  constituencyCode: null,
  lgaCode: null,
  wardCode: null,
  excludedStates: [],
  ...over,
});

const row = (over: Partial<AttachableRow> = {}): AttachableRow => ({
  electionType: "presidential",
  year: 2027,
  stateCode: null,
  constituencyCode: null,
  lgaCode: null,
  wardCode: null,
  ...over,
});

describe("findSubsumingElection (D10.1)", () => {
  it("attaches an all-null-scope row to the nationwide event of same office+year", () => {
    const nationwide = event({ slug: "2027-presidential" });
    expect(findSubsumingElection(row(), [nationwide])).toEqual({ kind: "attach", event: nationwide });
  });

  it("never matches across office or year — 'other' has no event office", () => {
    const nationwide = event({ slug: "2027-presidential" });
    expect(findSubsumingElection(row({ electionType: "gubernatorial" }), [nationwide])).toEqual({ kind: "none" });
    expect(findSubsumingElection(row({ electionType: "other" }), [nationwide])).toEqual({ kind: "none" });
    expect(findSubsumingElection(row({ year: 2026 }), [nationwide])).toEqual({ kind: "none" });
  });

  it("non-general rounds never auto-attach", () => {
    const rerun = event({ slug: "2027-presidential-rerun", round: "rerun" });
    const supplementary = event({ slug: "2027-presidential-supp", round: "supplementary" });
    expect(findSubsumingElection(row(), [rerun, supplementary])).toEqual({ kind: "none" });
  });

  it("a scoped event subsumes a row with the same scope value", () => {
    const osun = event({ slug: "2026-osun-gubernatorial", office: "gubernatorial", year: 2026, stateCode: "osun" });
    const match = row({ electionType: "gubernatorial", year: 2026, stateCode: "osun" });
    expect(findSubsumingElection(match, [osun])).toEqual({ kind: "attach", event: osun });
    // ...and never a row in a different state, or a broader (null-state) row.
    expect(findSubsumingElection({ ...match, stateCode: "ekiti" }, [osun])).toEqual({ kind: "none" });
    expect(findSubsumingElection({ ...match, stateCode: null }, [osun])).toEqual({ kind: "none" });
  });

  it("a nationwide event subsumes a constituency-scoped row of the same office", () => {
    const senate = event({ slug: "2027-senatorial", office: "senatorial" });
    const outcome = findSubsumingElection(
      row({ electionType: "senatorial", stateCode: "abia", constituencyCode: "sen_abia_central" }),
      [senate],
    );
    expect(outcome).toEqual({ kind: "attach", event: senate });
  });

  it("respects excluded states — only when the row HAS a state", () => {
    const senate = event({ slug: "2027-senatorial", office: "senatorial", excludedStates: ["abia"] });
    expect(
      findSubsumingElection(row({ electionType: "senatorial", stateCode: "abia", constituencyCode: "sen_abia_central" }), [senate]),
    ).toEqual({ kind: "none" });
    // A stateless row cannot be carved out by a state exclusion.
    expect(findSubsumingElection(row({ electionType: "senatorial" }), [senate])).toEqual({
      kind: "attach",
      event: senate,
    });
  });

  it("tiebreaks on specificity: narrowest subsuming event wins", () => {
    const nationwide = event({ slug: "2027-gov-nationwide", office: "gubernatorial" });
    const scoped = event({ slug: "2027-osun-gubernatorial", office: "gubernatorial", stateCode: "osun" });
    const outcome = findSubsumingElection(row({ electionType: "gubernatorial", stateCode: "osun" }), [
      nationwide,
      scoped,
    ]);
    expect(outcome).toEqual({ kind: "attach", event: scoped });
  });

  it("ranks constituency above lga (ward > constituency > lga > state)", () => {
    const byLga = event({ slug: "by-lga", office: "state_assembly", lgaCode: "osun/ede-north" });
    const byConstituency = event({ slug: "by-const", office: "state_assembly", constituencyCode: "sha_osun_ede" });
    const both = row({
      electionType: "state_assembly",
      stateCode: "osun",
      constituencyCode: "sha_osun_ede",
      lgaCode: "osun/ede-north",
    });
    expect(findSubsumingElection(both, [byLga, byConstituency])).toEqual({ kind: "attach", event: byConstituency });
    expect(eventSpecificity(byConstituency)).toBeGreaterThan(eventSpecificity(byLga));
  });

  it("two subsuming events at the same specificity are ambiguous, both listed", () => {
    const bare = event({ slug: "by-const-bare", office: "senatorial", constituencyCode: "sen_abia_central" });
    const withState = event({
      slug: "by-const-state",
      office: "senatorial",
      stateCode: "abia",
      constituencyCode: "sen_abia_central",
    });
    const outcome = findSubsumingElection(
      row({ electionType: "senatorial", stateCode: "abia", constituencyCode: "sen_abia_central" }),
      [bare, withState],
    );
    expect(outcome.kind).toBe("ambiguous");
    if (outcome.kind === "ambiguous") {
      expect(outcome.events.map((e) => e.slug).sort()).toEqual(["by-const-bare", "by-const-state"]);
    }
  });

  it("a ward-scoped event never subsumes a campaign-shaped row (no ward column)", () => {
    const wardEvent = event({
      slug: "2027-ward-councilor",
      office: "councilor",
      stateCode: "osun",
      lgaCode: "osun/ede-north",
      wardCode: "osun/ede-north/ward-1",
    });
    // Campaign rows always carry wardCode: null.
    const campaignShaped = row({ electionType: "councilor", stateCode: "osun", lgaCode: "osun/ede-north" });
    expect(findSubsumingElection(campaignShaped, [wardEvent])).toEqual({ kind: "none" });
    // The same event DOES subsume an official_elections row with the ward.
    const participation = { ...campaignShaped, wardCode: "osun/ede-north/ward-1" };
    expect(findSubsumingElection(participation, [wardEvent])).toEqual({ kind: "attach", event: wardEvent });
  });
});
