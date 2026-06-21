import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import type { CatalogResource } from "./nbs-catalog-scraper";

export interface ExtractedXlsx {
  /** Absolute path to a FAAC xlsx on disk. */
  path: string;
}

/** Download a resource; if a zip, extract every .xlsx inside. Returns the xlsx
 *  file paths (a zip may contain one or several months). Throws if a zip has
 *  no xlsx inside. */
export async function downloadResource(
  resource: CatalogResource,
): Promise<ExtractedXlsx[]> {
  const dir = await mkdtemp(join(tmpdir(), "faac-"));
  const resp = await fetch(resource.url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh)" },
    signal: AbortSignal.timeout(180_000),
  });
  if (!resp.ok) throw new Error(`download failed: HTTP ${resp.status} for ${resource.url}`);
  const buf = Buffer.from(await resp.arrayBuffer());

  if (resource.ext === "xlsx") {
    const path = join(dir, "faac_disbursement.xlsx");
    await writeFile(path, buf);
    return [{ path }];
  }

  // zip: extract every .xlsx (ignore __MACOSX/ and non-xlsx entries)
  const zip = await JSZip.loadAsync(buf);
  const out: ExtractedXlsx[] = [];
  let i = 0;
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    if (entry.name.startsWith("__MACOSX/")) continue;
    if (!entry.name.toLowerCase().endsWith(".xlsx")) continue;
    const path = join(dir, `faac_${i++}.xlsx`);
    await writeFile(path, await entry.async("nodebuffer"));
    out.push({ path });
  }
  if (out.length === 0) throw new Error(`no xlsx found inside ${resource.filename}`);
  return out;
}
