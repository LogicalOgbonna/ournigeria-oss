import assert from "node:assert";
import {
  buildProposalVerifyUrl, fillVerifyTemplate, pickVerifyTemplate,
  humanizeField, VERIFY_TEMPLATES,
} from "../src/verify/verify-content.js";

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

assert(humanizeField("partyAcronym") === "Political Party", "party label");
assert(humanizeField("name") === "Name", "name label");

const it = fillVerifyTemplate(pickVerifyTemplate("identify", 0), {
  claim: "your councillor is Eze Udeh (APC)", name: "", fieldLabel: "", value: "", url: iu,
});
assert(it.includes("Eze Udeh (APC)") && it.includes(iu) && !it.includes("{"), "identify fill");
const ct = fillVerifyTemplate(pickVerifyTemplate("change", 1), {
  claim: "", name: "VTEST Official", fieldLabel: humanizeField("partyAcronym"), value: "PDP", url: cu,
});
assert(ct.includes("VTEST Official") && ct.includes("Political Party") && ct.includes("PDP") && !ct.includes("{"), "change fill");

for (const k of ["identify", "change"] as const)
  for (let s = 0; s < VERIFY_TEMPLATES[k].length; s++)
    assert(VERIFY_TEMPLATES[k].includes(pickVerifyTemplate(k, s)), `rotate ${k}`);

console.log("verify-content-check OK");
