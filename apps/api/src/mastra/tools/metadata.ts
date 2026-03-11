import * as fs from "node:fs/promises";
import * as path from "node:path";
import { cache as cacheManager } from "@ournigeria/cache";
import type { BudgetOfficial, BudgetOfficials } from "../../types";

const officialsCache = cacheManager.namespace("meta:officials");

const BUDGETS_DIR = path.resolve(
  __dirname,
  "../../../../../../packages/source/budgets",
);

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

export async function getOfficials(
  state: string,
  year: number,
): Promise<BudgetOfficials | null> {
  const cacheKey = `${state}:${year}`;
  const cached = await officialsCache.get<BudgetOfficials>(cacheKey);
  if (cached) return cached;

  const dirName = state.replace(/ /g, "_");
  const metadataPath = path.join(
    BUDGETS_DIR,
    dirName,
    String(year),
    "metadata.json",
  );

  try {
    const raw = await fs.readFile(metadataPath, "utf-8");
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

    const result: BudgetOfficials = {
      state: data.state ?? state,
      year: data.year ?? year,
      officials,
    };

    await officialsCache.set(cacheKey, result, 60 * 60 * 1000);
    return result;
  } catch {
    return null;
  }
}

export async function getOfficialsForResults(
  results: Array<{ state: string; year: number }>,
): Promise<BudgetOfficials[]> {
  const seen = new Set<string>();
  const promises: Promise<BudgetOfficials | null>[] = [];

  for (const { state, year } of results) {
    const key = `${state}|${year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    promises.push(getOfficials(state, year));
  }

  const results_ = await Promise.all(promises);
  return results_.filter((o): o is BudgetOfficials => o !== null);
}
