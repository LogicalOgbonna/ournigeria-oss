import { describe, expect, it, vi } from "vitest";
import { AuditRevertService } from "../audit-revert.service";
import type { AuditActor } from "../../audit/audit.service";

const OWNER = "aaaaaaaa-0000-0000-0000-00000000000a";
const OTHER = "bbbbbbbb-0000-0000-0000-00000000000b";
const OFFICIAL = "cccccccc-0000-0000-0000-00000000000c";

function actorOf(id: string): AuditActor {
  return { actorType: "staff", actorId: id };
}

function makeService(overrides: {
  event?: Record<string, unknown> | null;
  officialRow?: Record<string, unknown> | null;
  roles?: string[];
}) {
  const event = overrides.event ?? null;
  const prisma = {
    auditEvent: { findUnique: vi.fn(async () => event) },
    nigerianOfficial: {
      findUnique: vi.fn(async () => overrides.officialRow ?? null),
    },
    user: { findUnique: vi.fn(async () => ({ banned: true })) },
    roleAssignment: {
      findMany: vi.fn(async () =>
        (overrides.roles ?? ["super_admin"]).map((role) => ({ role })),
      ),
    },
  };
  const audit = { log: vi.fn(async () => ({ seq: 99 })) };
  const alerts = { alert: vi.fn(async () => true) };
  const officials = {
    update: vi.fn(async () => ({})),
    updateSlug: vi.fn(async () => ({})),
    restore: vi.fn(async () => ({})),
    softDelete: vi.fn(async () => ({})),
  };
  const roles = { grant: vi.fn(async () => ({})), revoke: vi.fn(async () => ({})) };
  const users = { banUser: vi.fn(async () => ({})), unbanUser: vi.fn(async () => ({})) };
  const svc = new AuditRevertService(
    prisma as never,
    audit as never,
    alerts as never,
    officials as never,
    roles as never,
    users as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { svc, prisma, audit, alerts, officials, roles, users };
}

function updateEvent(actorId: string) {
  return {
    seq: BigInt(41),
    action: "official.updated",
    actorId,
    targetType: "official",
    targetId: OFFICIAL,
    diff: {
      before: { biography: "old bio" },
      after: { biography: "new bio" },
    },
    metadata: { pathway: "direct" },
  };
}

describe("AuditRevertService policy", () => {
  it("own-action revert: same permission, reason optional, no ops alert", async () => {
    const { svc, officials, alerts, audit } = makeService({
      event: updateEvent(OWNER),
      officialRow: { deletedAt: null, biography: "new bio" },
    });
    const result = await svc.revert(OWNER, actorOf(OWNER), 41);
    expect(result.resultingAction).toBe("official.updated");
    expect(officials.update).toHaveBeenCalledWith(
      expect.anything(),
      OFFICIAL,
      { biography: "old bio" },
      expect.stringContaining("revert of audit seq 41"),
    );
    expect(alerts.alert).not.toHaveBeenCalled();
    const marker = audit.log.mock.calls.find(
      ([, , e]: never[]) => (e as { action: string }).action === "audit.reverted",
    );
    expect(marker).toBeTruthy();
  });

  it("cross-actor revert without a reason is rejected", async () => {
    const { svc } = makeService({
      event: updateEvent(OTHER),
      officialRow: { deletedAt: null, biography: "new bio" },
    });
    await expect(svc.revert(OWNER, actorOf(OWNER), 41)).rejects.toThrow(
      /reason is required/i,
    );
  });

  it("cross-actor revert with a reason fires the ops alert", async () => {
    const { svc, alerts } = makeService({
      event: updateEvent(OTHER),
      officialRow: { deletedAt: null, biography: "new bio" },
    });
    await svc.revert(OWNER, actorOf(OWNER), 41, "wrong data entered");
    expect(alerts.alert).toHaveBeenCalledWith(
      expect.stringContaining("Cross-actor revert"),
    );
  });

  it("requires the original action's permission", async () => {
    // Distinct admin id — loadPermissions caches per principal for 15s, so
    // reusing OWNER here would read the super_admin set cached by earlier tests.
    const LOW_PRIV = "dddddddd-0000-0000-0000-00000000000d";
    const { svc } = makeService({
      event: updateEvent(LOW_PRIV),
      officialRow: { deletedAt: null, biography: "new bio" },
      roles: ["auditor"], // no officials.update
    });
    await expect(svc.revert(LOW_PRIV, actorOf(LOW_PRIV), 41)).rejects.toThrow(
      /officials\.update/,
    );
  });

  it("409s when the field changed again since the event", async () => {
    const { svc } = makeService({
      event: updateEvent(OWNER),
      officialRow: { deletedAt: null, biography: "even newer bio" },
    });
    await expect(svc.revert(OWNER, actorOf(OWNER), 41)).rejects.toThrow(
      /changed again/,
    );
  });

  it("rejects non-invertible actions", async () => {
    const { svc } = makeService({
      event: { ...updateEvent(OWNER), action: "proposal.approved" },
    });
    await expect(svc.revert(OWNER, actorOf(OWNER), 41)).rejects.toThrow(
      /not reversible/,
    );
  });

  it("reverting role.granted revokes the role from metadata", async () => {
    const { svc, roles } = makeService({
      event: {
        seq: BigInt(50),
        action: "role.granted",
        actorId: OWNER,
        targetType: "admin",
        targetId: OTHER,
        diff: { before: { roles: [] }, after: { roles: ["auditor"] } },
        metadata: { role: "auditor" },
      },
    });
    const result = await svc.revert(OWNER, actorOf(OWNER), 50);
    expect(result.resultingAction).toBe("role.revoked");
    expect(roles.revoke).toHaveBeenCalledWith(OWNER, expect.anything(), {
      adminId: OTHER,
      role: "auditor",
      reason: expect.stringContaining("revert of audit seq 50"),
    });
  });
});
