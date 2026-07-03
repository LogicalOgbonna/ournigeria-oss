import assert from "node:assert";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const url = "postgresql://spending:spending@localhost:5432/spending";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const throwingPublisher: any = { publishOriginal() { throw new Error("X publish failed (simulated)"); } };
const settingsOn: any = { getVerifyAutoPost: async () => true }; // toggle ON → auto-post path
const safetyStub: any = { check: () => ({ safe: true, warnings: [], blocked: false }) };
const { ProposalVerifyService } = await import("../src/verify/proposal-verify.service.js");
const svc = new ProposalVerifyService(prisma as any, throwingPublisher, safetyStub, settingsOn);

const seeded: Record<string, string> = {};
try {
  // seed a throwaway change official (+slug) + a partyAcronym change proposal → set seeded.changePropId
  const off = await prisma.nigerianOfficial.create({ data: { name: "VTEST-Fail Official", slug: `vtest-fail-${Date.now()}` } });
  seeded.officialId = off.id;
  const cp = await prisma.dataProposal.create({
    data: { officialId: off.id, targetField: "partyAcronym", status: "submitted", proposedValue: { value: "PDP" } as any },
  });
  seeded.changePropId = cp.id;

  const cand = (await svc.findQualifying(500)).find((x: any) => x.proposalId === seeded.changePropId)!;
  assert(cand, "seeded change candidate selected");
  const res = await svc.processProposal(cand, { dryRun: false });
  assert(res === null, "auto-post failure returns null");

  // NO published post created:
  const posted = await prisma.socialPost.count({ where: { postType: "proposal_verify", status: "published", content: { contains: "VTEST-Fail" } } });
  assert(posted === 0, "no published social_post on failure");
  // ledger row flipped to 'failed' (not stuck at 'claiming'):
  const row = await prisma.proposalVerifyPost.findFirst({ where: { anchorType: "proposal", anchorId: seeded.changePropId } });
  assert(row && row.status === "failed", `ledger marked failed (got ${row?.status})`);

  console.log("verify-publishfail-check OK");
} finally {
  await prisma.proposalVerifyPost.deleteMany({ where: { proposalId: seeded.changePropId || "00000000-0000-0000-0000-000000000000" } }).catch(() => {});
  if (seeded.changePropId) await prisma.dataProposal.delete({ where: { id: seeded.changePropId } }).catch(() => {});
  await prisma.nigerianOfficial.deleteMany({ where: { name: { startsWith: "VTEST-" } } }).catch(() => {});
  await prisma.$disconnect();
}
