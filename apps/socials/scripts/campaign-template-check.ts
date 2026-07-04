#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { IDENTIFY_TEMPLATES } from "../src/identify/identify-content.js";
import { CampaignTemplateProvider } from "../src/campaign/campaign-template.provider.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }) as any;
function assert(c: boolean, m: string) { if (!c) { console.error("FAIL:", m); process.exit(1); } }

async function main() {
  const p = new CampaignTemplateProvider(prisma);
  // Clean slate → falls back to code constants
  await prisma.systemSetting.deleteMany({ where: { key: { in: ["campaign.identify_templates", "campaign.verify_templates"] } } });
  const fallback = await p.getIdentifyTemplates();
  assert(JSON.stringify(fallback.councilor) === JSON.stringify(IDENTIFY_TEMPLATES.councilor), "fallback = code constant when unset");
  const pick0 = await p.pickIdentify("councilor", 0);
  assert(pick0 === IDENTIFY_TEMPLATES.councilor[0], "pickIdentify fallback slot 0");

  // Edit one category → pick reflects the edit; other categories still fall back
  await p.setIdentifyCategory("councilor", ["EDITED {ward} {lga} {state} {url}"]);
  const edited = await p.getIdentifyTemplates();
  assert(edited.councilor.length === 1 && edited.councilor[0].includes("EDITED"), "councilor edited");
  assert(JSON.stringify(edited.lga_chairman) === JSON.stringify(IDENTIFY_TEMPLATES.lga_chairman), "unedited category still = constant");
  assert((await p.pickIdentify("councilor", 5)) === "EDITED {ward} {lga} {state} {url}", "pick reflects edit (modulo)");

  // Malformed JSON → fallback (no crash)
  await prisma.systemSetting.upsert({
    where: { key: "campaign.identify_templates" },
    create: { key: "campaign.identify_templates", value: "not json{", category: "socials", valueType: "json" },
    update: { value: "not json{" },
  });
  const afterBad = await p.getIdentifyTemplates();
  assert(afterBad.councilor.length === IDENTIFY_TEMPLATES.councilor.length, "malformed JSON → fallback");

  await prisma.systemSetting.deleteMany({ where: { key: { in: ["campaign.identify_templates", "campaign.verify_templates"] } } });
  console.log("campaign-template-check ✅");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
