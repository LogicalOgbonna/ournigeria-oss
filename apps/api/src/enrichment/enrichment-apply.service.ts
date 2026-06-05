import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { isAppliable, OFFICIAL_COMPLETENESS_FIELDS } from "./enrichment.constants";

@Injectable()
export class EnrichmentApplyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Apply an approved proposal to live data, transactionally, as enrichment_apply. */
  async apply(proposalId: string, adminId: string): Promise<void> {
    const proposal = await this.prisma.changeProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException("proposal not found");
    // Only un-reviewed proposals may be applied — never re-apply an approved one or
    // resurrect a rejected / needs-more-sources one.
    if (proposal.status !== "pending" && proposal.status !== "needs_human") {
      throw new BadRequestException(`proposal cannot be applied in status '${proposal.status}'`);
    }
    if (!isAppliable(proposal.targetTable, proposal.targetField)) {
      throw new BadRequestException(`field ${proposal.targetTable}.${proposal.targetField} is not appliable`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Drop to the least-privileged role for the live write; resets at tx end.
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");

      // Identifiers are safe: both passed isAppliable() against a static allow-list.
      const value = (proposal.proposedValue as unknown) ?? null;
      await tx.$executeRawUnsafe(
        `UPDATE "${proposal.targetTable}" SET "${proposal.targetField}" = $1 WHERE id = $2::uuid`,
        value,
        proposal.targetPk,
      );

      if (proposal.targetTable === "nigerian_officials") {
        await this.recomputeOfficialCompleteness(tx, proposal.targetPk);
      }

      await tx.changeProposal.update({
        where: { id: proposalId },
        data: { status: "approved", reviewedBy: adminId, reviewedAt: new Date(), appliedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          eventType: "proposal_applied",
          targetType: proposal.targetTable,
          targetId: proposal.targetPk,
          metadata: { proposalId, field: proposal.targetField, changeKind: proposal.changeKind },
        },
      });
    });
  }

  /** Recompute completeness = (non-null of the 10 fields) / 10. Mirrors CompletenessService. */
  private async recomputeOfficialCompleteness(tx: any, officialId: string): Promise<void> {
    const cols = OFFICIAL_COMPLETENESS_FIELDS
      .map((f) => `(CASE WHEN "${f}" IS NOT NULL AND "${f}"::text <> '' THEN 1 ELSE 0 END)`)
      .join(" + ");
    await tx.$executeRawUnsafe(
      `UPDATE "nigerian_officials"
         SET "completeness_score" = ROUND(((${cols})::numeric / ${OFFICIAL_COMPLETENESS_FIELDS.length}), 2)
       WHERE id = $1::uuid`,
      officialId,
    );
  }
}
