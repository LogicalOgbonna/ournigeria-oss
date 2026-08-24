/**
 * Link-preview card for /roadmap. Overrides the site default so a shared roadmap
 * link leads with what is being built rather than the general "who governs you" pitch.
 */
import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  ogFonts,
  OgCardMap,
  OG_CARD_ROADMAP,
} from "@/lib/og";

export const alt =
  "OurNigeria roadmap — what we are building next, ward by ward: elections, the police chain, clinics and schools.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(<OgCardMap {...OG_CARD_ROADMAP} />, {
    ...size,
    fonts: await ogFonts(),
  });
}
