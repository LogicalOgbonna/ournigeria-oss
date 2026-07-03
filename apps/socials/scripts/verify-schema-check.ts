#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  const n = await prisma.proposalVerifyPost.count();
  console.log(`proposal_verify_posts count=${n} — model queryable ✅`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
