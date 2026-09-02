// Deploy trigger: no functional change.
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.API_URL || "http://localhost:3001";
    const ingestUrl = process.env.INGEST_URL || "http://localhost:3002";
    const socialsUrl = process.env.SOCIALS_URL || "http://localhost:3005";
    return [
      {
        source: "/api/admin/:path*",
        destination: `${apiUrl}/api/admin/:path*`,
      },
      {
        source: "/api/proposals/:path*",
        destination: `${apiUrl}/api/proposals/:path*`,
      },
      {
        // Public read-only officials API — used by the audit-target detail stub.
        source: "/api/officials/:path*",
        destination: `${apiUrl}/api/officials/:path*`,
      },
      {
        source: "/api/ingest/:path*",
        destination: `${ingestUrl}/api/ingest/:path*`,
      },
      {
        source: "/api/socials/:path*",
        destination: `${socialsUrl}/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
