import type { Prisma } from '@prisma/client';
import { MATE_ELECTION_TYPE } from './mate-type';

export { MATE_ELECTION_TYPE };

export type AnchorConfidence = 'high' | 'medium' | 'low';

/** Higher wins. Used to make the update path non-downgrading. */
const CONFIDENCE_RANK: Record<string, number> = { low: 1, medium: 2, high: 3 };

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
  /**
   * The anchor already recorded on the campaign row, when there is one. It is
   * the authoritative pointer once created — preferred over the keyed search
   * so a later party/scope correction still lands on the same row.
   */
  officialElectionId?: string | null;
}

export interface AnchorContext {
  /** 'pending' for drafts, 'won' once published (won = won the party primary), 'withdrawn' when withdrawn. */
  result: 'pending' | 'won' | 'withdrawn';
  reviewedBy: string;
  sourceType: 'manual' | 'import';
  confidence: AnchorConfidence;
  notes?: string | null;
  /**
   * review_status stamped on CREATE. Defaults to 'reviewed' — a human verb on
   * the dashboard *is* the review. Bulk import passes 'unreviewed': nobody has
   * looked at a machine-created anchor yet, and claiming otherwise launders
   * unverified rows into the reviewed pool. On UPDATE this is ignored; the
   * existing non-downgrade rule (only 'unreviewed' rises) stays in force.
   */
  reviewStatus?: 'unreviewed' | 'reviewed';
  /**
   * Allow the UPDATE path to move an existing 'won' back to 'pending'. Off by
   * default so a re-import or a draft re-save can never erase a recorded
   * primary win. The one legitimate won→pending path is
   * AdminCampaignsService.unpublish (the ticket is being pulled from public
   * view, so the win it asserted no longer stands).
   */
  allowResultDowngrade?: boolean;
}

export interface AnchorResult {
  candidateElectionId: string | null;
  mateElectionId: string | null;
}

/**
 * Find-or-create the official_elections rows a ticket stands on, then set
 * their result. Candidate = (electionType, is_primary); mate = MATE type, not
 * primary.
 *
 * Matched on (official, type, **is_primary**, year, party) — the same key
 * `scripts/seed-party-candidates.ts` uses (`AND is_primary = true`). is_primary
 * is part of the key because official_elections keeps the party PRIMARY result
 * (is_primary = true) and the GENERAL result (is_primary = false) of the same
 * race as two separate rows for one (official, type, year, party); without it a
 * ticket would stomp the general-election result. Ordered by created_at so the
 * match is deterministic when history holds more than one row.
 *
 * Officials without an id (name-only fallback rows) get no anchor — there is
 * no official to anchor to. Idempotent; safe inside a larger transaction.
 *
 * The UPDATE path is deliberately narrow: it writes result / winner_name /
 * last_verified_at, fills scope columns only when the ticket actually carries
 * them, and never downgrades provenance (review_status only rises out of
 * 'unreviewed', confidence only rises, source_type is left alone) nor the
 * result ('won' → 'pending' needs ctx.allowResultDowngrade). The full audit
 * block is written on CREATE only, where ctx.reviewStatus (default 'reviewed')
 * decides whether the new row enters the reviewed pool.
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
  /** `?? existing` semantics — never NULL a scope column that is already right. */
  const scopeIfKnown = {
    ...(t.stateCode !== null ? { stateCode: t.stateCode } : {}),
    ...(t.constituencyCode !== null ? { constituencyCode: t.constituencyCode } : {}),
    ...(t.lgaCode !== null ? { lgaCode: t.lgaCode } : {}),
  };
  const now = new Date();

  const EXISTING_SELECT = {
    id: true,
    officialId: true,
    reviewStatus: true,
    confidence: true,
    result: true,
  } as const;

  async function ensure(
    officialId: string,
    electionType: string,
    isPrimary: boolean,
    winnerName: string | null,
    knownId?: string | null,
  ) {
    // The mate never "wins" — it is a nomination; it only follows a withdrawal.
    const result = isPrimary ? ctx.result : ctx.result === 'withdrawn' ? 'withdrawn' : 'pending';

    // Prefer the anchor the campaign row already points at; fall back to the
    // keyed search when it is gone (or belongs to a different official).
    let existing = knownId
      ? await tx.officialElection.findUnique({ where: { id: knownId }, select: EXISTING_SELECT })
      : null;
    if (existing && existing.officialId !== officialId) existing = null;
    if (!existing) {
      existing = await tx.officialElection.findFirst({
        where: { officialId, electionType, isPrimary, year: t.year, partyAcronym: t.partyAcronym },
        orderBy: { createdAt: 'asc' },
        select: EXISTING_SELECT,
      });
    }

    if (existing) {
      const raise = CONFIDENCE_RANK[ctx.confidence] > (CONFIDENCE_RANK[existing.confidence] ?? 0);
      // Never silently erase a recorded win: only an explicit
      // allowResultDowngrade (unpublish) may take 'won' back to 'pending'.
      const nextResult =
        existing.result === 'won' && result === 'pending' && !ctx.allowResultDowngrade ? 'won' : result;
      await tx.officialElection.update({
        where: { id: existing.id },
        data: {
          result: nextResult,
          winnerName: nextResult === 'won' ? winnerName : null,
          lastVerifiedAt: now,
          ...scopeIfKnown,
          ...(raise ? { confidence: ctx.confidence } : {}),
          ...(existing.reviewStatus === 'unreviewed' ? { reviewStatus: 'reviewed', reviewedBy: ctx.reviewedBy } : {}),
        },
      });
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
        winnerName: result === 'won' ? winnerName : null,
        notes: ctx.notes ?? null,
        confidence: ctx.confidence,
        sourceType: ctx.sourceType,
        reviewStatus: ctx.reviewStatus ?? 'reviewed',
        reviewedBy: ctx.reviewedBy,
        lastVerifiedAt: now,
      },
      select: { id: true },
    });
    return row.id;
  }

  const candidateElectionId = t.candidateOfficialId
    ? await ensure(t.candidateOfficialId, t.electionType, true, t.candidateName, t.officialElectionId)
    : null;
  const mateType = MATE_ELECTION_TYPE[t.electionType] ?? null;
  const mateElectionId =
    t.runningMateOfficialId && mateType
      ? await ensure(t.runningMateOfficialId, mateType, false, t.runningMateName)
      : null;
  return { candidateElectionId, mateElectionId };
}
