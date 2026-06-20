import type { DatasetImporter } from "./importer.types";

// Importers register here. Each new dataset = one entry. Filled in later tasks.
export const IMPORTERS: Record<string, DatasetImporter> = {};

export function getImporter(name: string): DatasetImporter | null {
  return IMPORTERS[name] ?? null;
}

export function listImporters(): DatasetImporter[] {
  return Object.values(IMPORTERS);
}
