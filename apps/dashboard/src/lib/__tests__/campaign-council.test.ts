import { describe, expect, it } from "vitest";
import {
  canUploadCouncilPhoto,
  endReasonLabel,
  initials,
  isEmptyPatch,
  isoDateInput,
  memberCreateBody,
  memberFormOf,
  memberPatchBody,
  memberProblems,
  parseOrder,
  roleCreateBody,
  roleFormOf,
  rolePatchBody,
  roleProblems,
  sortCouncil,
  type MemberFormValues,
} from "../campaign-council";
import type { CouncilMember } from "../campaigns";

const member = (over: Partial<CouncilMember> = {}): CouncilMember => ({
  id: "11111111-1111-1111-1111-111111111111",
  roleCode: "campaign_manager",
  officialId: null,
  name: "Ada Obi",
  imageUrl: null,
  scopeLevel: "national",
  stateCode: null,
  lgaCode: null,
  status: "active",
  endReason: null,
  startDate: null,
  endDate: null,
  displayOrder: 0,
  role: { code: "campaign_manager", label: "Campaign Manager" },
  official: null,
  ...over,
});

describe("parseOrder / isoDateInput / initials", () => {
  it("takes whole numbers only", () => {
    expect(parseOrder("0")).toBe(0);
    expect(parseOrder(" 12 ")).toBe(12);
    expect(parseOrder("")).toBeNull();
    expect(parseOrder("-1")).toBeNull();
    expect(parseOrder("1.5")).toBeNull();
    expect(parseOrder("abc")).toBeNull();
  });

  it("slices the stored timestamp rather than going through Date", () => {
    // A UTC-midnight date read in a timezone west of UTC would be the previous
    // day through `new Date(...).getDate()`.
    expect(isoDateInput("2026-01-01T00:00:00.000Z")).toBe("2026-01-01");
    expect(isoDateInput(null)).toBe("");
  });

  it("takes at most two initials", () => {
    expect(initials("Ada Grace Obi")).toBe("AG");
    expect(initials("")).toBe("");
  });
});

describe("endReasonLabel", () => {
  it("names the five enumerated reasons and degrades for anything new", () => {
    expect(endReasonLabel("campaign_ended")).toBe("Campaign ended");
    expect(endReasonLabel("resigned")).toBe("Resigned");
    expect(endReasonLabel("some_new_reason")).toBe("some new reason");
    expect(endReasonLabel(null)).toBe("Ended");
    // A member that never ended has no reason at all.
    expect(endReasonLabel(undefined)).toBe("Ended");
  });
});

describe("roleProblems", () => {
  const ok = {
    code: "state_director",
    label: "State Director",
    sortOrder: "10",
    isActive: true,
  };

  it("passes a well-formed row", () => {
    expect(roleProblems(ok, { checkCode: true })).toEqual({});
  });

  it("applies the API's code regex and rejects a duplicate", () => {
    expect(roleProblems({ ...ok, code: "State Director" }, { checkCode: true }).code).toMatch(
      /Lower-case letters/,
    );
    expect(roleProblems({ ...ok, code: "1abc" }, { checkCode: true }).code).toMatch(
      /Lower-case letters/,
    );
    // A single letter is one character; the regex demands at least two.
    expect(roleProblems({ ...ok, code: "a" }, { checkCode: true }).code).toMatch(
      /Lower-case letters/,
    );
    expect(
      roleProblems({ ...ok, code: "state_director" }, {
        checkCode: true,
        taken: ["state_director"],
      }).code,
    ).toBe("That code already exists.");
  });

  it("accepts a 60-character code and rejects 61 (the API's /^[a-z][a-z0-9_]{1,59}$/)", () => {
    const sixty = `a${"b".repeat(59)}`;
    expect(sixty).toHaveLength(60);
    expect(roleProblems({ ...ok, code: sixty }, { checkCode: true }).code).toBeUndefined();
    expect(
      roleProblems({ ...ok, code: `${sixty}c` }, { checkCode: true }).code,
    ).toMatch(/Lower-case letters/);
  });

  it("does not check the code when editing an existing role", () => {
    expect(roleProblems({ ...ok, code: "NOT VALID" })).toEqual({});
  });

  it("bounds the label and the sort order", () => {
    expect(roleProblems({ ...ok, label: "A" }).label).toMatch(/at least 2/);
    expect(roleProblems({ ...ok, label: "x".repeat(101) }).label).toMatch(/at most 100/);
    expect(roleProblems({ ...ok, sortOrder: "1001" }).sortOrder).toMatch(/between 0 and 1000/);
    expect(roleProblems({ ...ok, sortOrder: "-2" }).sortOrder).toMatch(/between 0 and 1000/);
    // Empty is allowed — the create body falls back to 0.
    expect(roleProblems({ ...ok, sortOrder: "" }).sortOrder).toBeUndefined();
  });
});

