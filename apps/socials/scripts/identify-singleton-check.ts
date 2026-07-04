#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { IdentifyCampaignService } from "../src/identify/identify-campaign.service.js";
import { CampaignTemplateProvider } from "../src/campaign/campaign-template.provider.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }) as any;

async function main() {
  const svc = new IdentifyCampaignService(prisma, null as any, null as any, null as any, new CampaignTemplateProvider(prisma));
  const date = new Date("2099-01-01");
  const slot = 3;
  await prisma.identifyCampaignRun.deleteMany({ where: { windowDate: date, windowSlot: slot } });

  const [a, b] = await Promise.all([svc.claimWindow(date, slot), svc.claimWindow(date, slot)]);
  const leaders = [a, b].filter(Boolean).length;
  if (leaders !== 1) { console.error("FAIL: expected exactly 1 leader, got", leaders); process.exit(1); }

  const c = await svc.claimWindow(date, slot);
  if (c) { console.error("FAIL: re-claim should be false"); process.exit(1); }

  await prisma.identifyCampaignRun.deleteMany({ where: { windowDate: date, windowSlot: slot } });
  console.log("singleton checks ✅");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
