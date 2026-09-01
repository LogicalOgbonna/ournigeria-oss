import { describe, expect, it } from "vitest";
import { PERMISSIONS, isPermission } from "../permissions";
import { ASSIGNABLE_ROLES, ROLES, ROLE_BUNDLES, ROLE_DESCRIPTIONS, resolvePermissions } from "../roles";

// Permissions implicitly held rather than listed in any bundle. Spec §5.
const IMPLICIT: string[] = ["audit.read.own"];

// super_admin-only permissions are implicit-all by design (spec §4):
const SUPER_ONLY = [
  "admins.manage",
  "roles.manage",
  "settings.write",
  "system.write",
  "backups.manage",
  "vectors.manage",
  "ai.manage",
  "officials.delete",
  "users.manage",
];

describe("permission catalog", () => {
  it("has no duplicates", () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
  });

  it("every catalog entry appears in >=1 bundle, is implicit, or is super-only", () => {
    const bundled = new Set(Object.values(ROLE_BUNDLES).flat());
    const orphans = PERMISSIONS.filter(
      (p) =>
        !bundled.has(p) && !IMPLICIT.includes(p) && !SUPER_ONLY.includes(p),
    );
    expect(orphans).toEqual([]);
  });

  it("every bundle entry exists in the catalog", () => {
    for (const [role, bundle] of Object.entries(ROLE_BUNDLES)) {
      for (const p of bundle) {
        expect(isPermission(p), `${role}:${p}`).toBe(true);
      }
    }
  });

  it("super_admin resolves to the full catalog", () => {
    expect(resolvePermissions(["super_admin"]).size).toBe(PERMISSIONS.length);
  });

  it("auditor never sees citizen PII", () => {
    const held = resolvePermissions(["auditor"]);
    expect(held.has("users.read")).toBe(false);
    expect(held.has("conversations.read")).toBe(false);
  });

  it("multi-role union works and adds audit.read.own", () => {
    const held = resolvePermissions(["budget_manager", "review_manager"]);
    expect(held.has("budget.write")).toBe(true);
    expect(held.has("proposals.approve")).toBe(true);
    expect(held.has("socials.publish")).toBe(false);
    expect(held.has("audit.read.own")).toBe(true);
  });

  it("no roles => no permissions", () => {
    expect(resolvePermissions([]).size).toBe(0);
  });

  it("all roles are unique and described", () => {
    expect(new Set(ROLES).size).toBe(ROLES.length);
    for (const role of ROLES) {
      expect(ROLE_DESCRIPTIONS[role]).toBeTruthy();
    }
  });

  it("researcher is reserved (not assignable)", () => {
    expect(ASSIGNABLE_ROLES).not.toContain("researcher");
    expect(ASSIGNABLE_ROLES).toContain("super_admin");
  });
});
