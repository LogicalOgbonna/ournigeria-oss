import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { AuditService } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { bustRolesCache } from "../../admin/roles.util";
import { AdminCampaignsService } from "../admin-campaigns.service";

const revalidationNoop = { electionGateChanged() {}, campaignsChanged() {}, campaignChanged() {} } as never;

/** ImageStorageService needs S3 config to construct; only isStoredUrl matters here. */
const imageStub = { isStoredUrl: (u: string) => u.startsWith("https://cdn.ournigeria.ng/") || u.includes(".s3.") } as never;

/**
 * Attachment-on-create (plan 68 §2 D10.2), integration on the live DB: a new
 * ticket resolves its election EVENT via the D10.1 subsumption rule — exactly
 * one match ⇒ election_id set; none/ambiguous ⇒ null, never a blocked create.
 * Years 2094–2097 keep these fixtures clear of the other campaign suites
 * (2098/2099) and the real seeded events (2026/2027).
 */
describe("AdminCampaignsService election attachment", () => {
  const DB = process.env.DATABASE_URL;
  let prisma: PrismaService;
  let svc: AdminCampaignsService;
  const tag = Date.now().toString(36);
  const adminIds: string[] = [];
  const electionIds: string[] = [];
  let writer: string;
  let reviewer: string;

  const actor = (id: string) => ({ actorType: "staff" as const, actorId: id });

  async function mkAdmin(role: string) {
    const a = await prisma.adminUser.create({
      data: { email: `zzz-att-${role}-${tag}@test.local`, passwordHash: "x", name: `Zzz Att ${role}` },
      select: { id: true },
    });
    await prisma.roleAssignment.create({
      data: { principalType: "staff", principalId: a.id, role, grantedById: a.id },
    });
    await bustRolesCache("staff", a.id);
    adminIds.push(a.id);
    return a.id;
  }

  async function mkEvent(data: { slug: string; office: string; year: number; stateCode?: string }) {
    const row = await prisma.election.create({ data, select: { id: true } });
    electionIds.push(row.id);
    return row.id;
  }

  const draftInput = (n: string, year: number, scope: Record<string, string> = {}) => ({
    electionType: "presidential" as const,
    year,
    partyAcronym: "APC",
    slug: `zzz-att-${n}-${tag}`,
    candidate: { name: `Zzz Att Cand ${n} ${tag}` },
    factionLabel: `zzz-att-${n}-${tag}`,
    ...scope,
  });

  beforeAll(async () => {
    if (!DB) throw new Error("DATABASE_URL not set");
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const audit = new AuditService(prisma, new AuditCryptoService(prisma));
    svc = new AdminCampaignsService(prisma, audit, imageStub, revalidationNoop);
    writer = await mkAdmin("campaign_manager");
    reviewer = await mkAdmin("review_manager");
  });

  afterAll(async () => {
    await prisma.campaign.deleteMany({ where: { slug: { startsWith: `zzz-att-` } } });
    await prisma.election.deleteMany({ where: { id: { in: electionIds } } });
    await prisma.roleAssignment.deleteMany({ where: { principalId: { in: adminIds } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
    await prisma.onModuleDestroy();
  });

  it("create attaches the ticket when exactly one event subsumes its race", async () => {
    const eventId = await mkEvent({ slug: `zzz-ev-pres-${tag}`, office: "presidential", year: 2097 });
    const row = await svc.create(actor(writer), draftInput("match", 2097));
    expect(row.electionId).toBe(eventId);
  });

  it("create leaves election_id null when no event exists for the race", async () => {
    const row = await svc.create(actor(writer), draftInput("none", 2094));
    expect(row.electionId).toBeNull();
  });

  it("a scoped event beats a nationwide sibling (specificity tiebreak)", async () => {
    await mkEvent({ slug: `zzz-ev-gub-nat-${tag}`, office: "gubernatorial", year: 2096 });
    const scoped = await mkEvent({ slug: `zzz-ev-gub-osun-${tag}`, office: "gubernatorial", year: 2096, stateCode: "osun" });
    const row = await svc.create(actor(writer), {
      ...draftInput("gub", 2096, { stateCode: "osun" }),
      electionType: "gubernatorial" as never,
    });
    expect(row.electionId).toBe(scoped);
  });

  it("approve re-resolves a null attachment for a ticket created before its event", async () => {
    const row = await svc.create(actor(writer), draftInput("late", 2095));
    expect(row.electionId).toBeNull();
    const eventId = await mkEvent({ slug: `zzz-ev-late-${tag}`, office: "presidential", year: 2095 });
    await svc.submit(actor(writer), row.id);
    const live = await svc.approve(actor(reviewer), reviewer, row.id, "attach on approve");
    expect(live.electionId).toBe(eventId);
  });
});
