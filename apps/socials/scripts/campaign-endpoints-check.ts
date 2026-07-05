#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { SocialsSettingsService } from "../src/config/socials-settings.service.js";
import { CampaignTemplateProvider } from "../src/campaign/campaign-template.provider.js";
import { CampaignController } from "../src/campaign/campaign.controller.js";
import { IDENTIFY_TEMPLATES } from "../src/identify/identify-content.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
}) as any;
function assert(c: boolean, m: string) {
  if (!c) {
    console.error("FAIL:", m);
    process.exit(1);
  }
}

async function main() {
  const settings = new SocialsSettingsService(prisma);
  const provider = new CampaignTemplateProvider(prisma);
  const c = new CampaignController(settings, provider);

  // clean slate
  await prisma.systemSetting.deleteMany({
    where: {
      key: {
        in: [
          "identify.auto_post",
          "verify.auto_post",
          "campaign.identify_templates",
          "campaign.verify_templates",
        ],
      },
    },
  });

  // settings: default false, PUT flips, GET reflects
  let s = await c.getSettings();
  assert(
    s.identify_auto_post === false && s.verify_auto_post === false,
    "settings default false",
  );
  s = await c.updateSettings({ identify_auto_post: true });
  assert(
    s.identify_auto_post === true && s.verify_auto_post === false,
    "identify toggled on",
  );

  // templates: GET returns fallback constants
  const t = await c.getTemplates();
  assert(
    Array.isArray(t.identify.councilor) && t.identify.councilor.length >= 1,
    "templates GET has identify.councilor",
  );

  // PUT valid template persists
  const ok = await c.updateTemplates({
    kind: "identify",
    category: "councilor",
    templates: ["Hey {ward} in {lga}, {state} — who's your councillor? {url}"],
  });
  assert(
    ok.identify.councilor[0].includes("who's your councillor"),
    "valid template saved",
  );

  // PUT invalid (missing {url}) → throws
  let threw = false;
  try {
    await c.updateTemplates({
      kind: "identify",
      category: "councilor",
      templates: ["no link here {ward}"],
    });
  } catch {
    threw = true;
  }
  assert(threw, "template missing {url} rejected");

  // PUT invalid (unknown placeholder) → throws
  threw = false;
  try {
    await c.updateTemplates({
      kind: "verify",
      category: "change",
      templates: ["{name} {bogus} {url}"],
    });
  } catch {
    threw = true;
  }
  assert(threw, "unknown placeholder rejected");

  // cleanup
  await prisma.systemSetting.deleteMany({
    where: {
      key: {
        in: [
          "identify.auto_post",
          "verify.auto_post",
          "campaign.identify_templates",
          "campaign.verify_templates",
        ],
      },
    },
  });
  console.log("campaign-endpoints-check ✅");
  void IDENTIFY_TEMPLATES;
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
