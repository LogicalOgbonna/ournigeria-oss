import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrations: {
    schema: "prisma/schema.prisma",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
