import assert from "node:assert";
import {
  buildProposalVerifyUrl, fillVerifyTemplate, pickVerifyTemplate,
  humanizeField, humanizeRole, composeGeo, VERIFY_TEMPLATES, VERIFY_PLACEHOLDERS,
} from "../src/verify/verify-content.js";

// ── URL builder (unchanged behaviour) ──────────────────────────────────────
const iu = buildProposalVerifyUrl({
  kind: "identify", role: "councilor", stateCode: "lagos",
  lgaCode: "lagos-mainland", wardCode: "ward-3", level: "ward",
});
assert(iu.startsWith("https://ournigeria.ng/proposals/new?"), "identify base");
assert(iu.includes("utm_campaign=confirm_cta"), "identify confirm_cta");
assert(iu.includes("utm_content=ward"), "identify utm_content=ward");
assert(iu.includes("role=councilor") && iu.includes("wardCode=ward-3"), "identify seat codes");

const cu = buildProposalVerifyUrl({ kind: "change", slug: "vtest-eze-udeh" });
assert(cu.startsWith("https://ournigeria.ng/officials/vtest-eze-udeh?"), "change base");
assert(cu.includes("utm_campaign=confirm_cta") && cu.includes("utm_content=official"), "change utms");

// ── field / role labels ────────────────────────────────────────────────────
assert(humanizeField("partyAcronym") === "Political Party", "party label");
assert(humanizeField("name") === "Name", "name label");
assert.equal(humanizeRole("mha"), "State Assembly Member", "mha label");
assert.equal(humanizeRole("lga_chairman"), "LGA Chairman", "lga_chairman label");
assert.equal(humanizeRole("councilor"), "Ward Councillor", "councilor label");
assert.equal(humanizeRole("rep"), "House of Reps Member", "rep label");
assert.equal(humanizeRole("representative"), "House of Reps Member", "rep alias label");
assert.equal(humanizeRole("senator"), "Senator", "senator label");
assert.equal(humanizeRole("governor"), "Governor", "governor label");
assert.equal(humanizeRole("weird_new_role"), "Weird New Role", "unknown role Title Case");

// ── geo composition by level ───────────────────────────────────────────────
assert.equal(
  composeGeo({ level: "constituency", constituencyName: "Pategi", stateName: "Kwara" }),
  "Pategi, Kwara", "constituency geo");
assert.equal(
  composeGeo({ level: "lga", lgaName: "Ilorin West", stateName: "Kwara" }),
  "Ilorin West LGA, Kwara", "lga geo");
assert.equal(
  composeGeo({ level: "ward", wardName: "Alanamu", lgaName: "Ilorin West", stateName: "Kwara" }),
  "Alanamu, Ilorin West LGA, Kwara", "ward geo");
assert.equal(
  composeGeo({ level: "constituency", constituencyName: "Pategi" }),
  "Pategi", "geo drops missing state");
assert.equal(composeGeo({ level: "constituency" }), "", "geo empty when nothing resolves");

// ── granular slots substitute; no leftover braces ──────────────────────────
const it = fillVerifyTemplate(pickVerifyTemplate("identify", 0), {
  claim: "", name: "Musa Abdullahi Pategi", party: "APC",
  role: "State Assembly Member", geo: "Pategi, Kwara",
  fieldLabel: "", value: "", url: iu,
});
assert(it.includes("Musa Abdullahi Pategi") && it.includes("APC"), "identify name+party");
assert(it.includes("State Assembly Member") && it.includes("Pategi, Kwara"), "identify role+geo");
assert(it.includes(iu) && !it.includes("{"), "identify fill no leftover");

const ct = fillVerifyTemplate(pickVerifyTemplate("change", 1), {
  claim: "", name: "VTEST Official", fieldLabel: humanizeField("partyAcronym"), value: "PDP", url: cu,
});
assert(ct.includes("VTEST Official") && ct.includes("Political Party") && ct.includes("PDP") && !ct.includes("{"), "change fill");

// ── variant count + deterministic rotation ─────────────────────────────────
assert.equal(VERIFY_TEMPLATES.identify.length, 5, "5 identify variants");
const seen = new Set(Array.from({ length: 20 }, (_, s) => pickVerifyTemplate("identify", s)));
assert.equal(seen.size, 5, "all 5 identify variants reachable");
for (const k of ["identify", "change"] as const)
  for (let s = 0; s < VERIFY_TEMPLATES[k].length; s++)
    assert(VERIFY_TEMPLATES[k].includes(pickVerifyTemplate(k, s)), `rotate ${k}`);

// ── placeholder allow-list (DI-free source of truth) ───────────────────────
for (const ph of ["name", "party", "role", "geo", "url"])
  assert(VERIFY_PLACEHOLDERS.has(ph), `VERIFY_PLACEHOLDERS missing {${ph}}`);

// house style: multi-line, no 👉, no em/en dash; {sourceNote} supported
for (const t of VERIFY_TEMPLATES.identify) {
  assert(t.includes("\n\n"), `identify template must be multi-line: ${t.slice(0, 40)}`);
  assert(!t.includes("👉"), "no 👉 in identify template");
  assert(!/[—–]/.test(t), "no em/en dash in identify template");
  assert(t.includes("{sourceNote}"), "identify template must carry {sourceNote}");
}
assert(VERIFY_PLACEHOLDERS.has("sourceNote"), "VERIFY_PLACEHOLDERS missing {sourceNote}");
const filledNote = fillVerifyTemplate("x {url}{sourceNote}", {
  claim: "", name: "", party: "", role: "", geo: "",
  fieldLabel: "", value: "", url: "U", sourceNote: "\n\nsrc: S",
});
assert(filledNote === "x U\n\nsrc: S", `sourceNote fill: ${JSON.stringify(filledNote)}`);

console.log("verify-content-check OK");
