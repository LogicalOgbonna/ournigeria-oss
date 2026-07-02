#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { SocialsSettingsService } from "../src/config/socials-settings.service.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }) as any;

async function main() {
  const svc = new SocialsSettingsService(prisma);
  await prisma.systemSetting.deleteMany({ where: { key: "identify.auto_post" } });
  if ((await svc.getIdentifyAutoPost()) !== false) { console.error("FAIL: default should be false"); process.exit(1); }
  await svc.setIdentifyAutoPost(true);
  if ((await svc.getIdentifyAutoPost()) !== true) { console.error("FAIL: set true"); process.exit(1); }
  await svc.setIdentifyAutoPost(false);
  if ((await svc.getIdentifyAutoPost()) !== false) { console.error("FAIL: set false"); process.exit(1); }
  await prisma.systemSetting.deleteMany({ where: { key: "identify.auto_post" } });
  console.log("toggle checks ✅");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