describe("role bodies", () => {
  it("trims and defaults the sort order on create", () => {
    expect(
      roleCreateBody({
        code: " comms_lead ",
        label: " Comms Lead ",
        sortOrder: "",
        isActive: true,
      }),
    ).toEqual({ code: "comms_lead", label: "Comms Lead", sortOrder: 0 });
  });

  it("sends only what moved on patch", () => {
    const base = { label: "Comms Lead", sortOrder: 5, isActive: true };
    const form = { code: "x", label: "Comms Lead", sortOrder: "5", isActive: true };
    expect(rolePatchBody(form, base)).toEqual({});
    expect(rolePatchBody({ ...form, label: "Comms Chief" }, base)).toEqual({
      label: "Comms Chief",
    });
    expect(rolePatchBody({ ...form, sortOrder: "7" }, base)).toEqual({ sortOrder: 7 });
    expect(rolePatchBody({ ...form, isActive: false }, base)).toEqual({ isActive: false });
    // An emptied sort box is 0, not "leave it".
    expect(rolePatchBody({ ...form, sortOrder: "" }, base)).toEqual({ sortOrder: 0 });
  });

  it("round-trips a catalog row through roleFormOf", () => {
    const role = { code: "comms_lead", label: "Comms Lead", sortOrder: 5, isActive: false };
    expect(rolePatchBody(roleFormOf(role), role)).toEqual({});
  });
});

describe("memberProblems", () => {
  const base: MemberFormValues = {
    person: { name: "Ada Obi" },
    roleCode: "campaign_manager",
    scopeLevel: "national",
    stateCode: null,
    lgaCode: null,
    startDate: "",
    displayOrder: "",
  };

  it("passes a national member with a typed name", () => {
    expect(memberProblems(base)).toEqual({});
  });

  it("demands a person and a role", () => {
    expect(memberProblems({ ...base, person: null }).person).toMatch(/Pick an official/);
    expect(memberProblems({ ...base, person: { name: "A" } }).person).toMatch(/at least 2/);
    expect(memberProblems({ ...base, roleCode: "" }).roleCode).toBe("Pick a role.");
  });

  it("does not check the name length of a linked official", () => {
    // The official's own row supplies the name; the picker's label is display only.
    expect(
      memberProblems({ ...base, person: { officialId: "abc", name: "X" } }),
    ).toEqual({});
  });

  it("demands the scope code the level needs", () => {
    expect(memberProblems({ ...base, scopeLevel: "state" }).stateCode).toBe("Pick a state.");
    expect(memberProblems({ ...base, scopeLevel: "lga" }).lgaCode).toBe("Pick an LGA.");
    expect(
      memberProblems({ ...base, scopeLevel: "state", stateCode: "kano" }),
    ).toEqual({});
  });

  it("checks the date shape and the display order", () => {
    expect(memberProblems({ ...base, startDate: "01/02/2026" }).startDate).toBe("Use YYYY-MM-DD.");
    expect(memberProblems({ ...base, startDate: "2026-02-01" }).startDate).toBeUndefined();
    expect(memberProblems({ ...base, displayOrder: "-1" }).displayOrder).toMatch(/Whole number/);
  });
});

