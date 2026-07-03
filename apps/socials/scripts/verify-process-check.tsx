import assert from "node:assert";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const url = "postgresql://spending:spending@localhost:5432/spending";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

let published = false;
const throwingPublisher: any = { publishOriginal() { published = true; throw new Error("publishOriginal must NOT be called (toggle OFF)"); } };
const settingsOff: any = { getVerifyAutoPost: async () => false };
const realSafety = new (await import("../src/intelligence/safety-filter.js")).SafetyFilter();
const { ProposalVerifyService } = await import("../src/verify/proposal-verify.service.js");
const svc = new ProposalVerifyService(prisma as any, throwingPublisher, realSafety, settingsOff);

const seeded: Record<string, string> = {};
const createdPostIds: string[] = [];
try {
  // ---- Task-4 seeding block: throwaway ward → change official + identify seat/proposal ----
  // A real ward (local DB has wards) → its lga + state resolve via joins.
  const wd = await prisma.$queryRawUnsafe<any[]>(`SELECT code, lga_code FROM nigerian_wards LIMIT 1`);
  const wardCode = wd[0].code as string;

  const off = await prisma.nigerianOfficial.create({ data: { name: "VTEST-Change Official", slug: `vtest-change-${Date.now()}` } });
  seeded.officialId = off.id;

  const pOff = await prisma.nigerianOfficial.create({ data: { name: "VTEST-Identify Pending" } });
  seeded.pOffId = pOff.id;
  // councilor seat: ONLY ward_code + start_date (exclusive-jurisdiction CHECK).
  const pos = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO official_positions (official_id, role, ward_code, start_date)
     VALUES ($1,'councilor',$2, DATE '2023-05-29') RETURNING id`,
    pOff.id, wardCode);
  seeded.positionId = pos[0].id;

  const ip = await prisma.dataProposal.create({
    data: {
      officialId: pOff.id, positionId: seeded.positionId, targetField: "name", status: "submitted",
      proposedValue: { type: "identify", name: "VTEST-Eze Udeh", role: "councilor", partyAcronym: "APC",
        displayValue: "your councillor is VTEST-Eze Udeh (APC)", wardCode } as any,
    },
  });
  seeded.identifyPropId = ip.id;

  const cp = await prisma.dataProposal.create({
    data: { officialId: off.id, targetField: "partyAcronym", status: "submitted", proposedValue: { value: "PDP" } as any },
  });
  seeded.changePropId = cp.id;

  // (a) dry run — both previews build, no writes.
  // Shared dev DB holds other real qualifying proposals, so CAP-limited runOnce()
  // may not surface our fresh (newest) seeds. Drive the identical dryRun code path
  // (processProposal) on the two seeded candidates directly for determinism.
  const dryCands = await svc.findQualifying(500);
  const dryI = dryCands.find((x: any) => x.proposalId === seeded.identifyPropId)!;
  const dryC = dryCands.find((x: any) => x.proposalId === seeded.changePropId)!;
  assert(dryI && dryC, "both candidates qualify for dry run");
  const previews = [
    await svc.processProposal(dryI, { dryRun: true }),
    await svc.processProposal(dryC, { dryRun: true }),
  ];
  const dpi = previews.find((x: any) => x && x.proposalId === seeded.identifyPropId)!;
  const dpc = previews.find((x: any) => x && x.proposalId === seeded.changePropId)!;
  assert(dpi && dpc, "both candidates previewed");
  assert(dpi.url.includes("utm_campaign=confirm_cta") && dpc.url.includes("utm_campaign=confirm_cta"), "confirm_cta url");
  assert(dpi.text.includes("VTEST-Eze Udeh") && !dpi.text.includes("{"), "identify template filled");
  assert(dpc.text.includes("Political Party") && dpc.text.includes("PDP") && !dpc.text.includes("{"), "change humanized + filled");
  assert(dpi.safe && dpc.safe, "safety pass");
  const ledgerAfterDry = await prisma.proposalVerifyPost.count({ where: { proposalId: { in: [seeded.identifyPropId, seeded.changePropId] } } });
  assert(ledgerAfterDry === 0, "dryRun made no ledger rows");
  assert(!published, "dryRun did not publish");

  // (b) park path (toggle OFF) for the change proposal
  const cand = (await svc.findQualifying(50)).find((x: any) => x.proposalId === seeded.changePropId)!;
  const res = await svc.processProposal(cand, { dryRun: false });
  assert(res && res.claimed, "change claimed + processed");
  assert(!published, "publisher NOT called on park path");
  const draft = await prisma.socialPost.findFirst({ where: { postType: "proposal_verify", status: "drafted", content: res!.text } });
  assert(draft && draft.reviewStatus === "pending", "proposal_verify draft parked pending");
  createdPostIds.push(draft!.id);
  const ledgerRow = await prisma.proposalVerifyPost.findFirst({ where: { anchorType: "proposal", anchorId: seeded.changePropId } });
  assert(ledgerRow && ledgerRow.status === "drafted" && ledgerRow.socialPostId === draft!.id, "ledger drafted + linked");

  // (c) dedup — served anchor drops out
  const again = await svc.findQualifying(50);
  assert(!again.some((x: any) => x.proposalId === seeded.changePropId), "served change anchor excluded");

  console.log("verify-process-check OK");
} finally {
  for (const id of createdPostIds) await prisma.socialPost.delete({ where: { id } }).catch(() => {});
  await prisma.proposalVerifyPost.deleteMany({ where: { proposalId: { in: Object.values(seeded).filter(Boolean) } } }).catch(() => {});
  if (seeded.identifyPropId) await prisma.dataProposal.delete({ where: { id: seeded.identifyPropId } }).catch(() => {});
  if (seeded.changePropId) await prisma.dataProposal.delete({ where: { id: seeded.changePropId } }).catch(() => {});
  if (seeded.positionId) await prisma.$executeRawUnsafe(`DELETE FROM official_positions WHERE id = $1::uuid`, seeded.positionId).catch(() => {});
  await prisma.nigerianOfficial.deleteMany({ where: { name: { startsWith: "VTEST-" } } }).catch(() => {});
  await prisma.$disconnect();
}
