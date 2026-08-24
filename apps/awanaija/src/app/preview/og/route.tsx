/**
 * Dev-only preview of the live link-preview cards: /preview/og?v=site|roadmap
 *
 * Renders the same components the real opengraph-image routes use, so copy and
 * layout tweaks can be eyeballed as an actual PNG without deploying. Absent from the
 * sitemap and 404s anywhere that isn't a local dev machine, so it never becomes a
 * public surface.
 */
import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  ogFonts,
  OgCardMap,
  OG_CARD_SITE,
  OG_CARD_ROADMAP,
} from "@/lib/og";

export const dynamic = "force-dynamic";

/**
 * NODE_ENV alone is a build-mode flag, not an access control: a staging box run via
 * `next dev`, or a container where NODE_ENV is unset, would serve this publicly — and
 * because the route is force-dynamic, every request costs a full Satori layout plus a
 * PNG rasterize. Gate on local dev specifically, with an explicit opt-in elsewhere.
 */
function previewEnabled(): boolean {
  if (process.env.ENABLE_OG_PREVIEW === "1") return true;
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

export async function GET(req: Request) {
  if (!previewEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const key = new URL(req.url).searchParams.get("v");
  const card = key === "roadmap" ? OG_CARD_ROADMAP : OG_CARD_SITE;

  return new ImageResponse(<OgCardMap {...card} />, {
    ...OG_SIZE,
    fonts: ogFonts(),
    headers: {
      // Route handlers can't export `metadata`, so noindex has to be a header.
      "X-Robots-Tag": "noindex, nofollow",
      // ImageResponse defaults to `immutable, max-age=31536000` outside development.
      // On a staging host reached via ENABLE_OG_PREVIEW that would pin the preview
      // for a year — freezing the one tool whose job is showing current card copy.
      "cache-control": "no-store",
    },
  });
}
