import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

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
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.example.invalid";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
