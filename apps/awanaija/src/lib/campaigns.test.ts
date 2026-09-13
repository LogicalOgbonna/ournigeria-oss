import { test } from "node:test";
import assert from "node:assert/strict";
import { publicTicket, raceOf, toRailCandidate, toTicketProfile, type CampaignDetail } from "./campaigns";

/**
 * Regression: a Live senatorial ticket (austin-akobundu, Abia Central, 2027)
 * had no public page — `/elections/2027/austin-akobundu` bounced to the cycle
 * page because the resolver only accepted `electionType === "presidential"`.
 * Every public ticket the API returns must resolve; only the labels differ.
 */
function campaign(over: Partial<CampaignDetail> = {}): CampaignDetail {
  return {
    id: "db4abbf2",
    slug: "austin-akobundu",
    electionType: "senatorial",
    year: 2027,
    status: "active",
    party: { acronym: "ADC", name: "African Democratic Congress", logoUrl: null, color: "#009639" },
    candidate: { name: "Austin Akobundu", shortName: null, imageUrl: null, officialSlug: "austin-akobundu", dateOfBirth: "1956-03-10" },
    runningMate: null,
    brandColor: null,
    factionLabel: null,
    isDisputed: false,
    displayOrder: null,
    media: [],
    scope: { state: { code: "abia", name: "Abia" }, constituency: { code: "sen_abia_central", name: "Abia Central", type: "senatorial" }, lga: null },
    visionLine: null,
    fineprint: null,
    pullQuote: null,
    pullQuoteBg: null,
    candidateBio: "A bio.",
    documents: [],
    council: [],
    rivals: [],
    ...over,
  } as CampaignDetail;
}

test("a senatorial ticket resolves to a public page with senate labels and its seat", () => {
  const hit = publicTicket(campaign(), 2027);
  assert.ok(hit, "senatorial ticket must resolve, not fall to the cycle redirect");
  assert.equal(hit.ticket.id, "austin-akobundu");
  assert.equal(hit.ticket.candidate.office, "Senator");
  assert.equal(hit.ticket.mate, null);
  assert.equal(hit.candidateSlug, "austin-akobundu");
  assert.deepEqual(hit.race, raceOf(campaign()));
  assert.equal(hit.race.seat, "Abia Central");
  assert.equal(hit.race.eyebrow, "Senate");
  assert.equal(hit.race.noun, "senate race");
  // The profile's role card reads the race, not "PRESIDENTIAL".
  assert.deepEqual(hit.profile?.candidate.role, ["SENATORIAL", "(CANDIDATE)"]);
});

test("presidential tickets keep their labels and running mate", () => {
  const pres = campaign({
    slug: "tinubu-shettima",
    electionType: "presidential",
    candidate: { name: "Bola Tinubu", shortName: null, imageUrl: null, officialSlug: "bola-tinubu", dateOfBirth: null },
    runningMate: { name: "Kashim Shettima", shortName: null, imageUrl: null, officialSlug: "kashim-shettima", dateOfBirth: null },
    scope: null,
  });
  const hit = publicTicket(pres, 2027);
  assert.ok(hit);
  assert.equal(hit.ticket.candidate.office, "President");
  assert.equal(hit.ticket.mate?.office, "Vice President");
  assert.equal(hit.race.seat, null);
  assert.equal(hit.race.eyebrow, "Presidential");
  assert.equal(hit.race.noun, "presidential ticket");
  assert.deepEqual(toTicketProfile(pres)?.candidate.role, ["PRESIDENTIAL", "(CANDIDATE)"]);
  assert.deepEqual(toTicketProfile(pres)?.mate?.role, ["RUNNING MATE", "(CANDIDATE)"]);
});

test("raceOf covers every election type the API can return", () => {
  const cases: Record<string, { office: string; eyebrow: string; seat: string | null }> = {
    presidential: { office: "President", eyebrow: "Presidential", seat: null },
    gubernatorial: { office: "Governor", eyebrow: "Governorship", seat: "Abia" },
    senatorial: { office: "Senator", eyebrow: "Senate", seat: "Abia Central" },
    house_of_reps: { office: "Federal Representative", eyebrow: "House of Representatives", seat: "Abia Central" },
    state_assembly: { office: "State Assembly Member", eyebrow: "State Assembly", seat: "Abia Central" },
    lga_chairman: { office: "LGA Chairman", eyebrow: "LGA Chairmanship", seat: "Umuahia North" },
    councilor: { office: "Councilor", eyebrow: "Council", seat: "Umuahia North" },
    other: { office: "Candidate", eyebrow: "Election", seat: "Abia Central" },
  };
  for (const [electionType, want] of Object.entries(cases)) {
    const c = campaign({ electionType, scope: { state: { code: "abia", name: "Abia" }, constituency: { code: "x", name: "Abia Central", type: "senatorial" }, lga: { code: "y", name: "Umuahia North" } } });
    const race = raceOf(c);
    assert.equal(race.office, want.office, electionType);
    assert.equal(race.eyebrow, want.eyebrow, electionType);
    assert.equal(race.seat, want.seat, electionType);
    assert.equal(toRailCandidate(c).candidate.office, want.office, electionType);
  }
  // A gubernatorial ticket with a deputy carries a mate office; a senate ticket never does.
  assert.equal(raceOf(campaign({ electionType: "gubernatorial" })).mateOffice, "Deputy Governor");
  assert.equal(raceOf(campaign()).mateOffice, null);
});

test("wrong cycle still resolves to nothing", () => {
  assert.equal(publicTicket(campaign(), 2031), null);
  assert.equal(publicTicket(campaign({ year: 2031 }), 2027), null);
});
