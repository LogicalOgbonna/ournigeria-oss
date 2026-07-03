#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { IdentifyCampaignService } from "../src/identify/identify-campaign.service.js";
import { SafetyFilter } from "../src/intelligence/safety-filter.js";
import { SocialsSettingsService } from "../src/config/socials-settings.service.js";
import { CampaignTemplateProvider } from "../src/campaign/campaign-template.provider.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }) as any;
const publisher: any = { publishOriginal: () => { throw new Error("publishOriginal must NOT be called in automated tests"); } };
function assert(c: boolean, m: string) { if (!c) { console.error("FAIL:", m); process.exit(1); } }

async function main() {
  const settings = new SocialsSettingsService(prisma);
  const svc = new IdentifyCampaignService(prisma, publisher, new SafetyFilter(), settings, new CampaignTemplateProvider(prisma));

  // (1) dryRun for lga_chairman (has a local pool) — no publish, no writes
  const preview = await svc.postOneCategory("lga_chairman", 0, { dryRun: true });
  assert(preview !== null, "lga_chairman dryRun preview produced");
  assert(preview!.url.includes("utm_campaign=identify_cta"), "identify_cta url");
  assert(!/\{[a-z]+\}/.test(preview!.text), "template filled");
  assert(preview!.safe === true, "passes safety");

  // mha pool is empty locally → dryRun returns null
  assert((await svc.postOneCategory("mha", 0, { dryRun: true })) === null, "mha null locally (empty pool)");

  // (2) toggle-OFF park path for lga_chairman — writes draft + ledger, NO X call
  await settings.setIdentifyAutoPost(false);
  const before = await prisma.socialPost.count({ where: { postType: "identify_seat" } });
  const parked = await svc.postOneCategory("lga_chairman", 1, { dryRun: false });
  assert(parked !== null, "lga park produced");
  const after = await prisma.socialPost.count({ where: { postType: "identify_seat" } });
  assert(after === before + 1, "one social_posts draft created");

  const post = await prisma.socialPost.findFirst({ where: { postType: "identify_seat" }, orderBy: { createdAt: "desc" } });
  assert(post.status === "drafted" && post.reviewStatus === "pending", "draft status/pending");
  const target = await prisma.identifyCampaignTarget.findFirst({ where: { socialPostId: post.id } });
  assert(!!target && target.status === "drafted", "ledger row drafted");

  // cleanup
  await prisma.identifyCampaignTarget.deleteMany({ where: { socialPostId: post.id } });
  await prisma.socialPost.delete({ where: { id: post.id } });
  await prisma.systemSetting.deleteMany({ where: { key: "identify.auto_post" } });

  console.log("runWindow checks ✅ (no real tweet posted)");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
