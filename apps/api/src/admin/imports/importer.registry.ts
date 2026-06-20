import type { DatasetImporter } from "./importer.types";
import { partyProfilesImporter } from "./importers/party-profiles.importer";

// Importers register here. Each new dataset = one entry. Filled in later tasks.
export const IMPORTERS: Record<string, DatasetImporter> = {
  [partyProfilesImporter.name]: partyProfilesImporter,
};

export function getImporter(name: string): DatasetImporter | null {
  return IMPORTERS[name] ?? null;
}

export function listImporters(): DatasetImporter[] {
  return Object.values(IMPORTERS);
}
