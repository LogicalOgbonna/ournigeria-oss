import { parseFaacFilename } from "./filename-parser";

export const CATALOG_156_URL =
  "https://microdata.nigerianstat.gov.ng/index.php/catalog/156";

export interface CatalogResource {
  resourceId: string;
  filename: string;
  url: string;
  year: number;
  months: number[];
  ext: "xlsx" | "zip";
}

/** Parse catalog-156 HTML -> the parseable FAAC data resources (xlsx/zip only). */
export function parseCatalogHtml(html: string): CatalogResource[] {
  const re = /\/catalog\/156\/download\/(\d+)\/([^"'\s>]+)/g;
  const seen = new Set<string>();
  const out: CatalogResource[] = [];
  for (const m of html.matchAll(re)) {
    const resourceId = m[1];
    const rawName = m[2];
    if (seen.has(resourceId)) continue;
    seen.add(resourceId);
    const parsed = parseFaacFilename(rawName);
    if (!parsed) continue; // skips pdfs + unrecognized
    const filename = decodeURIComponent(rawName);
    out.push({
      resourceId,
      filename,
      url: `https://microdata.nigerianstat.gov.ng/index.php/catalog/156/download/${resourceId}/${rawName}`,
      year: parsed.year,
      months: parsed.months,
      ext: filename.toLowerCase().endsWith(".zip") ? "zip" : "xlsx",
    });
  }
  return out;
}

/** Fetch the live catalog page and parse it. */
export async function fetchCatalogResources(
  url: string = CATALOG_156_URL,
): Promise<CatalogResource[]> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh)" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) throw new Error(`catalog fetch failed: HTTP ${resp.status}`);
  return parseCatalogHtml(await resp.text());
}
