import { z } from "zod";

/**
 * Figma-authored poster geometry stored on poster_* media rows (spec §7).
 * Numbers only, bounded; colours by regex. Corner radii are NUMBERS — the
 * old Tailwind class strings never reach the DOM (Tailwind v4 emits no CSS
 * for classes that only exist in data). The renderer moves to numeric radii
 * in sub-plan 4; until then a stored string radius is read but never written.
 */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGBA = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i;
export const colourSchema = z.string().refine((v) => {
  if (HEX.test(v)) return true;
  if (!RGBA.test(v)) return false;
  // \d{1,3} admits 300; clamp semantics belong to the browser, not to stored data.
  return v.match(/\d{1,3}/g)!.slice(0, 3).every((c) => Number(c) <= 255);
}, "colour must be #rgb, #rrggbb or rgb(a)() with channels 0-255");

const coord = z.number().finite().min(-1000).max(2000);
const size = z.number().finite().min(0).max(2000);

export const boxSchema = z.object({ x: coord, y: coord, w: size, h: size }).strict();

export const posterArtSchema = z
  .object({
    box: boxSchema,
    chip: z
      .object({
        x: coord,
        y: coord,
        w: size,
        h: size,
        radius: z.object({ tl: size.max(400), tr: size.max(400), br: size.max(400), bl: size.max(400) }).strict().optional(),
        plaque: z.object({ inset: z.object({ x: coord, y: coord, size: size }).strict() }).strict().optional(),
      })
      .strict()
      .optional(),
    scrim: z
      .object({ x: coord, y: coord, w: size, h: size, opacity: z.number().min(0).max(1).optional(), color: colourSchema.optional() })
      .strict()
      .optional(),
    urlColor: colourSchema.optional(),
  })
  .strict();

export type PosterArt = z.infer<typeof posterArtSchema>;

/** Mate posters carry only their box. */
export const matePosterArtSchema = z.object({ box: boxSchema }).strict();
