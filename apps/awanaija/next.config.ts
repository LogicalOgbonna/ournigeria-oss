import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
// Deploy trigger: no functional change. (force awanaija nx-ignore rebuild for prod env)
// Old ward/LGA slugs orphaned by the INEC ward resync (commit 88e1e1b) → 308 to their
// successor URL. Generated from the resync's reconcile_plan.csv and validated against prod
// by scripts/gen-ward-redirects.mjs. `delete`d wards (no successor) are NOT here — the ward
// page's in-page fallback redirects those to their parent LGA. Regenerate after ward changes.
import wardRedirects from "./ward-redirects.generated.json";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats (much smaller than PNG/JPEG) for anything routed
    // through next/image. Raw <img> call sites don't benefit until converted —
    // tracked as a follow-up in .agent/plans/44.awanaija-mobile-perf.md (Task 5).
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nass.gov.ng",
      },
    ],
  },
  async redirects() {
    // permanent: true ⇒ HTTP 308 (SEO-equivalent to 301).
    return wardRedirects;
  },
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.ournigeria.ng";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
