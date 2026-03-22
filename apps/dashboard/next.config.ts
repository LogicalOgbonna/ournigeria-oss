import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.API_URL || "http://localhost:3001";
    const ingestUrl = process.env.INGEST_URL || "http://localhost:3002";
    return [
      {
        source: "/api/admin/:path*",
        destination: `${apiUrl}/api/admin/:path*`,
      },
      {
        source: "/api/ingest/:path*",
        destination: `${ingestUrl}/api/ingest/:path*`,
      },
    ];
  },
};

export default nextConfig;
