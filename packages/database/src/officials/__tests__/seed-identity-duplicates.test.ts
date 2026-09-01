import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Guard against cross-person identity contamination in the officials seed
// files. A 2026-03 senators seed assigned one senator's nass.gov.ng photo,
// email, and phone to a second, similarly-named senator in 5 pairs (e.g.
// Abdulaziz Yari's profile copied onto Abdulaziz Musa Yar'Adua), which
// shipped the wrong face and contact info to production official pages.
// Identity fields must be unique per person or absent.

const SEED_DIR = join(__dirname, "../../../seed/structure");
const IDENTITY_FIELDS = ["image_url", "email", "phone_number"] as const;

// Known placeholder junk that is invalid for any official (scraped template
// artifacts). These must not appear at all.
const JUNK_VALUES = new Set(["{{mp_number}}", "admin@nass.gov.ng"]);

interface SeedOfficial {
  name: string;
  image_url?: string | null;
  email?: string | null;
  phone_number?: string | null;
}

const seedFiles = readdirSync(SEED_DIR).filter(
  (f) => f.startsWith("officials-") && f.endsWith(".json"),
);

describe("officials seed identity fields", () => {
  it("finds officials seed files to check", () => {
    expect(seedFiles.length).toBeGreaterThan(0);
  });

  for (const file of seedFiles) {
    describe(file, () => {
      const rows: SeedOfficial[] = JSON.parse(
        readFileSync(join(SEED_DIR, file), "utf8"),
      );

      for (const field of IDENTITY_FIELDS) {
        it(`has no duplicate ${field} across officials`, () => {
          const seen = new Map<string, string[]>();
          for (const o of rows) {
            const v = o[field];
            if (!v || JUNK_VALUES.has(v)) continue;
            seen.set(v, [...(seen.get(v) ?? []), o.name]);
          }
          const dupes = [...seen.entries()].filter(([, names]) => names.length > 1);
          expect(
            dupes.map(([v, names]) => `${field}=${v}: ${names.join(", ")}`),
          ).toEqual([]);
        });
      }

      it("has no placeholder junk values", () => {
        const junk = rows.flatMap((o) =>
          IDENTITY_FIELDS.filter((f) => o[f] && JUNK_VALUES.has(o[f]!)).map(
            (f) => `${o.name}: ${f}=${o[f]}`,
          ),
        );
        expect(junk).toEqual([]);
      });
    });
  }
});
