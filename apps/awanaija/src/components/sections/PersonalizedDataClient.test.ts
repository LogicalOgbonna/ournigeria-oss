import { test } from "node:test";
import assert from "node:assert/strict";
import {
  transformProfileData,
  toLocalOfficial,
  localContextSubtitle,
} from "./PersonalizedDataClient";

/**
 * The office lines the cards print are scoped to the viewer's place
 * ("Executive Governor, Abia State", "Chairman Ikwuano LGA"), so they are NOT
 * stable identifiers. The "Help us identify them" deep link must key off the
 * row's `seat` discriminator instead — keying off the printed role silently
 * drops `role=` from the href and dumps the citizen on a blank seat picker.
 */

const WHERE = {
  stateCode: "abia",
  stateName: "Abia",
  lgaCode: "ikwuano",
  lgaName: "Ikwuano",
  wardCode: "ariam",
  wardName: "Ariam",
};

/** An empty profile: every seat comes back as a missing row. */
function missingOfficials(stateName = "Abia", lgaName = "Ikwuano") {
  const data = transformProfileData(
    "abia",
    stateName,
    "ikwuano",
    lgaName,
    "ariam",
    "Ariam",
    null,
    null,
    null,
  );
  return data.officials.map((row) =>
    toLocalOfficial(row, { ...WHERE, stateName, lgaName }),
  );
}

function roleParam(href: string | undefined): string | null {
  assert.ok(href, "missing seat should carry an identify href");
  return new URL(href, "https://ournigeria.ng").searchParams.get("role");
}

test("every vacant seat deep-links into the identify form with its role prefilled", () => {
  const byRole = Object.fromEntries(
    missingOfficials().map((o) => [o.role, roleParam(o.missingHref)]),
  );

  assert.deepEqual(byRole, {
    "Executive Governor, Abia State": "governor",
    Senator: "senator",
    "House of Reps": "representative",
    "State House": "mha",
    "Chairman Ikwuano LGA": "lga_chairman",
    "Ward Councillor": "councilor",
  });
});

test("the FCT's scoped office lines still resolve to governor and lga_chairman", () => {
  const officials = missingOfficials("FCT", "Bwari");
  const seats = officials.filter((o) => /Minister|Chairman/.test(o.role));

  assert.deepEqual(
    seats.map((o) => [o.role, roleParam(o.missingHref)]),
    [
      ["FCT Minister", "governor"],
      ["Chairman Bwari Area Council", "lga_chairman"],
    ],
  );
});

test("a vacant seat's Unknown line uses the unscoped seat name", () => {
  const officials = missingOfficials();
  const unknownLines = officials.map((o) => o.shortRole ?? o.role);

  assert.ok(
    unknownLines.includes("Governor"),
    "governor's Unknown line should read 'Unknown Governor', not the scoped role",
  );
  assert.ok(
    unknownLines.includes("Chairman"),
    "chairman's Unknown line should read 'Unknown Chairman', not the scoped role",
  );
});

/**
 * The section's subtitle is the permission pitch. Once a place is resolved it
 * has to stop pitching and start pointing at the data.
 */
test("the subtitle only asks for permission while no place is resolved", () => {
  const where = { state: "Abia", lga: "Ikwuano" };

  assert.match(localContextSubtitle("idle", where), /Grant location access/);
  assert.doesNotMatch(localContextSubtitle("loading", where), /Grant location access/);

  for (const state of ["success", "denied", "outside_nigeria"] as const) {
    const copy = localContextSubtitle(state, where);
    assert.doesNotMatch(
      copy,
      /Grant location access/,
      `${state} should not still be asking for the permission`,
    );
    assert.match(copy, /Ikwuano, Abia/, `${state} should name the resolved place`);
    assert.match(copy, /Dig into/, `${state} should invite exploring the data`);
  }
});
