/**
 * The complete, closed permission catalog. Spec: .agent/plans/62.rbac-audit-chain-design.md §5.
 * Adding/removing an entry is a reviewed PR — there is NO runtime permission creation.
 */
export const PERMISSIONS = [
  "budget.read",
  "budget.write",
  "documents.read",
  "documents.write",
  "ingestion.read",
  "ingestion.run",
  "imports.budget",
  "imports.candidates",
  "officials.read",
  "officials.create",
  "officials.update",
  "officials.slug.update",
  "officials.delete",
  "parties.write",
  "elections.write",
  "content.write",
  "proposals.review",
  "proposals.approve",
  "enrichment.review",
  "enrichment.apply",
  "socials.review",
  "socials.publish",
  "socials.sessions",
  "socials.topics",
  "users.read",
  "users.manage",
  "conversations.read",
  "feedback.read",
  "feedback.write",
  "donations.read",
  "notifications.write",
  "alerts.read",
  "admins.manage",
  "roles.manage",
  "settings.write",
  "system.write",
  "backups.manage",
  "vectors.manage",
  "ai.manage",
  "audit.read",
  "audit.read.own",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