describe("memberCreateBody", () => {
  const base: MemberFormValues = {
    person: { name: "  Ada Obi  " },
    roleCode: "campaign_manager",
    scopeLevel: "national",
    stateCode: null,
    lgaCode: null,
    startDate: "",
    displayOrder: "",
  };

  it("sends a trimmed name for an unlinked person and no scope codes", () => {
    expect(memberCreateBody(base)).toEqual({
      roleCode: "campaign_manager",
      scopeLevel: "national",
      name: "Ada Obi",
    });
  });

  it("sends officialId ALONE for a linked official (the API ignores a name there)", () => {
    expect(
      memberCreateBody({ ...base, person: { officialId: "off-1", name: "Ada Obi" } }),
    ).toEqual({
      roleCode: "campaign_manager",
      scopeLevel: "national",
      officialId: "off-1",
    });
  });

  it("sends stateCode for a state member and only lgaCode for an LGA member", () => {
    expect(
      memberCreateBody({ ...base, scopeLevel: "state", stateCode: "kano" }),
    ).toMatchObject({ scopeLevel: "state", stateCode: "kano" });
    const lga = memberCreateBody({
      ...base,
      scopeLevel: "lga",
      stateCode: "kano",
      lgaCode: "kano_dala",
    });
    expect(lga).toMatchObject({ scopeLevel: "lga", lgaCode: "kano_dala" });
    expect(lga).not.toHaveProperty("stateCode");
  });

  it("adds startDate, displayOrder and reason only when present", () => {
    expect(
      memberCreateBody({ ...base, startDate: "2026-03-01", displayOrder: "3" }, "Adding comms lead"),
    ).toEqual({
      roleCode: "campaign_manager",
      scopeLevel: "national",
      name: "Ada Obi",
      startDate: "2026-03-01",
      displayOrder: 3,
      reason: "Adding comms lead",
    });
  });
});

