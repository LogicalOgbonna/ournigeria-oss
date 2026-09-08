/**
 * Pure helpers behind the Artwork and Documents tabs — no React, so the rules
 * that decide what reaches the asset endpoints are unit-testable on their own.
 *
 * Everything here mirrors the API:
 *   - accepted types / size caps: apps/api/src/campaigns/asset-validation.ts
 *     (and `uploadAsset` in lib/campaigns.ts, which throws the same strings)
 *   - document body: `documentPutSchema` + `commitDocument`'s merge rules in
 *     apps/api/src/campaigns/admin-campaign-assets.service.ts
 */
import { isHttpUrl } from "@/lib/campaign-form";

/**
 * The client-side copy of the API's limits (asset-validation.ts). They live
 * HERE, next to the check that uses them, and `lib/campaigns.ts` re-exports
 * them — `uploadAsset` calls `fileProblem` rather than repeating the rules, so
 * the drop zone and the uploader can never disagree about what is accepted.
 */
export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const PDF_MAX_BYTES = 50 * 1024 * 1024;
/** IMAGE_TYPES in asset-validation.ts — jpeg/png/webp, nothing else. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** `accept` attributes for the two drop zones. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export const PDF_ACCEPT = "application/pdf";

/**
 * Short edge below this many pixels earns a warning, never a block: the poster
 * renders at ~1200 px on the public page, so a 400 px source is visibly soft —
 * but an operator with nothing better must still be able to publish it.
 */
export const MIN_IMAGE_SHORT_EDGE = 800;

/** `text(n)` limits from admin-campaigns.schemas.ts. */
export const CAPTION_MAX = 255;
export const DOC_TITLE_MAX = 100;
export const DOC_BLURB_MAX = 255;
export const SOURCE_URL_MAX = 2_000;
/** documentPutSchema: pageCount is 1…5000 or null. */
export const PAGE_COUNT_MAX = 5_000;

/** "15 MB" — shared so every size message is phrased the same way. */
export const asMb = (bytes: number) => Math.round(bytes / 1024 / 1024);

/**
 * The client-side gate before a byte is uploaded — same checks and the same
 * wording as `uploadAsset`, so a rejected file reads identically whether it was
 * caught by the drop zone or by the uploader.
 */
export function fileProblem(
  file: { type: string; size: number },
  kind: "image" | "pdf",
): string | null {
  if (kind === "image" && !(IMAGE_TYPES as readonly string[]).includes(file.type))
    return "Image type not accepted — use jpeg, png, webp";
  if (kind === "pdf" && file.type !== "application/pdf") return "Documents must be PDF";
  const max = kind === "image" ? IMAGE_MAX_BYTES : PDF_MAX_BYTES;
  if (file.size > max) return `File is larger than ${asMb(max)} MB`;
  return null;
}

/** A soft warning for an image whose short edge is under MIN_IMAGE_SHORT_EDGE. */
export function shortEdgeWarning(width: number, height: number): string | null {
  const short = Math.min(width, height);
  if (!Number.isFinite(short) || short <= 0) return null;
  if (short >= MIN_IMAGE_SHORT_EDGE) return null;
  return `This image is ${width}×${height} — its short edge is under ${MIN_IMAGE_SHORT_EDGE} px and will look soft on the public page. It will still upload.`;
}

/** Appended media (banners, gallery photos) as the public page orders them. */
export function byDisplayOrder(
  a: { displayOrder: number; id: string },
  b: { displayOrder: number; id: string },
): number {
  return a.displayOrder - b.displayOrder || a.id.localeCompare(b.id);
}

/**
 * Moving one appended image up or down, expressed as the PATCH bodies that get
 * it there. The list is renumbered 0…n-1 in the process, which is what makes
 * the buttons work at all: every row is created with `displayOrder` 0 unless a
 * commit set one, so a naive "swap the two numbers" would swap 0 with 0.
 * Only rows whose number actually changes are returned.
 */
export function reorderPatches(
  list: readonly { id: string; displayOrder: number }[],
  id: string,
  dir: -1 | 1,
): { id: string; displayOrder: number }[] {
  const index = list.findIndex((m) => m.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= list.length) return [];
  const next = list.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next
    .map((row, i) => ({ id: row.id, displayOrder: i, was: row.displayOrder }))
    .filter((row) => row.was !== row.displayOrder)
    .map(({ id: rowId, displayOrder }) => ({ id: rowId, displayOrder }));
}

// ---------- documents ----------

/** The four editable columns of a campaign document, as strings from inputs. */
export interface DocumentFormValues {
  title: string;
  blurb: string;
  /** Free text so the box can be emptied; validated to an integer here. */
  pageCount: string;
  sourceUrl: string;
}

export function documentProblems(
  v: DocumentFormValues,
): Partial<Record<keyof DocumentFormValues, string>> {
  const out: Partial<Record<keyof DocumentFormValues, string>> = {};
  const title = v.title.trim();
  if (!title) out.title = "A title is required.";
  else if (title.length > DOC_TITLE_MAX) out.title = `At most ${DOC_TITLE_MAX} characters.`;
  const pages = v.pageCount.trim();
  if (pages) {
    const n = Number(pages);
    if (!Number.isInteger(n) || n < 1 || n > PAGE_COUNT_MAX)
      out.pageCount = `A whole number between 1 and ${PAGE_COUNT_MAX}.`;
  }
  const url = v.sourceUrl.trim();
  if (url && !isHttpUrl(url)) out.sourceUrl = "Enter a full http(s):// URL.";
  return out;
}

/**
 * The body for `PUT /:id/documents/:kind/:subject`.
 *
 * The subtle column is `pageCount`. `commitDocument` fills an ABSENT pageCount
 * from its own scan of the uploaded PDF (`scanned ?? existing ?? null`) but
 * takes an explicit `null` literally. So an empty box means two different
 * things: with a new PDF staged it means "use your scan" (omit the key), and
 * without one it means "clear the stored count" (send null) — and only when
 * there is something to clear, so an untouched empty box on a new document
 * sends nothing at all.
 */
export function documentBody(
  v: DocumentFormValues,
  opts: {
    stagingKey?: string;
    coverStagingKey?: string;
    existingPageCount?: number | null;
    reason?: string;
  } = {},
): Record<string, unknown> {
  const body: Record<string, unknown> = { title: v.title.trim() };
  // "" collapses to null: the API stores an empty string verbatim otherwise.
  body.blurb = v.blurb.trim() || null;
  body.sourceUrl = v.sourceUrl.trim() || null;
  const pages = v.pageCount.trim();
  if (pages) body.pageCount = Number(pages);
  else if (!opts.stagingKey && opts.existingPageCount != null) body.pageCount = null;
  if (opts.stagingKey) body.stagingKey = opts.stagingKey;
  if (opts.coverStagingKey) body.coverStagingKey = opts.coverStagingKey;
  if (opts.reason) body.reason = opts.reason;
  return body;
}
