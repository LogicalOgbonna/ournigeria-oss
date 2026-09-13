import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@ournigeria/database";
import { AuditService } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { PermissionsGuard } from "../../admin/permissions.guard";
import { bustRolesCache } from "../../admin/roles.util";
import { AdminElectionsController } from "../admin-elections.controller";
import { AdminElectionsService, GATE_SETTING_KEY } from "../admin-elections.service";
import { setSetting } from "../../config/settings-store";

/**
 * Integration, live DB. Two admins are created directly in admin_users with
 * role assignments (campaign_manager = writer holding elections.write,
 * review_manager = reviewer holding campaigns.review). The D5 verb auth
 * matrix runs through the REAL PermissionsGuard against the controller's
 * metadata. Elections use far-future years 2090–2096 (uq_elections_event is
 * NULLS NOT DISTINCT, so nationwide events collide across runs otherwise)
 * and are deleted by that year range in afterAll.
 */
describe("AdminElectionsService", () => {
  const DB = process.env.DATABASE_URL;
  let prisma: PrismaService;
  let svc: AdminElectionsService;
  let guard: PermissionsGuard;
  const tag = Date.now().toString(36);
  const adminIds: string[] = [];
  let writer: string;
  let reviewer: string;
  let states: string[] = [];
  let priorGate: { value: string } | null | undefined;

  const actor = (id: string) => ({ actorType: "staff" as const, actorId: id });

  const guardCtx = (handler: keyof AdminElectionsController, adminId: string) =>
    ({
      getHandler: () => (AdminElectionsController.prototype as never)[handler],
      getClass: () => AdminElectionsController,
      switchToHttp: () => ({ getRequest: () => ({ adminId, headers: {}, method: "POST", url: "/admin/elections" }) }),
    }) as never;

  async function mkAdmin(role: string) {
    const a = await prisma.adminUser.create({
      data: { email: `zzz-ele-${role}-${tag}-${adminIds.length}@test.local`, passwordHash: "x", name: `Zzz ${role}` },
      select: { id: true },
    });
    await prisma.roleAssignment.create({ data: { principalType: "staff", principalId: a.id, role, grantedById: a.id } });
    await bustRolesCache("staff", a.id);
    adminIds.push(a.id);
    return a.id;
  }

  async function cleanElections() {
    await prisma.election.deleteMany({ where: { year: { gte: 2090, lte: 2096 } } });
  }

  beforeAll(async () => {
    if (!DB) throw new Error("DATABASE_URL not set");
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const audit = new AuditService(prisma, new AuditCryptoService(prisma));
    svc = new AdminElectionsService(prisma, audit);
    guard = new PermissionsGuard(new Reflector(), prisma);
    writer = await mkAdmin("campaign_manager");
    reviewer = await mkAdmin("review_manager");
    states = (await prisma.nigerianState.findMany({ take: 2, orderBy: { code: "asc" }, select: { code: true } })).map((s) => s.code);
    if (states.length < 2) throw new Error("dev DB must have seeded nigerian_states");
    priorGate = await prisma.systemSetting.findUnique({ where: { key: GATE_SETTING_KEY }, select: { value: true } });
    await cleanElections();
  });

  afterAll(async () => {
    await cleanElections();
    if (priorGate) {
      await prisma.systemSetting.update({ where: { key: GATE_SETTING_KEY }, data: { value: priorGate.value } });
      setSetting(GATE_SETTING_KEY, priorGate.value);
    } else {
      await prisma.systemSetting.deleteMany({ where: { key: GATE_SETTING_KEY } });
      setSetting(GATE_SETTING_KEY, "true");
    }
    await prisma.roleAssignment.deleteMany({ where: { principalId: { in: adminIds } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
    await prisma.onModuleDestroy();
  });

  // ---------- verb auth matrix (D5), through the real guard ----------

  it("writer can create but not publish; reviewer can publish but not create", async () => {
    await expect(guard.canActivate(guardCtx("create", writer))).resolves.toBe(true);
    await expect(guard.canActivate(guardCtx("patch", writer))).resolves.toBe(true);
    await expect(guard.canActivate(guardCtx("publish", writer))).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(guardCtx("gate", writer))).rejects.toThrow(ForbiddenException);

    await expect(guard.canActivate(guardCtx("publish", reviewer))).resolves.toBe(true);
    await expect(guard.canActivate(guardCtx("gate", reviewer))).resolves.toBe(true);
    await expect(guard.canActivate(guardCtx("create", reviewer))).rejects.toThrow(ForbiddenException);
    // reads are open to both sides of the split
    await expect(guard.canActivate(guardCtx("list", writer))).resolves.toBe(true);
    await expect(guard.canActivate(guardCtx("list", reviewer))).resolves.toBe(true);
  });

  // ---------- create ----------

  it("create makes an unpublished event with a derived slug and audits election.created", async () => {
    const row = await svc.create(actor(writer), {
      office: "presidential",
      year: 2090,
      round: "general",
      datePrecision: "day",
      electionDate: "2090-01-16",
      excludedStates: [],
    });
    expect(row).toMatchObject({ slug: "2090-presidential", published: false, status: "scheduled", reviewStatus: "unreviewed" });
    const ev = await prisma.auditEvent.findFirst({ where: { action: "election.created", targetId: row.id } });
    expect(ev?.actorId).toBe(writer);
  });

  it("a duplicate (office, year, round, scope) event is a 409, not a 500", async () => {
    await expect(
      svc.create(actor(writer), { office: "presidential", year: 2090, round: "general", datePrecision: "year", excludedStates: [] }),
    ).rejects.toThrow(/already exists/);
  });

  it("a scoped event derives its slug from the state and fills state from narrower codes", async () => {
    const row = await svc.create(actor(writer), {
      office: "gubernatorial",
      year: 2091,
      round: "general",
      stateCode: states[0].toUpperCase(), // normalised to lower case
      datePrecision: "year",
      excludedStates: [],
    });
    expect(row.slug).toBe(`2091-${states[0]}-gubernatorial`);
    expect(row.stateCode).toBe(states[0]);
  });

  it("scope validation names the field: unknown state, constituency on presidential", async () => {
    await expect(
      svc.create(actor(writer), { office: "gubernatorial", year: 2092, round: "general", stateCode: "zzz-nostate", datePrecision: "year", excludedStates: [] }),
    ).rejects.toThrow(/^stateCode:/);
    await expect(
      svc.create(actor(writer), { office: "presidential", year: 2092, round: "general", constituencyCode: "abia-central", datePrecision: "year", excludedStates: [] }),
    ).rejects.toThrow(/^constituencyCode:/);
  });

  it("excludedStates: unknown codes rejected, scoped events cannot carry carve-outs", async () => {
    await expect(
      svc.create(actor(writer), { office: "senatorial", year: 2092, round: "general", datePrecision: "year", excludedStates: ["zzz-nostate"] }),
    ).rejects.toThrow(/^excludedStates: unknown state/);
    await expect(
      svc.create(actor(writer), { office: "gubernatorial", year: 2092, round: "general", stateCode: states[0], datePrecision: "year", excludedStates: [states[1]] }),
    ).rejects.toThrow(/nationwide/);
  });

  // ---------- patch ----------

  it("patch edits whitelisted fields only and audits election.updated", async () => {
    const row = await prisma.election.findUniqueOrThrow({ where: { slug: "2090-presidential" } });
    const patched = await svc.patch(actor(writer), row.id, { label: "General Election" });
    expect(patched.label).toBe("General Election");
    expect(patched.published).toBe(false);
    const ev = await prisma.auditEvent.findFirst({ where: { action: "election.updated", targetId: row.id } });
    expect(ev).not.toBeNull();
  });

  it("patch validates the MERGED date encoding (month must be day 01)", async () => {
    const row = await prisma.election.findUniqueOrThrow({ where: { slug: "2090-presidential" } });
    await expect(svc.patch(actor(writer), row.id, { datePrecision: "month" })).rejects.toThrow(/first of the month/);
    await expect(svc.patch(actor(writer), row.id, { datePrecision: "year" })).rejects.toThrow(/^electionDate:/);
    const ok = await svc.patch(actor(writer), row.id, { datePrecision: "month", electionDate: "2090-01-01" });
    expect(ok.datePrecision).toBe("month");
  });

  it("excludedStates are replace-set on a nationwide event", async () => {
    const row = await svc.create(actor(writer), {
      office: "senatorial",
      year: 2093,
      round: "general",
      datePrecision: "year",
      excludedStates: [states[0]],
    });
    await svc.patch(actor(writer), row.id, { excludedStates: [states[1]] });
    const kept = await prisma.electionExcludedState.findMany({ where: { electionId: row.id }, select: { stateCode: true } });
    expect(kept.map((k) => k.stateCode)).toEqual([states[1]]);
    await svc.patch(actor(writer), row.id, { excludedStates: [] });
    expect(await prisma.electionExcludedState.count({ where: { electionId: row.id } })).toBe(0);
  });

  // ---------- verbs ----------

  it("publish sets published + reviewed_by, audits, and a second publish is a 409", async () => {
    const row = await prisma.election.findUniqueOrThrow({ where: { slug: "2090-presidential" } });
    const live = await svc.publish(actor(reviewer), reviewer, row.id, "INEC date confirmed");
    expect(live).toMatchObject({ published: true, reviewStatus: "reviewed", reviewedBy: reviewer });
    const ev = await prisma.auditEvent.findFirst({ where: { action: "election.published", targetId: row.id } });
    expect(ev?.actorId).toBe(reviewer);
    await expect(svc.publish(actor(reviewer), reviewer, row.id, "again")).rejects.toThrow(/already published/);
  });

  it("editing a published event needs a reason and flags re-review", async () => {
    const row = await prisma.election.findUniqueOrThrow({ where: { slug: "2090-presidential" } });
    await expect(svc.patch(actor(writer), row.id, { label: "renamed" })).rejects.toThrow(/reason/);
    const edited = await svc.patch(actor(writer), row.id, { label: "renamed", reason: "INEC renamed it" });
    expect(edited).toMatchObject({ published: true, reviewStatus: "unreviewed" });
  });

  it("unpublish hides the event and audits; a second unpublish is a 409", async () => {
    const row = await prisma.election.findUniqueOrThrow({ where: { slug: "2090-presidential" } });
    const hidden = await svc.unpublish(actor(reviewer), row.id, "pause");
    expect(hidden.published).toBe(false);
    expect(await prisma.auditEvent.findFirst({ where: { action: "election.unpublished", targetId: row.id } })).not.toBeNull();
    await expect(svc.unpublish(actor(reviewer), row.id, "again")).rejects.toThrow(/not published/);
  });

  it("conclude and cancel move status once, from scheduled/postponed only", async () => {
    const a = await svc.create(actor(writer), { office: "presidential", year: 2094, round: "general", datePrecision: "year", excludedStates: [] });
    const done = await svc.conclude(actor(reviewer), a.id, "polls held");
    expect(done.status).toBe("concluded");
    expect(await prisma.auditEvent.findFirst({ where: { action: "election.concluded", targetId: a.id } })).not.toBeNull();
    await expect(svc.cancel(actor(reviewer), a.id, "too late")).rejects.toThrow(/only allowed from/);

    const b = await svc.create(actor(writer), { office: "presidential", year: 2095, round: "general", datePrecision: "year", excludedStates: [] });
    const gone = await svc.cancel(actor(reviewer), b.id, "court order");
    expect(gone.status).toBe("cancelled");
    expect(await prisma.auditEvent.findFirst({ where: { action: "election.cancelled", targetId: b.id } })).not.toBeNull();
  });

  // ---------- delete ----------

  it("delete is never-published only", async () => {
    const published = await prisma.election.findUniqueOrThrow({ where: { slug: "2090-presidential" } });
    // unpublished now, but reviewed_by is stamped — it WAS public once
    await expect(svc.remove(actor(writer), published.id)).rejects.toThrow(/never published/);
    const draft = await svc.create(actor(writer), { office: "presidential", year: 2096, round: "general", datePrecision: "year", excludedStates: [] });
    await expect(svc.remove(actor(writer), draft.id)).resolves.toEqual({ deleted: true });
    expect(await prisma.auditEvent.findFirst({ where: { action: "election.deleted", targetId: draft.id } })).not.toBeNull();
  });

  // ---------- kill switch (D10.8) ----------

  it("gate toggle writes ONLY elections.gate_enabled and audits election.gate_toggled", async () => {
    const before = await prisma.systemSetting.count();
    await expect(svc.setGate(actor(reviewer), false)).resolves.toEqual({ enabled: false });
    const row = await prisma.systemSetting.findUniqueOrThrow({ where: { key: GATE_SETTING_KEY } });
    expect(row).toMatchObject({ value: "false", category: "elections", valueType: "boolean" });
    // one settings row at most was created; nothing else written
    expect(await prisma.systemSetting.count()).toBe(before + (priorGate ? 0 : 1));
    await expect(svc.setGate(actor(reviewer), true)).resolves.toEqual({ enabled: true });
    expect((await prisma.systemSetting.findUniqueOrThrow({ where: { key: GATE_SETTING_KEY } })).value).toBe("true");
    const ev = await prisma.auditEvent.findFirst({
      where: { action: "election.gate_toggled", targetType: "system_setting", targetId: GATE_SETTING_KEY },
      orderBy: { occurredAt: "desc" },
    });
    expect(ev?.actorId).toBe(reviewer);
  });

  // ---------- reads ----------

  it("list filters by published and get returns the audit tail", async () => {
    const { rows } = await svc.list({ year: 2090, published: "false", limit: 50, offset: 0 });
    expect(rows.some((r) => r.slug === "2090-presidential")).toBe(true);
    const row = await prisma.election.findUniqueOrThrow({ where: { slug: "2090-presidential" } });
    const full = await svc.get(row.id);
    expect(full.audit.length).toBeGreaterThan(0);
    expect(full.audit.some((e) => e.action === "election.published")).toBe(true);
  });
});
