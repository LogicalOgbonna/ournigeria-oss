#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  const runs = await prisma.identifyCampaignRun.count();
  const targets = await prisma.identifyCampaignTarget.count();
  console.log(`runs=${runs} targets=${targets} — models queryable ✅`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