describe("memberPatchBody", () => {
  it("is empty when nothing moved", () => {
    const row = member();
    expect(memberPatchBody(memberFormOf(row), row)).toEqual({});
    expect(isEmptyPatch(memberPatchBody(memberFormOf(row), row, "why"))).toBe(true);
  });

  it("never sends a name for a member that stays linked to an official", () => {
    // The API 400s on `name` alongside a kept officialId.
    const row = member({ officialId: "off-1", name: "Ada Obi" });
    const form = { ...memberFormOf(row), person: { officialId: "off-1", name: "Renamed" } };
    expect(memberPatchBody(form, row)).toEqual({});
  });

  it("sends officialId and name when unlinking — the photo leaves with the official", () => {
    // A linked member's imageUrl was copied off the official by resolvePerson,
    // so echoing it would keep that official's face on a person no longer
    // connected to them. No imageUrl key at all: resolvePerson resolves it to
    // null, which is what the row should now hold.
    const row = member({
      officialId: "off-1",
      name: "Ada Obi",
      imageUrl: "https://cdn.ournigeria.ng/a.webp",
      official: { id: "off-1", slug: null, name: "Ada Obi", imageUrl: "https://cdn.ournigeria.ng/a.webp" },
    });
    const form = { ...memberFormOf(row), person: { name: " Ada O. " } };
    expect(memberPatchBody(form, row)).toEqual({ officialId: null, name: "Ada O." });
  });

  it("does not echo a linked member's EXTERNAL photo url on unlink", () => {
    // resolvePerson would 400 on a url it did not store; the unlink must not
    // manufacture that failure out of an official's hotlinked portrait.
    const row = member({
      officialId: "off-1",
      name: "Ada Obi",
      imageUrl: "https://example.com/not-ours.jpg",
      official: { id: "off-1", slug: null, name: "Ada Obi", imageUrl: "https://example.com/not-ours.jpg" },
    });
    const body = memberPatchBody({ ...memberFormOf(row), person: { name: "Ada O." } }, row);
    expect(body).toEqual({ officialId: null, name: "Ada O." });
    expect(body).not.toHaveProperty("imageUrl");
  });

  it("sends officialId alone when linking an unlinked member", () => {
    const row = member();
    const form = { ...memberFormOf(row), person: { officialId: "off-9", name: "Ada Obi" } };
    expect(memberPatchBody(form, row)).toEqual({ officialId: "off-9" });
  });

  it("keeps an unlinked member's uploaded portrait when they are linked", () => {
    // resolvePerson resolves a linked person's photo as
    // `body.imageUrl ?? official.imageUrl ?? null`, so linking to an official
    // with no photo of their own would blank the uploaded one.
    const row = member({ imageUrl: "https://cdn.ournigeria.ng/a.webp" });
    const form = { ...memberFormOf(row), person: { officialId: "off-9", name: "Ada Obi" } };
    expect(memberPatchBody(form, row)).toEqual({
      officialId: "off-9",
      imageUrl: "https://cdn.ournigeria.ng/a.webp",
    });
  });

  it("does not echo an imageUrl when re-linking a member who is already linked", () => {
    // A linked row's imageUrl is the official's; re-sending it is at best a
    // no-op and at worst an external url resolvePerson would 400 on.
    const row = member({
      officialId: "off-1",
      name: "Ada Obi",
      imageUrl: "https://example.com/not-ours.jpg",
      official: { id: "off-1", slug: null, name: "Ada Obi", imageUrl: "https://example.com/not-ours.jpg" },
    });
    const form = { ...memberFormOf(row), person: { officialId: "off-9", name: "Bola A." } };
    expect(memberPatchBody(form, row)).toEqual({ officialId: "off-9" });
  });

  it("renames an unlinked member without dropping their uploaded portrait", () => {
    // resolvePerson rebuilds imageUrl from the body alone: a bare `name` would
    // null a photo committed through POST /council/:id/photo.
    const row = member({ imageUrl: "https://cdn.ournigeria.ng/a.webp" });
    const form = { ...memberFormOf(row), person: { name: "Ada Grace Obi" } };
    expect(memberPatchBody(form, row)).toEqual({
      name: "Ada Grace Obi",
      imageUrl: "https://cdn.ournigeria.ng/a.webp",
    });
    // A member with no photo still sends the key; null is what was there.
    expect(memberPatchBody({ ...memberFormOf(member()), person: { name: "X Y" } }, member())).toEqual(
      { name: "X Y", imageUrl: null },
    );
  });

  it("sends all three scope columns whenever the scope moves", () => {
    const row = member();
    expect(
      memberPatchBody({ ...memberFormOf(row), scopeLevel: "state", stateCode: "kano" }, row),
    ).toEqual({ scopeLevel: "state", stateCode: "kano", lgaCode: null });

    const state = member({ scopeLevel: "state", stateCode: "kano" });
    expect(
      memberPatchBody({ ...memberFormOf(state), stateCode: "lagos" }, state),
    ).toEqual({ scopeLevel: "state", stateCode: "lagos", lgaCode: null });
    // Back to national clears both codes.
    expect(
      memberPatchBody(
        { ...memberFormOf(state), scopeLevel: "national", stateCode: "kano" },
        state,
      ),
    ).toEqual({ scopeLevel: "national", stateCode: null, lgaCode: null });
  });

  it("carries the link change and the scope move in one body", () => {
    const row = member();
    expect(
      memberPatchBody(
        {
          ...memberFormOf(row),
          person: { officialId: "off-9", name: "Someone Else" },
          scopeLevel: "state",
          stateCode: "kano",
        },
        row,
      ),
    ).toEqual({
      officialId: "off-9",
      scopeLevel: "state",
      stateCode: "kano",
      lgaCode: null,
    });
  });

  it("leaves the scope alone when only the role moved", () => {
    const state = member({ scopeLevel: "state", stateCode: "kano" });
    expect(memberPatchBody({ ...memberFormOf(state), roleCode: "comms_lead" }, state)).toEqual({
      roleCode: "comms_lead",
    });
  });

  it("clears a start date with an explicit null", () => {
    const row = member({ startDate: "2026-03-01T00:00:00.000Z" });
    expect(memberPatchBody({ ...memberFormOf(row), startDate: "" }, row)).toEqual({
      startDate: null,
    });
    expect(memberPatchBody(memberFormOf(row), row)).toEqual({});
  });

  it("treats an emptied display-order box as 0", () => {
    const row = member({ displayOrder: 4 });
    expect(memberPatchBody({ ...memberFormOf(row), displayOrder: "" }, row)).toEqual({
      displayOrder: 0,
    });
  });

  it("appends the reason to a real change", () => {
    const row = member();
    expect(
      memberPatchBody({ ...memberFormOf(row), roleCode: "comms_lead" }, row, "Reshuffle"),
    ).toEqual({ roleCode: "comms_lead", reason: "Reshuffle" });
  });
});

