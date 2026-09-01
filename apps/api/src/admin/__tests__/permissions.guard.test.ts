import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { PERMISSION_KEY } from "@ournigeria/access";
import {
  PermissionsGuard,
  setPermissionDenialLogger,
} from "../permissions.guard";
import { rolesCache } from "../roles.util";

function makeGuard(opts: {
  metadata?: string[] | undefined;
  roles?: string[];
}) {
  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === PERMISSION_KEY ? opts.metadata : undefined,
    ),
  };
  const prisma = {
    roleAssignment: {
      findMany: vi.fn(async () => (opts.roles ?? []).map((role) => ({ role }))),
    },
  };
  const guard = new PermissionsGuard(reflector as never, prisma as never);
  return { guard, prisma };
}

function makeContext(req: Record<string, unknown>) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  } as never;
}

describe("PermissionsGuard", () => {
  beforeEach(async () => {
    await rolesCache.clear();
  });
  afterEach(() => {
    setPermissionDenialLogger(null);
  });

  it("allows when the admin holds the permission", async () => {
    const { guard } = makeGuard({
      metadata: ["budget.write"],
      roles: ["budget_manager"],
    });
    const req: Record<string, unknown> = { adminId: "admin-1" };
    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.permissions).toContain("budget.write");
  });

  it("denies without the permission and logs the denial", async () => {
    const denials: unknown[] = [];
    setPermissionDenialLogger((info) => denials.push(info));
    const { guard } = makeGuard({
      metadata: ["admins.manage"],
      roles: ["socials_manager"],
    });
    await expect(
      guard.canActivate(
        makeContext({ adminId: "admin-1", method: "POST", url: "/x" }),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(denials).toHaveLength(1);
    expect((denials[0] as { needed: string[] }).needed).toEqual([
      "admins.manage",
    ]);
  });

  it("OR semantics: any listed permission suffices", async () => {
    const { guard } = makeGuard({
      metadata: ["roles.manage", "admins.manage"],
      roles: ["super_admin"],
    });
    await expect(
      guard.canActivate(makeContext({ adminId: "a" })),
    ).resolves.toBe(true);
  });

  it("passes through when no metadata is present", async () => {
    const { guard, prisma } = makeGuard({ metadata: undefined });
    await expect(guard.canActivate(makeContext({}))).resolves.toBe(true);
    expect(prisma.roleAssignment.findMany).not.toHaveBeenCalled();
  });

  it("401s when unauthenticated but metadata demands a permission", async () => {
    const { guard } = makeGuard({ metadata: ["audit.read"] });
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("revocation converges after cache bust", async () => {
    const { guard, prisma } = makeGuard({
      metadata: ["socials.publish"],
      roles: ["socials_manager"],
    });
    await expect(
      guard.canActivate(makeContext({ adminId: "admin-9" })),
    ).resolves.toBe(true);
    // role revoked in DB
    prisma.roleAssignment.findMany.mockResolvedValue([]);
    // cached => still allowed within TTL
    await expect(
      guard.canActivate(makeContext({ adminId: "admin-9" })),
    ).resolves.toBe(true);
    // bust (what grant/revoke does) => denied
    await rolesCache.del("staff:admin-9");
    await expect(
      guard.canActivate(makeContext({ adminId: "admin-9" })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("ignores unknown roles from a future catalog rename", async () => {
    const { guard } = makeGuard({
      metadata: ["budget.read"],
      roles: ["nonexistent_role", "budget_manager"],
    });
    await expect(
      guard.canActivate(makeContext({ adminId: "admin-2" })),
    ).resolves.toBe(true);
  });
});
