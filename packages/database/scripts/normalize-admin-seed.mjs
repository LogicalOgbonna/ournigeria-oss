import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const seedDir = "/Users/arinzeogbonna/Work/personal/spending/packages/database/seed";

function readJson(name) {
  return JSON.parse(readFileSync(join(seedDir, name), "utf8"));
}

function writeJson(name, data) {
  writeFileSync(join(seedDir, name), `${JSON.stringify(data, null, 2)}\n`);
}

function normalizeRole(role) {
  if (role === "representative") {
    return "rep";
  }
  return role;
}

function inferTermKind(term) {
  if (term.code === "federal_10th_assembly") {
    return "national_assembly";
  }
  if (term.code === "fct_administration_2023" || /administration/i.test(term.name)) {
    return "administration";
  }
  if (/_gov_\d{4}$/.test(term.code) || /gubernatorial/i.test(term.name)) {
    return "governorship";
  }
  if (/_assembly_\d+(st|nd|rd|th)?$/i.test(term.code) || /state house of assembly/i.test(term.name)) {
    return "state_assembly";
  }
  if (/lga election/i.test(term.name)) {
    return "lga_election_cycle";
  }
  return "administration";
}

function withPositionMetadata(record, defaults) {
  return {
    ...record,
    position: {
      ...record.position,
      role: normalizeRole(record.position.role),
      source_type: record.position.source_type ?? defaults.source_type,
      source_url: record.position.source_url ?? defaults.source_url,
      source_date: record.position.source_date ?? defaults.source_date,
      confidence: record.position.confidence ?? defaults.confidence,
      last_verified_at: record.position.last_verified_at ?? null,
      reviewed_by: record.position.reviewed_by ?? null,
      review_status: record.position.review_status ?? defaults.review_status,
    },
  };
}

const officialFiles = [
  {
    name: "officials-governors.json",
    defaults: {
      source_type: "manual",
      source_url: null,
      source_date: null,
      confidence: "medium",
      review_status: "unreviewed",
    },
  },
  {
    name: "officials-senators.json",
    defaults: {
      source_type: "manual",
      source_url: null,
      source_date: null,
      confidence: "medium",
      review_status: "unreviewed",
    },
  },
  {
    name: "officials-reps.json",
    defaults: {
      source_type: "manual",
      source_url: null,
      source_date: null,
      confidence: "medium",
      review_status: "unreviewed",
    },
  },
  {
    name: "officials-state-assembly.json",
    defaults: {
      source_type: "manual",
      source_url: null,
      source_date: null,
      confidence: "medium",
      review_status: "unreviewed",
    },
  },
  {
    name: "officials-lga-chairmen.json",
    defaults: {
      source_type: "manual",
      source_url: null,
      source_date: null,
      confidence: "low",
      review_status: "unreviewed",
    },
  },
];

for (const file of officialFiles) {
  const data = readJson(file.name).map((record) => withPositionMetadata(record, file.defaults));
  writeJson(file.name, data);
}

const terms = readJson("political-terms.json").map((term) => ({
  ...term,
  kind: term.kind ?? inferTermKind(term),
}));
writeJson("political-terms.json", terms);

const wards = readJson("wards.json").map((ward) => ({
  ...ward,
  source_url: ward.source_url ?? null,
  source_date: ward.source_date ?? null,
  confidence: ward.confidence ?? (ward.source === "inec" ? "high" : "medium"),
}));
writeJson("wards.json", wards);

const senatorialMappings = readJson("senatorial-district-lgas.json").map((mapping) => ({
  ...mapping,
  source: mapping.source ?? "geojson",
  source_url: mapping.source_url ?? null,
  source_date: mapping.source_date ?? null,
  confidence: mapping.confidence ?? "high",
}));
writeJson("senatorial-district-lgas.json", senatorialMappings);

const constituencyWards = readJson("constituency-wards.json").map((mapping) => ({
  ...mapping,
  source: mapping.source ?? "manual",
  source_url: mapping.source_url ?? null,
  source_date: mapping.source_date ?? null,
  confidence: mapping.confidence ?? "medium",
}));
writeJson("constituency-wards.json", constituencyWards);
