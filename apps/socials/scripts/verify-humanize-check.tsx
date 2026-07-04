import assert from "node:assert";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// End-to-end: a drafted identify tweet must carry NO raw codes and YES human
// role + place. The raw-code assertions strip the {url} first, because the URL
// legitimately contains role=mha & the scope code — only the CLAIM body matters.
const url = "postgresql://spending:spending@localhost:5432/spending";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const throwingPublisher: any = { publishOriginal() { throw new Error("must not publish"); } };
const settingsOff: any = { getVerifyAutoPost: async () => false };
const realSafety = new (await import("../src/intelligence/safety-filter.js")).SafetyFilter();
const { CampaignTemplateProvider } = await import("../src/campaign/campaign-template.provider.js");
const { ProposalVerifyService } = await import("../src/verify/proposal-verify.service.js");
const svc = new ProposalVerifyService(
  prisma as any, throwingPublisher, realSafety, settingsOff,
  new CampaignTemplateProvider(prisma as any));

const seeded: Record<string, string> = {};
try {
  const con = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.code, c.name AS cname, s.name AS sname
     FROM nigerian_constituencies c JOIN nigerian_states s ON s.code = c.state_code
     WHERE c.type='state' LIMIT 1`);
  assert(con[0], "need at least one state constituency in DB");
  const { code: conCode, cname, sname } = con[0];

  const off = await prisma.nigerianOfficial.create({ data: { name: "VHUM-Ident Pending" } });
  seeded.offId = off.id;
  const pos = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO official_positions (official_id, role, constituency_code, start_date)
     VALUES ($1,'mha',$2, DATE '2023-05-29') RETURNING id`, off.id, conCode);
  seeded.posId = pos[0].id;
  const ip = await prisma.dataProposal.create({
    data: { officialId: off.id, positionId: seeded.posId, targetField: "name", status: "submitted",
      proposedValue: { type: "identify", name: "VHUM-Ada Obi", role: "mha", partyAcronym: "APC",
        displayValue: `VHUM-Ada Obi (APC) for mha in ${conCode}`, constituencyCode: conCode } as any },
  });
  seeded.propId = ip.id;

  const cand = (await svc.findQualifying(500)).find((x: any) => x.proposalId === seeded.propId);
  assert(cand, "seeded identify proposal qualifies");
  const preview = await svc.buildPreview(cand);

  const body = preview.text.replace(preview.url, ""); // strip URL before raw-code checks
  assert(!/\bmha\b/i.test(body), `raw role code leaked in claim: ${preview.text}`);
  assert(!body.includes(conCode), `raw scope code leaked in claim: ${preview.text}`);
  assert(preview.text.includes("State Assembly Member"), `human role missing: ${preview.text}`);
  assert(preview.text.includes(`${cname}, ${sname}`), `human place missing: ${preview.text}`);
  assert(preview.text.includes("VHUM-Ada Obi") && preview.text.includes("APC"), "name+party present");
  assert(!preview.text.includes("{") && !preview.text.includes("()"), "no leftover slot / empty parens");
  assert(preview.safe, `safety must pass (Assembly no longer trips 'ass'): ${preview.text}`);
  assert(!preview.text.includes("The proposer shared this source"), "unsourced has no source note");

  // sourced proposal → tweet carries the proposer-attributed source line
  const SRC = "https://example.org/proof";
  await prisma.dataProposal.update({
    where: { id: seeded.propId },
    data: {
      proposedValue: { type: "identify", name: "VHUM-Ada Obi", role: "mha",
        partyAcronym: "APC", displayValue: "x",
        constituencyCode: (cand as any).constituencyCode, sourceUrl: SRC } as any,
      sourceUrl: SRC,
    },
  });
  const cand2 = (await svc.findQualifying(500)).find((x: any) => x.proposalId === seeded.propId);
  const previewSourced = await svc.buildPreview(cand2);
  assert(previewSourced.text.includes(`The proposer shared this source: ${SRC}`),
    `sourced note missing: ${previewSourced.text}`);
  assert(previewSourced.text.includes("\n\n"), "sourced tweet multi-line");
  assert(!/[—–]/.test(previewSourced.text), "no em dash");
  assert(previewSourced.safe, "sourced safe");

  console.log("verify-humanize-check OK ::", preview.text);
} finally {
  if (seeded.propId) await prisma.dataProposal.delete({ where: { id: seeded.propId } }).catch(() => {});
  if (seeded.posId) await prisma.$executeRawUnsafe(`DELETE FROM official_positions WHERE id=$1::uuid`, seeded.posId).catch(() => {});
  await prisma.nigerianOfficial.deleteMany({ where: { name: { startsWith: "VHUM-" } } }).catch(() => {});
  await prisma.$disconnect();
}
