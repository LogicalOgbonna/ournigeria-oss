import type { Prisma } from '@prisma/client';
import { MATE_ELECTION_TYPE } from './mate-type';

export { MATE_ELECTION_TYPE };

/** The columns of a campaign row the anchor needs. */
export interface TicketAnchorInput {
  electionType: string;
  year: number;
  partyAcronym: string | null;
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
  candidateOfficialId: string | null;
  candidateName: string;
  runningMateOfficialId: string | null;
  runningMateName: string | null;
}

export interface AnchorContext {
  /** 'pending' for drafts, 'won' once published (won = won the party primary), 'withdrawn' when withdrawn. */
  result: 'pending' | 'won' | 'withdrawn';
  reviewedBy: string;
  sourceType: 'manual' | 'import';
  confidence: string;
  notes?: string | null;
}

export interface AnchorResult {
  candidateElectionId: string | null;
  mateElectionId: string | null;
}

/**
 * Find-or-create the official_elections rows a ticket stands on, then set
 * their result. Candidate = (electionType, is_primary); mate = MATE type, not
 * primary. Matched on (official, type, year, party) like seed-campaigns did.
 * Officials without an id (name-only fallback rows) get no anchor — there is
 * no official to anchor to. Idempotent; safe inside a larger transaction.
 *
 *   ticket ──candidateOfficialId──▶ official_elections (electionType, is_primary, result)
 *          └─runningMateOfficialId─▶ official_elections (MATE type, not primary, pending|withdrawn)
 */
export async function ensureTicketElections(
  tx: Prisma.TransactionClient,
  t: TicketAnchorInput,
  ctx: AnchorContext,
): Promise<AnchorResult> {
  const scope = { stateCode: t.stateCode, constituencyCode: t.constituencyCode, lgaCode: t.lgaCode };
  const audit = {
    confidence: ctx.confidence,
    sourceType: ctx.sourceType,
    reviewStatus: 'reviewed',
    reviewedBy: ctx.reviewedBy,
    lastVerifiedAt: new Date(),
  };

  async function ensure(officialId: string, electionType: string, isPrimary: boolean, winnerName: string | null) {
    // The mate never "wins" — it is a nomination; it only follows a withdrawal.
    const result = isPrimary ? ctx.result : ctx.result === 'withdrawn' ? 'withdrawn' : 'pending';
    const existing = await tx.officialElection.findFirst({
      where: { officialId, electionType, year: t.year, partyAcronym: t.partyAcronym },
      select: { id: true },
    });
    if (existing) {
      await tx.officialElection.update({ where: { id: existing.id }, data: { result, ...scope, ...audit } });
      return existing.id;
    }
    const row = await tx.officialElection.create({
      data: {
        officialId,
        electionType,
        isPrimary,
        year: t.year,
        partyAcronym: t.partyAcronym,
        ...scope,
        result,
        winnerName,
        notes: ctx.notes ?? null,
        ...audit,
      },
      select: { id: true },
    });
    return row.id;
  }

  const candidateElectionId = t.candidateOfficialId
    ? await ensure(t.candidateOfficialId, t.electionType, true, t.candidateName)
    : null;
  const mateType = MATE_ELECTION_TYPE[t.electionType] ?? null;
  const mateElectionId =
    t.runningMateOfficialId && mateType ? await ensure(t.runningMateOfficialId, mateType, false, null) : null;
  return { candidateElectionId, mateElectionId };
}
