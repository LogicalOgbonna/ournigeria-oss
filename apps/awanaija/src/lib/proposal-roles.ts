/**
 * The single source of truth for proposal deep-link roles.
 *
 * These mirror the role strings the API's chain builder emits
 * (apps/api/src/officials/officials.service.ts) and the identify CTAs put in
 * /proposals/new?role=... URLs. The OG card mapper switches over ProposalRole
 * exhaustively — adding a value here without handling it there is a compile
 * error, so a new role can't silently fall through to the generic card again
 * (which is how senator/rep links shipped with the wrong preview).
 */
export const PROPOSAL_ROLES = [
  "councilor",
  "lga_chairman",
  "mha",
  "senator",
  "rep",
  "governor",
] as const;

export type ProposalRole = (typeof PROPOSAL_ROLES)[number];

/** Narrow an untrusted query-param value to a known role, else null. */
export function parseProposalRole(value: string | null): ProposalRole | null {
  return PROPOSAL_ROLES.includes(value as ProposalRole)
    ? (value as ProposalRole)
    : null;
}
