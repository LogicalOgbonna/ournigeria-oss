#!/usr/bin/env npx tsx
/**
 * Generate an idempotent SQL data-migration that seeds `state_profiles` from
 * data/state-profiles.json (non-image fields) + data/state-image-manifest.json
 * (rehosted seal/flag relative paths). Idempotent via ON CONFLICT DO UPDATE so
 * it is safe under `prisma migrate deploy` on every boot.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const PROFILES = join(__dirname, "..", "data", "state-profiles.json");
const MANIFEST = join(__dirname, "..", "data", "state-image-manifest.json");

function ts(): string {
  // Pass a fixed timestamp via argv[2] for determinism; else fail loudly.
  const t = process.argv[2];
  if (!t || !/^\d{14}$/.test(t)) {
    console.error("Usage: generate-state-profiles-seed.ts <YYYYMMDDHHMMSS>");
    process.exit(1);
  }
  return t;
}

// SQL literal: 'value' with single quotes doubled, or NULL.
function s(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}
function num(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (Number.isNaN(Number(v))) throw new Error(`Non-numeric value for numeric column: ${JSON.stringify(v)}`);
  return String(v);
}
function date(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'::date`;
}

const COLS = [
  ["about", s], ["motto", s], ["date_created", date], ["land_area_sq_km", num],
  ["seal_image_url", s], ["flag_image_url", s],
  ["official_website_url", s], ["finance_ministry_url", s],
  ["assembly_website_url", s], ["inec_info_url", s],
  ["contact_address", s], ["contact_phone", s], ["contact_email", s],
  ["complaint_portal_url", s], ["whistleblower_url", s],
  ["twitter_url", s], ["facebook_url", s], ["instagram_url", s],
  ["youtube_url", s], ["news_url", s],
] as const;

// JSON field name for each SQL column (camelCase ↔ snake_case)
const JSON_KEY: Record<string, string> = {
  date_created: "dateCreated", land_area_sq_km: "landAreaSqKm",
  seal_image_url: "sealImageUrl", flag_image_url: "flagImageUrl",
  official_website_url: "officialWebsiteUrl", finance_ministry_url: "financeMinistryUrl",
  assembly_website_url: "assemblyWebsiteUrl", inec_info_url: "inecInfoUrl",
  contact_address: "contactAddress", contact_phone: "contactPhone", contact_email: "contactEmail",
  complaint_portal_url: "complaintPortalUrl", whistleblower_url: "whistleblowerUrl",
  twitter_url: "twitterUrl", facebook_url: "facebookUrl", instagram_url: "instagramUrl",
  youtube_url: "youtubeUrl", news_url: "newsUrl",
};

function main() {
  const data = JSON.parse(readFileSync(PROFILES, "utf8"));
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const codes = Object.keys(data).filter((k) => k !== "_meta");

  const colNames = COLS.map(([c]) => `"${c}"`).join(", ");
  const updates = COLS.map(([c]) => `"${c}" = EXCLUDED."${c}"`).join(",\n    ");

  const rows = codes.map((code) => {
    const p = data[code];
    const img = manifest[code] || { seal: null, flag: null };
    const values = COLS.map(([col, fmt]) => {
      if (col === "seal_image_url") return s(img.seal); // rehosted path (or NULL)
      if (col === "flag_image_url") return s(img.flag);
      return (fmt as (v: unknown) => string)(p[JSON_KEY[col] ?? col]);
    });
    return `  (${s(code)}, ${values.join(", ")})`;
  });

  const sql = `-- Seed state_profiles for all 37 states (36 + FCT).
-- Idempotent: re-running updates rows, never duplicates. Generated from
-- data/state-profiles.json + data/state-image-manifest.json. Do not hand-edit;
-- regenerate via scripts/generate-state-profiles-seed.ts.

INSERT INTO "state_profiles" ("state_code", ${colNames})
VALUES
${rows.join(",\n")}
ON CONFLICT ("state_code") DO UPDATE SET
    ${updates},
    "updated_at" = now();
`;

  const dir = join(__dirname, "..", "prisma", "migrations", `${ts()}_seed_state_profiles`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "migration.sql"), sql);
  console.log(`Wrote ${join(dir, "migration.sql")} (${codes.length} rows)`);
}

main();
