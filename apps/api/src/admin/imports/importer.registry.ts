import type { DatasetImporter } from "./importer.types";
import { partyProfilesImporter } from "./importers/party-profiles.importer";
import { partyOfficersImporter } from "./importers/party-officers.importer";

// Importers register here. Each new dataset = one entry. Filled in later tasks.
export const IMPORTERS: Record<string, DatasetImporter> = {
  [partyProfilesImporter.name]: partyProfilesImporter,
  [partyOfficersImporter.name]: partyOfficersImporter,
};

export function getImporter(name: string): DatasetImporter | null {
  return IMPORTERS[name] ?? null;
}

export function listImporters(): DatasetImporter[] {
  return Object.values(IMPORTERS);
}
