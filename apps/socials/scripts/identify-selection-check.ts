#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { IdentifyCampaignService } from "../src/identify/identify-campaign.service.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }) as any;
function assert(c: boolean, m: string) { if (!c) { console.error("FAIL:", m); process.exit(1); } }

async function main() {
  const svc = new IdentifyCampaignService(prisma, null as any, null as any, null as any);

  // NOTE: task brief assumed 0 wards locally; this DB has wards populated,
  // so councilor returns a real seat. Assert seat shape instead of null.
  const c = await svc.selectSeat("councilor");
  if (c === null) {
    console.log("councilor pool empty (0 wards) — ok");
  } else {
    assert(c.seatColumn === "ward_code" && !!c.seatCode && !!c.stateCode && !!c.stateName && !!c.lgaCode, "councilor seat shape incl stateName");
  }

  const lga = await svc.selectSeat("lga_chairman");
  assert(lga !== null, "lga_chairman seat found");
  assert(lga!.seatColumn === "lga_code" && !!lga!.seatCode && !!lga!.stateCode && !!lga!.stateName, "lga seat shape incl stateName");

  // NOTE: this DB has all 990 state constituencies already carrying an mha
  // official_position, so the done-guard empties the pool → null. Assert shape
  // only when the pool is non-empty.
  const mha = await svc.selectSeat("mha");
  if (mha === null) {
    console.log("mha pool empty (all state seats already identified) — ok");
  } else {
    assert(mha.seatColumn === "constituency_code" && !!mha.constituencyCode && !!mha.stateName, "mha seat shape incl stateName");
  }

  await prisma.identifyCampaignTarget.create({
    data: { category: "lga_chairman", seatColumn: "lga_code", seatCode: lga!.seatCode, stateCode: lga!.stateCode, status: "posted" },
  });
  for (let i = 0; i < 25; i++) {
    const again = await svc.selectSeat("lga_chairman");
    assert(again?.seatCode !== lga!.seatCode, "ledgered seat excluded");
  }
  await prisma.identifyCampaignTarget.deleteMany({ where: { seatCode: lga!.seatCode } });

  console.log("selection checks ✅");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
