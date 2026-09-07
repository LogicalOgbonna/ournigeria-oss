import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { AuditService } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { bustRolesCache } from "../../admin/roles.util";
import { AdminCampaignsService } from "../admin-campaigns.service";

/** ImageStorageService needs S3 config to construct; only isStoredUrl matters here. */
const imageStub = { isStoredUrl: (u: string) => u.startsWith("https://cdn.ournigeria.ng/") || u.includes(".s3.") } as never;

/**
 * Integration, live DB. Two admins are created directly in admin_users with
 * role assignments (campaign_manager = writer, review_manager = reviewer); a
 * third holds super_admin. Everything is tagged and deleted in afterAll.
 */
describe("AdminCampaignsService", () => {
  const DB = process.env.DATABASE_URL;
  let prisma: PrismaService;
  let svc: AdminCampaignsService;
  const tag = Date.now().toString(36);
  const YEAR = 2098;
  const adminIds: string[] = [];
  const campaignIds: string[] = [];
  let writer: string;
  let writer2: string;
  let reviewer: string;
  let superAdmin: string;

  const actor = (id: string) => ({ actorType: "staff" as const, actorId: id });

  async function mkAdmin(role: string) {
    const a = await prisma.adminUser.create({
      data: { email: `zzz-${role}-${tag}-${adminIds.length}@test.local`, passwordHash: "x", name: `Zzz ${role}` },
      select: { id: true },
    });
    await prisma.roleAssignment.create({
      data: { principalType: "staff", principalId: a.id, role, grantedById: a.id },
    });
    await bustRolesCache("staff", a.id);
    adminIds.push(a.id);
    return a.id;
  }

  const draftInput = (n: string) => ({
    electionType: "presidential" as const,
    year: YEAR,
    partyAcronym: "APC",
    slug: `zzz-adm-${n}-${tag}`,
    candidate: { name: `Zzz Cand ${n} ${tag}` },
    runningMate: { name: `Zzz Mate ${n} ${tag}` },
    factionLabel: `zzz-${n}-${tag}`,
  });

  beforeAll(async () => {
    if (!DB) throw new Error("DATABASE_URL not set");
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const audit = new AuditService(prisma, new AuditCryptoService(prisma));
    svc = new AdminCampaignsService(prisma, audit, imageStub);
    writer = await mkAdmin("campaign_manager");
    writer2 = await mkAdmin("campaign_manager");
    reviewer = await mkAdmin("review_manager");
    superAdmin = await mkAdmin("super_admin");
  });

  afterAll(async () => {
    const rows = await prisma.campaign.findMany({ where: { slug: { startsWith: `zzz-adm-` } }, select: { id: true, candidateOfficialId: true, runningMateOfficialId: true } });
    await prisma.campaign.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    const officials = rows.flatMap((r) => [r.candidateOfficialId, r.runningMateOfficialId]).filter((x): x is string => Boolean(x));
    await prisma.officialElection.deleteMany({ where: { officialId: { in: officials } } });
    await prisma.nigerianOfficial.deleteMany({ where: { id: { in: officials } } });
    await prisma.roleAssignment.deleteMany({ where: { principalId: { in: adminIds } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
    await prisma.onModuleDestroy();
  });

  it("create makes a draft with name-only people and no anchor yet", async () => {
    const row = await svc.create(actor(writer), draftInput("a"));
    campaignIds.push(row.id);
    expect(row.status).toBe("draft");
    expect(row.reviewStatus).toBe("unreviewed");
    expect(row.candidateOfficialId).toBeNull();
    expect(row.officialElectionId).toBeNull();
  });

  it("create with an official id anchors a pending official_elections row", async () => {
    const off = await prisma.nigerianOfficial.create({ data: { name: `Zzz Off ${tag}`, slug: `zzz-adm-off-${tag}` }, select: { id: true } });
    const row = await svc.create(actor(writer), { ...draftInput("b"), candidate: { officialId: off.id } });
    campaignIds.push(row.id);
    expect(row.candidateOfficialId).toBe(off.id);
    const anchor = await prisma.officialElection.findUniqueOrThrow({ where: { id: row.officialElectionId! } });
    expect(anchor).toMatchObject({ isPrimary: true, result: "pending", electionType: "presidential" });
  });

  it("patch strips status and requires a reason only once the row is not draft", async () => {
    const row = await svc.create(actor(writer), draftInput("c"));
    campaignIds.push(row.id);
    const patched = await svc.patch(actor(writer), row.id, { visionLine: "v1", status: "active" } as never);
    expect(patched.status).toBe("draft");
    expect(patched.visionLine).toBe("v1");
  });

  it("submit → approve publishes, sets reviewed_by and flips the anchor to won", async () => {
    const row = await svc.create(actor(writer), { ...draftInput("d"), candidate: { officialId: (await prisma.nigerianOfficial.create({ data: { name: `Zzz Off D ${tag}`, slug: `zzz-adm-offd-${tag}` }, select: { id: true } })).id } });
    campaignIds.push(row.id);
    await expect(svc.approve(actor(reviewer), reviewer, row.id, "not submitted")).rejects.toThrow(/submitted/);
    await svc.submit(actor(writer), row.id);
    const live = await svc.approve(actor(reviewer), reviewer, row.id, "looks right");
    expect(live).toMatchObject({ status: "active", reviewStatus: "reviewed", reviewedBy: reviewer, reviewNote: null, reviewRequestedAt: null });
    const anchor = await prisma.officialElection.findUniqueOrThrow({ where: { id: row.officialElectionId! } });
    expect(anchor.result).toBe("won");
  });

  it("the writer who submitted cannot approve, even holding both roles", async () => {
    await prisma.roleAssignment.create({ data: { principalType: "staff", principalId: writer, role: "review_manager", grantedById: writer } });
    await bustRolesCache("staff", writer);
    const row = await svc.create(actor(writer), draftInput("e"));
    campaignIds.push(row.id);
    await svc.submit(actor(writer), row.id);
    await expect(svc.approve(actor(writer), writer, row.id, "self")).rejects.toThrow(/cannot approve/);
    // A second writer's later typo fix does not launder the first writer's edit.
    await svc.patch(actor(writer2), row.id, { fineprint: "typo fixed" });
    await expect(svc.approve(actor(writer), writer, row.id, "self")).rejects.toThrow(/cannot approve/);
    await expect(svc.approve(actor(reviewer), reviewer, row.id, "ok")).resolves.toMatchObject({ status: "active" });
    await prisma.roleAssignment.deleteMany({ where: { principalId: writer, role: "review_manager" } });
    await bustRolesCache("staff", writer);
  });

  it("super_admin may self-approve and the exemption is audited", async () => {
    const row = await svc.create(actor(superAdmin), draftInput("f"));
    campaignIds.push(row.id);
    await svc.submit(actor(superAdmin), row.id);
    await expect(svc.approve(actor(superAdmin), superAdmin, row.id, "solo")).resolves.toMatchObject({ status: "active" });
    const ev = await prisma.auditEvent.findFirst({ where: { action: "campaign.self_approved", targetId: row.id } });
    expect(ev).not.toBeNull();
  });

  it("an edit to a live ticket keeps it live and flags re-review", async () => {
    const row = await prisma.campaign.findUniqueOrThrow({ where: { slug: `zzz-adm-d-${tag}` } });
    await expect(svc.patch(actor(writer), row.id, { visionLine: "v2" })).rejects.toThrow(/reason/);
    const edited = await svc.patch(actor(writer), row.id, { visionLine: "v2", reason: "wording" });
    expect(edited).toMatchObject({ status: "active", reviewStatus: "unreviewed", reviewRequestedBy: writer });
    const confirmed = await svc.approve(actor(reviewer), reviewer, row.id, "confirmed");
    expect(confirmed.reviewStatus).toBe("reviewed");
  });

  it("lowering confidence on a public row is a review act", async () => {
    const row = await prisma.campaign.findUniqueOrThrow({ where: { slug: `zzz-adm-d-${tag}` } });
    await expect(svc.patch(actor(writer), row.id, { confidence: "low", reason: "doubt" })).rejects.toThrow(/campaigns.review/);
  });

  it("approve refuses when a public ticket already holds the race key", async () => {
    const live = await prisma.campaign.findUniqueOrThrow({ where: { slug: `zzz-adm-d-${tag}` } });
    const dup = await svc.create(actor(writer), { ...draftInput("g"), factionLabel: live.factionLabel });
    campaignIds.push(dup.id);
    await svc.submit(actor(writer), dup.id);
    await expect(svc.approve(actor(reviewer), reviewer, dup.id, "dup")).rejects.toThrow(new RegExp(`withdraw the existing ${live.slug}`));
  });

  it("no verb moves a public row back to draft, and delete is draft-only", async () => {
    const live = await prisma.campaign.findUniqueOrThrow({ where: { slug: `zzz-adm-d-${tag}` } });
    await expect(svc.remove(actor(writer), live.id)).rejects.toThrow(/draft/);
    await expect(svc.requestChanges(actor(reviewer), live.id, "back to draft?")).rejects.toThrow(/from draft/);
  });

  it("unpublish hides, approve re-publishes through the race-key guard; withdraw needs review", async () => {
    const live = await prisma.campaign.findUniqueOrThrow({ where: { slug: `zzz-adm-d-${tag}` } });
    const hidden = await svc.unpublish(actor(reviewer), live.id, "pause");
    expect(hidden.status).toBe("suspended");
    // the anchor must follow the ticket off the ballot, not stay 'won'
    expect((await prisma.officialElection.findUniqueOrThrow({ where: { id: live.officialElectionId! } })).result).toBe("pending");
    const back = await svc.approve(actor(reviewer), reviewer, live.id, "resume");
    expect(back.status).toBe("active");
    expect((await prisma.officialElection.findUniqueOrThrow({ where: { id: live.officialElectionId! } })).result).toBe("won");
    const gone = await svc.withdraw(actor(reviewer), live.id, "candidate withdrew");
    expect(gone.status).toBe("withdrawn");
    const anchor = await prisma.officialElection.findUniqueOrThrow({ where: { id: live.officialElectionId! } });
    expect(anchor.result).toBe("withdrawn");
  });

  it("order renumbers a race, rejects ids from another race, leaves unlisted ids unranked", async () => {
    const a = await svc.create(actor(writer), { ...draftInput("o1"), year: YEAR - 1 });
    const b = await svc.create(actor(writer), { ...draftInput("o2"), year: YEAR - 1 });
    const c = await svc.create(actor(writer), { ...draftInput("o3"), year: YEAR - 1 });
    campaignIds.push(a.id, b.id, c.id);
    const key = { electionType: "presidential" as const, year: YEAR - 1 };
    await svc.order(actor(writer), { ...key, ids: [c.id, a.id] });
    const ranks = Object.fromEntries((await prisma.campaign.findMany({ where: { id: { in: [a.id, b.id, c.id] } }, select: { id: true, displayOrder: true } })).map((r) => [r.id, r.displayOrder]));
    expect(ranks).toEqual({ [c.id]: 1, [a.id]: 2, [b.id]: null });
    const other = await prisma.campaign.findFirstOrThrow({ where: { slug: `zzz-adm-a-${tag}` } });
    await expect(svc.order(actor(writer), { ...key, ids: [other.id] })).rejects.toThrow(/not in this race/);
  });

  it("queue holds submitted drafts only — not an untouched draft, not a dissolved ticket", async () => {
    const unsubmitted = await svc.create(actor(writer), draftInput("q1"));
    const submitted = await svc.create(actor(writer), draftInput("q2"));
    const dissolved = await svc.create(actor(writer), draftInput("q3"));
    campaignIds.push(unsubmitted.id, submitted.id, dissolved.id);
    await svc.submit(actor(writer), submitted.id);
    // submit first so the row carries reviewRequestedAt: only `status` can keep it out
    await svc.submit(actor(writer), dissolved.id);
    await prisma.campaign.update({ where: { id: dissolved.id }, data: { status: "dissolved" } });

    const queued = new Set((await svc.queue()).map((r) => r.id));
    expect(queued.has(submitted.id)).toBe(true);
    expect(queued.has(unsubmitted.id)).toBe(false);
    expect(queued.has(dissolved.id)).toBe(false);
  });

  it("request-changes needs a draft that was actually submitted", async () => {
    const row = await svc.create(actor(writer), draftInput("rc"));
    campaignIds.push(row.id);
    await expect(svc.requestChanges(actor(reviewer), row.id, "fix the bio")).rejects.toThrow(/submitted/);
    await svc.submit(actor(writer), row.id);
    await expect(svc.requestChanges(actor(reviewer), row.id, "fix the bio")).resolves.toMatchObject({ status: "draft", reviewStatus: "disputed" });
  });

  it("create rejects a taken explicit slug but auto-suffixes a derived one", async () => {
    const first = await svc.create(actor(writer), draftInput("s1"));
    campaignIds.push(first.id);
    await expect(svc.create(actor(writer), { ...draftInput("s2"), slug: first.slug })).rejects.toThrow(/taken/);

    const derived = (faction: string) => ({
      electionType: "presidential" as const,
      year: YEAR,
      partyAcronym: "APC",
      candidate: { name: `Zzz Adm Derived ${tag}` },
      factionLabel: faction,
    });
    const d1 = await svc.create(actor(writer), derived(`zzz-d1-${tag}`));
    const d2 = await svc.create(actor(writer), derived(`zzz-d2-${tag}`));
    campaignIds.push(d1.id, d2.id);
    expect(d1.slug).toBe(`zzz-adm-derived-${tag}`);
    expect(d2.slug).toBe(`${d1.slug}-2`);
  });
});