describe("sortCouncil", () => {
  const order = (code: string) => ({ chair: 0, deputy: 10, aide: 20 })[code] ?? 999;

  it("puts ended members last, then displayOrder, then the role catalog order", () => {
    const rows = [
      { id: "d", status: "active", displayOrder: 0, roleCode: "aide", name: "Zed" },
      { id: "e", status: "ended", displayOrder: 0, roleCode: "chair", name: "Gone" },
      { id: "b", status: "active", displayOrder: 0, roleCode: "deputy", name: "Bola" },
      { id: "a", status: "active", displayOrder: 0, roleCode: "chair", name: "Ada" },
      { id: "c", status: "active", displayOrder: 1, roleCode: "chair", name: "Chidi" },
    ];
    expect(sortCouncil(rows, order).map((r) => r.id)).toEqual(["a", "b", "d", "c", "e"]);
  });

  it("sorts a role the catalog no longer lists after every known one", () => {
    // The tab hands sortCouncil a lookup that returns MAX_SAFE_INTEGER for an
    // unknown code, so a retired role sinks instead of jumping to the top.
    const lookup = (code: string) =>
      ({ chair: 0, deputy: 10, aide: 20 })[code] ?? Number.MAX_SAFE_INTEGER;
    const rows = [
      { id: "gone", status: "active", displayOrder: 0, roleCode: "retired", name: "Ada" },
      { id: "aide", status: "active", displayOrder: 0, roleCode: "aide", name: "Zed" },
      { id: "chair", status: "active", displayOrder: 0, roleCode: "chair", name: "Bola" },
    ];
    expect(sortCouncil(rows, lookup).map((r) => r.id)).toEqual(["chair", "aide", "gone"]);
  });

  it("falls back to the name and does not mutate its input", () => {
    const rows = [
      { status: "active", displayOrder: 0, roleCode: "chair", name: "Bola" },
      { status: "active", displayOrder: 0, roleCode: "chair", name: "Ada" },
    ];
    expect(sortCouncil(rows, order).map((r) => r.name)).toEqual(["Ada", "Bola"]);
    expect(rows[0].name).toBe("Bola");
  });
});

describe("canUploadCouncilPhoto", () => {
  it("allows a name-only member", () => {
    expect(canUploadCouncilPhoto({ officialId: null, official: null })).toBe(true);
  });

  it("refuses a linked official who already has a portrait", () => {
    expect(
      canUploadCouncilPhoto({ officialId: "off-1", official: { imageUrl: "https://x/a.webp" } }),
    ).toBe(false);
  });

  it("allows a linked official with no portrait — the ticket falls back to this one", () => {
    expect(canUploadCouncilPhoto({ officialId: "off-1", official: { imageUrl: null } })).toBe(true);
    expect(canUploadCouncilPhoto({ officialId: "off-1", official: null })).toBe(true);
  });
});
