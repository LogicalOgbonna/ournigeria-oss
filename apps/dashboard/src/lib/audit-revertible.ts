/**
 * Mirrors REVERTIBLE_ACTIONS on the API (`admin-audit-revert.controller.ts`):
 * action -> the permission the revert itself needs. Only diff-invertible actions
 * are here; a status transition is undone with the opposite verb, not a revert.
 *
 * Shared by every surface that offers a revert (the generic audit log's
 * DiffViewerDialog and the campaign Review tab's timeline) so the two can never
 * disagree about what is revertible.
 */
export const REVERTIBLE_ACTIONS: Record<string, string> = {
  "official.updated": "officials.update",
  "official.slug.updated": "officials.slug.update",
  "official.deleted": "officials.delete",
  "official.restored": "officials.delete",
  "role.granted": "roles.manage",
  "role.revoked": "roles.manage",
  "user.banned": "users.manage",
  "user.unbanned": "users.manage",
  "campaign.updated": "campaigns.review",
  "campaign.council.updated": "campaigns.review",
  "campaign.council.ended": "campaigns.review",
  "campaign.reordered": "campaigns.review",
  "campaign.media.replaced": "campaigns.review",
  "campaign.document.replaced": "campaigns.review",
};

/** The permission a revert of this action needs, or undefined if it cannot be reverted. */
export function revertPermission(action: string): string | undefined {
  return REVERTIBLE_ACTIONS[action];
}
