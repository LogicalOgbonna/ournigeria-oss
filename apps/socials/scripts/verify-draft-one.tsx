import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Drafts a proposal_verify tweet for ONE specific proposal id (park path, toggle OFF).
// Uses the REAL ProposalVerifyService.processProposal code path. No cleanup — the
// draft persists so it can be reviewed in the dashboard reply queue.
const PROPOSAL_ID = process.argv[2];
if (!PROPOSAL_ID) { console.error("usage: verify-draft-one.tsx <proposalId>"); process.exit(1); }

const url = "postgresql://spending:spending@localhost:5432/spending";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const throwingPublisher: any = {
  publishOriginal() { throw new Error("publishOriginal must NOT be called (toggle OFF)"); },
};
const settingsOff: any = { getVerifyAutoPost: async () => false };
const realSafety = new (await import("../src/intelligence/safety-filter.js")).SafetyFilter();
const { CampaignTemplateProvider } = await import("../src/campaign/campaign-template.provider.js");
const { ProposalVerifyService } = await import("../src/verify/proposal-verify.service.js");
const svc = new ProposalVerifyService(
  prisma as any, throwingPublisher, realSafety, settingsOff,
  new CampaignTemplateProvider(prisma as any),
);

try {
  const cands = await svc.findQualifying(500);
  const mine = cands.find((x: any) => x.proposalId === PROPOSAL_ID);
  if (!mine) {
    console.error(`proposal ${PROPOSAL_ID} not in qualifying set (already served, resolved, or not identify/change)`);
    process.exit(2);
  }
  const res = await svc.processProposal(mine, { dryRun: false });
  if (!res) { console.error("processProposal returned null (not claimed / unsafe / resolved)"); process.exit(3); }

  const draft = await prisma.socialPost.findFirst({
    where: { postType: "proposal_verify", status: "drafted", content: res.text },
    orderBy: { createdAt: "desc" },
  });
  const ledger = await prisma.proposalVerifyPost.findFirst({
    where: { proposalId: PROPOSAL_ID }, orderBy: { createdAt: "desc" },
  });

  console.log(JSON.stringify({
    ok: true,
    claimed: res.claimed,
    safe: res.safe,
    kind: res.kind,
    tweet: res.text,
    url: res.url,
    socialPostId: draft?.id,
    reviewStatus: draft?.reviewStatus,
    ledgerStatus: ledger?.status,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
