import { regionToStateSlug } from "./geo";

/**
 * The ONLY host-specific code in the app. Resolve the viewer's Nigerian state
 * slug from platform geo headers. Swap hosts = edit the pairs below.
 */
const HOST_HEADER_PAIRS: Array<{ country: string; region: string }> = [
  // Cloudflare first: ournigeria.ng is orange-clouded in front of Vercel, so
  // x-vercel-ip-* now reflects the Cloudflare edge colo, not the visitor.
  { country: "cf-ipcountry", region: "cf-region-code" },                    // Cloudflare
  { country: "x-vercel-ip-country", region: "x-vercel-ip-country-region" }, // Vercel
  { country: "x-geo-country", region: "x-geo-region" },                     // generic / self-host
];

export function getViewerStateSlug(
  headers: Headers,
  searchParams?: URLSearchParams,
): string | null {
  // Dev override (geo headers do not exist on localhost). Not country-gated.
  // Only honored outside production so a prod user can't force a variant via ?geo=.
  if (process.env.NODE_ENV !== "production") {
    const override = searchParams?.get("geo") ?? headers.get("x-geo-region-override");
    if (override) return regionToStateSlug(override);
  }

  for (const { country, region } of HOST_HEADER_PAIRS) {
    const c = headers.get(country);
    if (!c) continue;
    if (c.toUpperCase() !== "NG") return null; // present but not Nigeria → default
    return regionToStateSlug(headers.get(region));
  }
  return null;
}
