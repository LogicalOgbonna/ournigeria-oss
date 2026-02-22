import * as fs from "node:fs";
import * as path from "node:path";
import type { BudgetOfficial, BudgetOfficials } from "@/types";

const BUDGETS_DIR = path.resolve(__dirname, "../../../../budgets");

const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  commissioner_of_finance: "Commissioner of Finance",
  house_of_assembly_speaker: "Speaker, House of Assembly",
  appropriation_committee_chair: "Appropriation Committee Chair",
  accountant_general: "Accountant General",
};

interface MetadataFile {
  state: string;
  year: number;
  [key: string]: unknown;
}

interface OfficialEntry {
  name?: string | null;
  party?: string;
  title?: string;
  image_url?: string;
  image_blob?: string;
}

/**
 * Read metadata.json for a given state and year, returning officials info.
 * The state name may use spaces (e.g. "Akwa Ibom") — the directory uses underscores.
 */
export function getOfficials(state: string, year: number): BudgetOfficials | null {
  const dirName = state.replace(/ /g, "_");
  const metadataPath = path.join(BUDGETS_DIR, dirName, String(year), "metadata.json");

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(metadataPath, "utf-8");
    const data: MetadataFile = JSON.parse(raw);

    const officials: BudgetOfficial[] = [];

    for (const [key, label] of Object.entries(ROLE_LABELS)) {
      const entry = data[key] as OfficialEntry | undefined;
      if (!entry || !entry.name) continue;

      officials.push({
        role: label,
        name: entry.name,
        ...(entry.party && { party: entry.party }),
        ...(entry.title && { title: entry.title }),
        ...(entry.image_url && { imageUrl: entry.image_url }),
      });
    }

    if (officials.length === 0) return null;

    return {
      state: data.state ?? state,
      year: data.year ?? year,
      officials,
    };
  } catch {
    return null;
  }
}

/**
 * Given an array of (state, year) pairs, return unique BudgetOfficials for each.
 */
export function getOfficialsForResults(
  results: Array<{ state: string; year: number }>,
): BudgetOfficials[] {
  const seen = new Set<string>();
  const allOfficials: BudgetOfficials[] = [];

  for (const { state, year } of results) {
    const key = `${state}|${year}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const officials = getOfficials(state, year);
    if (officials) {
      allOfficials.push(officials);
    }
  }

  return allOfficials;
}
