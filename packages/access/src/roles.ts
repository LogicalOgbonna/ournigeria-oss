import { PERMISSIONS, type Permission } from "./permissions";

/** Predefined roles. Spec §4. `super_admin` is implicit-all (no bundle to drift). */
export const ROLES = [
  "super_admin",
  "budget_manager",
  "campaign_manager",
  "review_manager",
  "socials_manager",
  "community_support",
  "auditor",
  "researcher",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Roles grantable today. `researcher` is reserved until the member invite flow (phase 2). */
export const ASSIGNABLE_ROLES: readonly Role[] = ROLES.filter(
  (r) => r !== "researcher",
);

/** Every role implicitly holds `audit.read.own` — appended in resolvePermissions. */
export const ROLE_BUNDLES: Record<
  Exclude<Role, "super_admin">,
  readonly Permission[]
> = {
  budget_manager: [
    "budget.read",
    "budget.write",
    "documents.read",
    "documents.write",
    "ingestion.read",
    "ingestion.run",
    "imports.budget",
  ],
  campaign_manager: [
    "officials.read",
    "officials.create",
    "officials.update",
    "officials.slug.update",
    "parties.write",
    "elections.write",
    "imports.candidates",
    "content.write",
  ],
  review_manager: [
    "proposals.review",
    "proposals.approve",
    "enrichment.review",
    "enrichment.apply",
  ],
  socials_manager: [
    "socials.review",
    "socials.publish",
    "socials.sessions",
    "socials.topics",
  ],
  community_support: [
    "users.read",
    "conversations.read",
    "feedback.read",
    "feedback.write",
    "donations.read",
    "notifications.write",
    "alerts.read",
  ],
  // No citizen PII: never users.read / conversations.read. Spec §4.
  auditor: [
    "audit.read",
    "budget.read",
    "documents.read",
    "officials.read",
    "donations.read",
    "alerts.read",
  ],
  researcher: ["documents.read", "budget.read", "officials.read"],
};

/** Human labels + one-line description for role-management UIs. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Everything, including admin and role management",
  budget_manager: "Budget data, documents, ingestion and budget imports",
  campaign_manager: "Officials, parties, elections and candidate imports",
  review_manager: "Citizen proposals and enrichment review/approval",
  socials_manager: "X/Twitter reply queue, topics, sessions and publishing",
  community_support: "Users, conversations, feedback, donations, notifications",
  auditor: "Read-only oversight without citizen PII, plus the audit log",
  researcher: "Reserved for invited external researchers (phase 2)",
};

/** Union of permissions held by a set of roles. super_admin => the whole catalog. */
export function resolvePermissions(
  roles: readonly Role[],
): ReadonlySet<Permission> {
  const held = new Set<Permission>();
  for (const role of roles) {
    if (role === "super_admin") {
      for (const p of PERMISSIONS) held.add(p);
      return held; // already everything
    }
    for (const p of ROLE_BUNDLES[role]) held.add(p);
  }
  if (roles.length > 0) held.add("audit.read.own");
  return held;
}

export function hasPermission(
  held: ReadonlySet<Permission>,
  required: Permission,
): boolean {
  return held.has(required);
}
