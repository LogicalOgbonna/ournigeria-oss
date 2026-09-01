import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { RolesAdminService } from "../roles-admin.service";
import { rolesCache } from "../roles.util";

const SUPER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

function makeService(opts: {
  superHolders?: string[];
  activeRoles?: string[];
} = {}) {
  const tx = {
    roleAssignment: {
      create: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () =>
        (opts.activeRoles ?? []).map((role) => ({ role })),
      ),
    },
    $queryRawUnsafe: vi.fn(async () =>
      (opts.superHolders ?? [SUPER]).map((principal_id) => ({ principal_id })),
    ),
  };
  const prisma = {
    $transaction: vi.fn(async (fn: any) => fn(tx)),
    roleAssignment: tx.roleAssignment,
    adminUser: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.id === "missing"
          ? null
          : { id: where.id, name: "Test", email: "t@x.ng" },
      ),
      findMany: vi.fn(async () => []),
    },
  };
  const audit = { log: vi.fn(async () => ({ seq: 1 })) };
  const alerts = { alert: vi.fn(async () => undefined) };
  return {
    svc: new RolesAdminService(prisma as never, audit as never, alerts as never),
    prisma,
    tx,
    audit,
    alerts,
  };
}

const ACTOR = { actorType: "staff" as const, actorId: SUPER };

describe("RolesAdminService governance", () => {
  beforeEach(async () => {
    await rolesCache.clear();
    delete process.env.DUAL_CONTROL_ROLE_GRANTS;
  });

  it("grants a role inside a tx with an audit event, busts cache, alerts", async () => {
    const { svc, tx, audit, alerts } = makeService();
    await svc.grant(SUPER, ACTOR, { adminId: OTHER, role: "budget_manager" });
    expect(tx.roleAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          principalId: OTHER,
          role: "budget_manager",
          grantedById: SUPER,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      tx,
      ACTOR,
      expect.objectContaining({ action: "role.granted", targetId: OTHER }),
    );
    expect(alerts.alert).toHaveBeenCalled();
  });

  it("rejects self-grant and self-revoke", async () => {
    const { svc } = makeService();
    await expect(
      svc.grant(SUPER, ACTOR, { adminId: SUPER, role: "auditor" }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      svc.revoke(SUPER, ACTOR, { adminId: SUPER, role: "auditor", reason: "x" }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("rejects unknown and reserved roles", async () => {
    const { svc } = makeService();
    await expect(
      svc.grant(SUPER, ACTOR, { adminId: OTHER, role: "godmode" }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      svc.grant(SUPER, ACTOR, { adminId: OTHER, role: "researcher" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("requires a reason for super_admin grants and all revocations", async () => {
    const { svc } = makeService();
    await expect(
      svc.grant(SUPER, ACTOR, { adminId: OTHER, role: "super_admin" }),
    ).rejects.toThrow(/reason/i);
    await expect(
      svc.revoke(SUPER, ACTOR, { adminId: OTHER, role: "auditor", reason: " " }),
    ).rejects.toThrow(/reason/i);
  });

  it("refuses to revoke the last active super_admin", async () => {
    const { svc } = makeService({ superHolders: [OTHER] });
    await expect(
      svc.revoke(SUPER, ACTOR, {
        adminId: OTHER,
        role: "super_admin",
        reason: "offboarding",
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("allows revoking super_admin when another holder remains", async () => {
    const { svc, tx } = makeService({ superHolders: [SUPER, OTHER] });
    await svc.revoke(SUPER, ACTOR, {
      adminId: OTHER,
      role: "super_admin",
      reason: "offboarding",
    });
    expect(tx.roleAssignment.updateMany).toHaveBeenCalled();
  });

  it("404s on revoking a role the admin does not hold", async () => {
    const { svc, tx } = makeService();
    tx.roleAssignment.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      svc.revoke(SUPER, ACTOR, { adminId: OTHER, role: "auditor", reason: "x" }),
    ).rejects.toThrow(NotFoundException);
  });

  it("maps duplicate grants to 409", async () => {
    const { svc, tx } = makeService();
    tx.roleAssignment.create.mockRejectedValueOnce(
      Object.assign(new Error("dup"), { code: "P2002" }),
    );
    await expect(
      svc.grant(SUPER, ACTOR, { adminId: OTHER, role: "auditor" }),
    ).rejects.toThrow(ConflictException);
  });

  it("dual-control flag returns 501 (honest stub)", async () => {
    process.env.DUAL_CONTROL_ROLE_GRANTS = "true";
    const { svc } = makeService();
    await expect(
      svc.grant(SUPER, ACTOR, { adminId: OTHER, role: "auditor" }),
    ).rejects.toMatchObject({ status: 501 });
  });

  it("404s granting to a missing admin", async () => {
    const { svc } = makeService();
    await expect(
      svc.grant(SUPER, ACTOR, { adminId: "missing", role: "auditor" }),
    ).rejects.toThrow(NotFoundException);
  });
});
