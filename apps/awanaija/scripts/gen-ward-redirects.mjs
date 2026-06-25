// Generates ward-redirects.generated.json from the INEC resync reconciliation plan.
//
// Source of truth: .agent/research/ward-inec-verification/prod-migration/reconcile_plan.csv
// (committed by the resync, commit 88e1e1b). We emit 301/308 redirects ONLY for ops that
// have a known successor URL:
//   - `rename`     : old ward slug -> new ward slug
//   - `lga_rename` : old LGA path  -> new LGA path (+ /:ward* wildcard for its wards)
// `delete` ops (the majority — e.g. the Ibadan place-name wards) have NO successor and are
// intentionally NOT listed here; the ward page's in-page fallback redirects them to their LGA.
//
// Every candidate is VALIDATED against prod (source must 404, destination must 200) so a
// wrong slug derivation can never ship a broken redirect — unvalidated ones simply fall
// through to the in-page LGA fallback.
//
// Run:  node apps/awanaija/scripts/gen-ward-redirects.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../..");
const CSV = path.join(REPO, ".agent/research/ward-inec-verification/prod-migration/reconcile_plan.csv");
const OUT = path.resolve(__dirname, "../ward-redirects.generated.json");
const SITE = "https://ournigeria.ng";

// Mirror apps/awanaija/src/app/sitemap.ts slugify exactly.
const slugify = (s) => encodeURIComponent(String(s).toLowerCase().replace(/\s+/g, "-"));
const wardSlug = (name) => slugify(String(name).split("/")[0].trim());
const stateSlug = (state) => state.replace(/_/g, "-");
const lgaSlug = (state, lgaCode) =>
  (lgaCode.startsWith(state + "_") ? lgaCode.slice(state.length + 1) : lgaCode).replace(/_/g, "-");

function parseCsv(text) {
  return text
    .replace(/\r/g, "")
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.split(","))
    .map(([op, state, lga_code, code, from, to]) => ({ op, state, lga_code, code, from, to }));
}

// Build candidate redirects (no validation yet).
function buildCandidates(rows) {
  const out = [];
  for (const r of rows) {
    const st = stateSlug(r.state);
    if (r.op === "rename" && r.from && r.to) {
      const lga = lgaSlug(r.state, r.lga_code);
      const source = `/states/${st}/${lga}/${wardSlug(r.from)}`;
      const destination = `/states/${st}/${lga}/${wardSlug(r.to)}`;
      if (source !== destination) out.push({ kind: "ward", source, destination });
    } else if (r.op === "lga_rename" && r.from && r.to) {
      const source = `/states/${st}/${slugify(r.from)}`;
      const destination = `/states/${st}/${slugify(r.to)}`;
      if (source !== destination) out.push({ kind: "lga", source, destination });
    }
  }
  return out;
}

async function status(url, method = "HEAD") {
  try {
    const r = await fetch(SITE + url, { method, redirect: "manual" });
    if (r.status === 405 && method === "HEAD") return status(url, "GET");
    return r.status;
  } catch {
    return 0;
  }
}

async function validate(candidates) {
  const kept = [];
  let i = 0,
    sourceOk = 0,
    destOk = 0;
  async function worker() {
    while (i < candidates.length) {
      const c = candidates[i++];
      const [s, d] = await Promise.all([status(c.source), status(c.destination)]);
      const srcGone = s === 404 || s === 410;
      const dstLive = d >= 200 && d < 300;
      if (srcGone) sourceOk++;
      if (dstLive) destOk++;
      if (srcGone && dstLive) kept.push(c);
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  return { kept, sourceOk, destOk };
}

(async () => {
  if (!fs.existsSync(CSV)) {
    console.error("reconcile_plan.csv not found at", CSV);
    process.exit(1);
  }
  const rows = parseCsv(fs.readFileSync(CSV, "utf8"));
  let candidates = buildCandidates(rows);

  // Loop guard: drop any redirect whose destination is itself a source.
  const sources = new Set(candidates.map((c) => c.source));
  const before = candidates.length;
  candidates = candidates.filter((c) => !sources.has(c.destination));
  const loopDropped = before - candidates.length;

  console.log(`candidates: ${candidates.length} (loop-guard dropped ${loopDropped})`);
  console.log("validating against prod (source 404 + dest 200)...");
  const { kept, sourceOk, destOk } = await validate(candidates);

  const redirects = [];
  for (const c of kept) {
    redirects.push({ source: c.source, destination: c.destination, permanent: true });
    if (c.kind === "lga") {
      // Also redirect every ward under the renamed LGA.
      redirects.push({ source: `${c.source}/:ward*`, destination: `${c.destination}/:ward*`, permanent: true });
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(redirects, null, 2) + "\n");
  console.log(
    `validated: source-gone ${sourceOk}/${candidates.length}, dest-live ${destOk}/${candidates.length}`
  );
  console.log(`wrote ${redirects.length} redirect rules -> ${path.relative(REPO, OUT)}`);
})();
