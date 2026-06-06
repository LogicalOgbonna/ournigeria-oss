import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { isAppliable, OFFICIAL_COMPLETENESS_FIELDS } from "./enrichment.constants";
import { isCreatableCouncilor } from "./councilor.constants";
import type { CouncilorProposedEntity } from "./agent/profile.types";

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
    if (proposal.changeKind === "create") {
      return this.applyCreate(proposal, adminId);
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

  /** Apply a create proposal: insert a new official + councilor position, as enrichment_apply. */
  private async applyCreate(
    proposal: { id: string; targetTable: string; proposedValue: unknown },
    adminId: string,
  ): Promise<void> {
    const entity = proposal.proposedValue as CouncilorProposedEntity | null;
    if (!entity?.official?.name || !entity?.position?.wardCode) {
      throw new BadRequestException("malformed create payload");
    }
    const pos = entity.position;
    if (!isCreatableCouncilor(proposal.targetTable, pos.role)) {
      throw new BadRequestException(`not a creatable entity: ${proposal.targetTable} / ${pos.role}`);
    }
    // official_positions.ward_code has an FK to nigerian_wards(code); validate up front so a
    // stale/unknown ward returns a clean 400 instead of leaking the FK violation as a 500.
    const ward = await this.prisma.nigerianWard.findUnique({ where: { code: pos.wardCode }, select: { code: true } });
    if (!ward) throw new BadRequestException(`ward ${pos.wardCode} does not exist`);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");

      // Duplicate re-check — the ward may have gained a councilor since the proposal.
      const existing = await tx.$queryRawUnsafe<unknown[]>(
        `SELECT 1 FROM official_positions WHERE ward_code = $1 AND role = 'councilor' AND (end_date IS NULL OR end_date > now()) LIMIT 1`,
        pos.wardCode,
      );
      if (existing.length > 0) throw new BadRequestException(`ward ${pos.wardCode} already has a current councilor`);

      // Party FK re-validation (drop unknown parties).
      let party: string | null = null;
      if (pos.partyAcronym) {
        const p = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM political_parties WHERE acronym = $1`, pos.partyAcronym);
        if (p.length > 0) party = pos.partyAcronym;
      }

      const created = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO nigerian_officials (name) VALUES ($1) RETURNING id`, entity.official.name,
      );
      const officialId = created[0].id;

      await tx.$executeRawUnsafe(
        `INSERT INTO official_positions
           (official_id, role, ward_code, appointment_type, status, start_date,
            party_acronym, source_type, confidence, review_status, reviewed_by)
         VALUES ($1::uuid, 'councilor', $2, 'elected', 'active', $3::date, $4, $5, $6, 'reviewed', $7)`,
        officialId, pos.wardCode, pos.startDate, party, pos.sourceType, pos.confidence ?? "medium", adminId,
      );

      await this.recomputeOfficialCompleteness(tx, officialId);

      await tx.changeProposal.update({
        where: { id: proposal.id },
        data: { status: "approved", reviewedBy: adminId, reviewedAt: new Date(), appliedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          eventType: "official_created",
          targetType: "nigerian_officials",
          targetId: officialId,
          metadata: { proposalId: proposal.id, wardCode: pos.wardCode, role: "councilor" },
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
