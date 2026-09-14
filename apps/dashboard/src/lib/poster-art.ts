/**
 * Poster geometry ("posterArt") — the layout stored in `campaign_media.metadata`
 * that awanaija uses to compose the homepage ticket poster on its 404×695
 * canvas (apps/awanaija/src/components/civic/CandidateTicket.tsx).
 *
 * The API validates writes with `posterArtSchema` (apps/api/src/campaigns/
 * poster-art.schema.ts): `poster_candidate` carries `{box, chip?, scrim?,
 * urlColor?}`, `poster_mate` carries `{box}` only. Chip radii must be written
 * as per-corner NUMBERS; seeded rows predate that schema and store a Tailwind
 * class string instead, which `radiusFromLegacy` converts on load so a seeded
 * ticket round-trips through the editor without a 400.
 */

export const POSTER_W = 404;
export const POSTER_H = 695;

export interface PosterBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PosterRadius {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

export interface PosterChip extends PosterBox {
  radius: PosterRadius;
  /** Logo inset on a white card instead of bleeding to the chip edges. */
  plaque?: { inset: { x: number; y: number; size: number } };
}

export interface PosterScrim extends PosterBox {
  color?: string;
  opacity?: number;
}

/** Everything the editor works on. `scrim` is preserved verbatim, not edited. */
export interface PosterArtDraft {
  candidate: PosterBox;
  mate: PosterBox | null;
  chip: PosterChip;
  /** Empty string = the renderer's default (#ffffff). */
  urlColor: string;
  scrim: PosterScrim | null;
}

/**
 * The renderer's generic fallback layout (CandidateTicket.tsx `TicketPhotos` /
 * `PartyChip` defaults) — what the public site shows when a ticket has no
 * authored geometry, and the natural starting point for authoring one.
 */
export const GENERIC_CANDIDATE_BOX: PosterBox = { x: -24, y: 100, w: 300, h: 595 };
export const GENERIC_MATE_BOX: PosterBox = { x: 196, y: 266, w: 236, h: 342 };
export const GENERIC_CHIP: PosterChip = {
  x: 303,
  y: 604,
  w: 101,
  h: 91,
  radius: { tl: 11, tr: 0, br: 0, bl: 11 }, // rounded-l-[11px]
};

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function asBox(v: unknown): PosterBox | null {
  if (typeof v !== "object" || v === null) return null;
  const b = v as Record<string, unknown>;
  return isNum(b.x) && isNum(b.y) && isNum(b.w) && isNum(b.h)
    ? { x: b.x, y: b.y, w: b.w, h: b.h }
    : null;
}

/**
 * Convert a legacy Tailwind radius class string ("rounded-[19.707px]",
 * "rounded-l-[11px]", "rounded-[8.413px] rounded-tr-none") to per-corner
 * numbers. Tokens apply left to right over an all-zero base, matching how the
 * classes cascade in CSS.
 */
export function radiusFromLegacy(value: string): PosterRadius {
  const r: PosterRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
  const SIDES: Record<string, (keyof PosterRadius)[]> = {
    "": ["tl", "tr", "br", "bl"],
    t: ["tl", "tr"],
    b: ["bl", "br"],
    l: ["tl", "bl"],
    r: ["tr", "br"],
    tl: ["tl"],
    tr: ["tr"],
    br: ["br"],
    bl: ["bl"],
  };
  for (const token of value.trim().split(/\s+/)) {
    const m = /^rounded(?:-(t|b|l|r|tl|tr|br|bl))?-(?:\[(\d+(?:\.\d+)?)px\]|(none))$/.exec(token);
    if (!m) continue;
    const corners = SIDES[m[1] ?? ""] ?? [];
    const px = m[3] === "none" ? 0 : Number(m[2]);
    for (const c of corners) r[c] = px;
  }
  return r;
}

function asRadius(v: unknown): PosterRadius | null {
  if (typeof v === "string") return radiusFromLegacy(v);
  if (typeof v !== "object" || v === null) return null;
  const r = v as Record<string, unknown>;
  return isNum(r.tl) && isNum(r.tr) && isNum(r.br) && isNum(r.bl)
    ? { tl: r.tl, tr: r.tr, br: r.br, bl: r.bl }
    : null;
}

function asChip(v: unknown): PosterChip | null {
  const box = asBox(v);
  if (!box) return null;
  const c = v as Record<string, unknown>;
  const radius = asRadius(c.radius) ?? GENERIC_CHIP.radius;
  const plaque = (() => {
    if (typeof c.plaque !== "object" || c.plaque === null) return undefined;
    const inset = (c.plaque as Record<string, unknown>).inset as Record<string, unknown> | undefined;
    return inset && isNum(inset.x) && isNum(inset.y) && isNum(inset.size)
      ? { inset: { x: inset.x, y: inset.y, size: inset.size } }
      : undefined;
  })();
  return { ...box, radius, ...(plaque ? { plaque } : {}) };
}

function asScrim(v: unknown): PosterScrim | null {
  const box = asBox(v);
  if (!box) return null;
  const s = v as Record<string, unknown>;
  return {
    ...box,
    ...(typeof s.color === "string" ? { color: s.color } : {}),
    ...(isNum(s.opacity) ? { opacity: s.opacity } : {}),
  };
}

/** True when the stored candidate metadata is complete enough that awanaija
 *  renders the authored layout (its gate: a box AND a chip — campaigns.ts
 *  `artworkOf`). */
export function hasAuthoredLayout(candidateMetadata: unknown): boolean {
  if (typeof candidateMetadata !== "object" || candidateMetadata === null) return false;
  const m = candidateMetadata as Record<string, unknown>;
  return asBox(m.box) !== null && asChip(m.chip) !== null;
}

/**
 * Build the editor draft from the stored metadata blobs; anything missing or
 * malformed falls back to the generic layout so the editor always starts from
 * exactly what the public site currently shows.
 */
export function draftFromMetadata(
  candidateMetadata: unknown,
  mateMetadata: unknown,
  hasMate: boolean,
): PosterArtDraft {
  const cm = (typeof candidateMetadata === "object" && candidateMetadata !== null
    ? candidateMetadata
    : {}) as Record<string, unknown>;
  const mm = (typeof mateMetadata === "object" && mateMetadata !== null
    ? mateMetadata
    : {}) as Record<string, unknown>;
  return {
    candidate: asBox(cm.box) ?? { ...GENERIC_CANDIDATE_BOX },
    mate: hasMate ? (asBox(mm.box) ?? { ...GENERIC_MATE_BOX }) : null,
    chip: asChip(cm.chip) ?? { ...GENERIC_CHIP, radius: { ...GENERIC_CHIP.radius } },
    urlColor: typeof cm.urlColor === "string" ? cm.urlColor : "",
    scrim: asScrim(cm.scrim),
  };
}

/** The PATCH body for the poster_candidate row. Omits empty optionals — the
 *  API schema is `.strict()` and its optionals reject explicit nulls. */
export function candidateMetadataOf(draft: PosterArtDraft): Record<string, unknown> {
  const { x, y, w, h, radius, plaque } = draft.chip;
  return {
    box: draft.candidate,
    chip: { x, y, w, h, radius: { ...radius }, ...(plaque ? { plaque } : {}) },
    ...(draft.scrim ? { scrim: draft.scrim } : {}),
    ...(draft.urlColor.trim() ? { urlColor: draft.urlColor.trim() } : {}),
  };
}

/** The PATCH body for the poster_mate row (box only, per matePosterArtSchema). */
export function mateMetadataOf(draft: PosterArtDraft): Record<string, unknown> | null {
  return draft.mate ? { box: draft.mate } : null;
}

const COLOUR_RE = /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;

/** Mirrors the API's posterArtSchema ranges so a save can't 400 on bounds. */
export function draftProblem(draft: PosterArtDraft): string | null {
  const boxes: [string, PosterBox][] = [
    ["Candidate", draft.candidate],
    ...(draft.mate ? ([["Running mate", draft.mate]] as [string, PosterBox][]) : []),
    ["Logo chip", draft.chip],
  ];
  for (const [label, b] of boxes) {
    if (b.x < -1000 || b.x > 2000 || b.y < -1000 || b.y > 2000)
      return `${label}: x and y must be between -1000 and 2000.`;
    if (b.w < 0 || b.w > 2000 || b.h < 0 || b.h > 2000)
      return `${label}: width and height must be between 0 and 2000.`;
  }
  const r = draft.chip.radius;
  for (const corner of [r.tl, r.tr, r.br, r.bl])
    if (corner < 0 || corner > 400) return "Chip corner radius must be between 0 and 400.";
  const inset = draft.chip.plaque?.inset;
  if (inset && (inset.x < -1000 || inset.x > 2000 || inset.y < -1000 || inset.y > 2000 || inset.size < 0 || inset.size > 2000))
    return "Plaque inset values are out of range.";
  if (draft.urlColor.trim() && !COLOUR_RE.test(draft.urlColor.trim()))
    return "URL colour must be #rgb, #rrggbb or rgb(a)().";
  return null;
}
