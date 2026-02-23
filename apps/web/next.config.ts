import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "@mastra/rag", "@mastra/pg"],
};

export default nextConfig;
