#!/usr/bin/env npx tsx
import {
  buildIdentifyUrl, IDENTIFY_TEMPLATES, fillTemplate, pickTemplate,
} from "../src/identify/identify-content.js";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
}

const u = buildIdentifyUrl({ role: "mha", stateCode: "lagos", constituencyCode: "lagos-ac-01", level: "constituency" });
assert(u.startsWith("https://ournigeria.ng/proposals/new?"), "base");
const q = new URL(u).searchParams;
assert(q.get("role") === "mha", "role");
assert(q.get("stateCode") === "lagos", "stateCode");
assert(q.get("constituencyCode") === "lagos-ac-01", "constituencyCode");
assert(q.get("utm_source") === "x", "utm_source");
assert(q.get("utm_medium") === "social", "utm_medium");
assert(q.get("utm_campaign") === "identify_cta", "utm_campaign");
assert(q.get("utm_content") === "constituency", "utm_content");

for (const cat of ["councilor", "lga_chairman", "mha"] as const) {
  assert(IDENTIFY_TEMPLATES[cat].length >= 4, `${cat} >=4 variants`);
}

const filled = fillTemplate(IDENTIFY_TEMPLATES.lga_chairman[0], {
  ward: "", lga: "Ikeja", constituency: "", state: "Lagos", url: u,
});
assert(!/\{[a-z]+\}/.test(filled), "no leftover placeholders");
assert(filled.includes("Ikeja") && filled.includes(u), "values substituted");

const t0 = pickTemplate("mha", 0), t1 = pickTemplate("mha", 1);
assert(t0 !== t1 || IDENTIFY_TEMPLATES.mha.length === 1, "slot varies variant");

console.log("identify-content checks ✅");
