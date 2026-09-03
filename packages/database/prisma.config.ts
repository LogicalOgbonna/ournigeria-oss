import { defineConfig } from "prisma/config";
export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL! },
});
