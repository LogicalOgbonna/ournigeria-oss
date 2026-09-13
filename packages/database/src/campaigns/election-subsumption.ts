import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * D10.1 subsumption (plan 68 §2): which first-class election EVENT does a
 * campaign / official_elections row belong to? A row attaches to the event
 * with the MOST SPECIFIC scope that subsumes its own scope — same office
 * (the event's `office` IS the campaigns.election_type vocabulary) and cycle
 * year, where every non-null scope column on the event either is null
 * (broader) or equals the row's value, and the row's state is not in
 * election_excluded_states. Ties broken by event specificity
 * (ward > constituency > lga > state > nationwide). Non-`general` rounds
 * never auto-attach — a supplementary election's tickets are attached by
 * explicit admin action only.
 *
 * Canonical home of the rule for attachment-on-create (D10.2:
 * AdminCampaignsService and scripts/seed-campaigns.ts). The backfill in
 * scripts/seed-elections.ts predates this module and still carries its own
 * copy of the pure functions — fold it onto this one when touching it.
 */

export interface ScopeArc {
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
  wardCode: string | null;
}

export interface ElectionEventLite extends ScopeArc {
  id: string;
  slug: string;
  office: string;
  year: number;
  round: string;
  excludedStates: readonly string[];
}

export interface AttachableRow extends ScopeArc {
  /** campaigns.election_type / official_elections.election_type */
  electionType: string;
  year: number;
}

export type Subsumption =
  | { kind: 'attach'; event: ElectionEventLite }
  | { kind: 'none' }
  | { kind: 'ambiguous'; events: ElectionEventLite[] };

const SCOPE_COLUMNS = ['stateCode', 'constituencyCode', 'lgaCode', 'wardCode'] as const;

/** Tiebreak rank: ward > constituency > lga > state > nationwide (D10.1). */
export function eventSpecificity(event: ScopeArc): number {
  if (event.wardCode !== null) return 4;
  if (event.constituencyCode !== null) return 3;
  if (event.lgaCode !== null) return 2;
  if (event.stateCode !== null) return 1;
  return 0;
}

function subsumes(event: ElectionEventLite, row: AttachableRow): boolean {
  if (event.office !== row.electionType || event.year !== row.year) return false;
  // Non-general rounds never auto-attach — explicit admin action only.
  if (event.round !== 'general') return false;
  for (const col of SCOPE_COLUMNS) {
    const eventValue = event[col];
    if (eventValue !== null && eventValue !== row[col]) return false;
  }
  if (row.stateCode !== null && event.excludedStates.includes(row.stateCode)) return false;
  return true;
}

/**
 * The most-specific-subsuming event for one row, per D10.1. Two subsuming
 * events at the SAME specificity rank is ambiguous — the caller decides what
 * that means (the backfill skips loudly; attachment-on-create leaves null).
 */
export function findSubsumingElection(row: AttachableRow, events: readonly ElectionEventLite[]): Subsumption {
  const matches = events.filter((event) => subsumes(event, row));
  if (matches.length === 0) return { kind: 'none' };
  const top = Math.max(...matches.map(eventSpecificity));
  const best = matches.filter((event) => eventSpecificity(event) === top);
  if (best.length > 1) return { kind: 'ambiguous', events: best };
  return { kind: 'attach', event: best[0] };
}

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Attachment-on-create (D10.2): resolve the event a new campaign /
 * official_elections row belongs to. Exactly one subsuming event ⇒ its id;
 * none or ambiguous ⇒ null — resolution NEVER blocks the write.
 */
export async function resolveElectionIdForRace(db: Db, row: AttachableRow): Promise<string | null> {
  // No event may carry office 'other' (D10.6) — skip the query outright.
  if (row.electionType === 'other') return null;
  const events = await db.election.findMany({
    where: { office: row.electionType, year: row.year, round: 'general' },
    include: { excludedStates: { select: { stateCode: true } } },
  });
  const outcome = findSubsumingElection(
    row,
    events.map((e) => ({
      id: e.id,
      slug: e.slug,
      office: e.office,
      year: e.year,
      round: e.round,
      stateCode: e.stateCode,
      constituencyCode: e.constituencyCode,
      lgaCode: e.lgaCode,
      wardCode: e.wardCode,
      excludedStates: e.excludedStates.map((x) => x.stateCode),
    })),
  );
  return outcome.kind === 'attach' ? outcome.event.id : null;
}
