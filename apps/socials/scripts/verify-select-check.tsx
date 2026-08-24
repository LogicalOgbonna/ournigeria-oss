import assert from "node:assert";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const url = "postgresql://spending:spending@localhost:5432/spending";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const throwingPublisher: any = { publishOriginal() { throw new Error("publishOriginal must NOT be called in tests"); } };
const settingsStub: any = { getVerifyAutoPost: async () => false };
const safetyStub: any = { check: () => ({ safe: true, warnings: [], blocked: false }) };

const { CampaignTemplateProvider } = await import("../src/campaign/campaign-template.provider.js");
const { ProposalVerifyService } = await import("../src/verify/proposal-verify.service.js");
const svc = new ProposalVerifyService(prisma as any, throwingPublisher, safetyStub, settingsStub, new CampaignTemplateProvider(prisma as any));

const seeded = { officialId: "", pOffId: "", positionId: "", identifyPropId: "", changePropId: "" };
try {
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

  const q = await svc.findQualifying(50);
  const ids = new Set(q.map((x: any) => x.proposalId));
  assert(ids.has(seeded.identifyPropId), "identify proposal selected");
  assert(ids.has(seeded.changePropId), "change proposal selected");
  const idn = q.find((x: any) => x.proposalId === seeded.identifyPropId)!;
  assert(idn.anchorType === "seat" && idn.anchorId === seeded.positionId, "identify anchor = seat/positionId");
  assert(idn.displayValue!.includes("VTEST-Eze Udeh"), "identify displayValue carried");
  assert(!!idn.stateCode && idn.level === "ward", "councilor state resolved + level=ward");
  const chg = q.find((x: any) => x.proposalId === seeded.changePropId)!;
  assert(chg.anchorType === "proposal" && chg.anchorId === seeded.changePropId, "change anchor = proposal/id");
  assert(chg.targetField === "partyAcronym" && chg.proposedScalar === "PDP", "change scalar carried");
  assert(chg.slug!.startsWith("vtest-change-"), "change slug carried");

  const [a, b] = await Promise.all([svc.claimVerify(idn), svc.claimVerify(idn)]);
  assert((a ? 1 : 0) + (b ? 1 : 0) === 1, "exactly one claim winner");

  const q2 = await svc.findQualifying(50);
  assert(!q2.some((x: any) => x.proposalId === seeded.identifyPropId), "claimed seat excluded on re-select");
  assert(q2.some((x: any) => x.proposalId === seeded.changePropId), "unclaimed change still selectable");

  console.log("verify-select-check OK");
} finally {
  await prisma.$executeRawUnsafe(
    `DELETE FROM proposal_verify_posts WHERE proposal_id IN ($1::uuid,$2::uuid)`,
    seeded.identifyPropId || "00000000-0000-0000-0000-000000000000",
    seeded.changePropId || "00000000-0000-0000-0000-000000000000").catch(() => {});
  if (seeded.identifyPropId) await prisma.dataProposal.delete({ where: { id: seeded.identifyPropId } }).catch(() => {});
  if (seeded.changePropId) await prisma.dataProposal.delete({ where: { id: seeded.changePropId } }).catch(() => {});
  if (seeded.positionId) await prisma.$executeRawUnsafe(`DELETE FROM official_positions WHERE id = $1::uuid`, seeded.positionId).catch(() => {});
  await prisma.nigerianOfficial.deleteMany({ where: { name: { startsWith: "VTEST-" } } }).catch(() => {});
  await prisma.$disconnect();
}
