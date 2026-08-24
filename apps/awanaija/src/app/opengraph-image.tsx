/**
 * Default link-preview card for the whole site.
 *
 * Next injects this as og:image / twitter:image on every route that does not ship
 * its own opengraph-image, so any page shared to WhatsApp, X or Telegram gets a
 * branded card instead of a bare link.
 */
import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  ogFonts,
  OgCardMap,
  OG_CARD_SITE,
} from "@/lib/og";
import { COVERAGE } from "@/lib/constants";

export const alt = `OurNigeria — know who governs you, all the way down to your ward. ${COVERAGE.wards} wards and ${COVERAGE.lgas} local governments mapped.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(<OgCardMap {...OG_CARD_SITE} />, {
    ...size,
    fonts: await ogFonts(),
  });
}
