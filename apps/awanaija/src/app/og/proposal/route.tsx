/**
 * Query-driven link-preview card for /proposals/new deep-links.
 *
 * The opengraph-image file convention only sees route params, and the proposal
 * ask (role + location) lives entirely in the query string — so this is a route
 * handler. /proposals/new's generateMetadata points og:image here with the
 * relevant params forwarded.
 *
 * Cacheable for a day per unique query: crawlers (and the datacenter fleet)
 * re-fetching card images must not cost a Satori render per hit.
 */
import { ImageResponse } from "next/og";
import { OG_SIZE } from "@/lib/og";
import { OgCardIdentity, ogIdentityFonts } from "@/lib/og-identity";
import { proposalCardFromParams } from "@/lib/og-proposal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const card = proposalCardFromParams(params);

  return new ImageResponse(<OgCardIdentity {...card} />, {
    ...OG_SIZE,
    fonts: ogIdentityFonts(),
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "cache-control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
