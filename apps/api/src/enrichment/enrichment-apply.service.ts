import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService, slugifyName } from "@ournigeria/database";
import { isAppliable, COMPLETENESS_FIELDS_BY_TABLE, pkClause } from "./enrichment.constants";
import { isCreatableCouncilor } from "./councilor.constants";
import type { CouncilorProposedEntity } from "./agent/profile.types";
import { ImageStorageService } from "../images/image-storage.service";

@Injectable()
export class EnrichmentApplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: ImageStorageService,
  ) {}

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
    // A non-create proposal targets an existing row; a missing PK is malformed.
    if (!proposal.targetPk) {
      throw new BadRequestException("proposal is missing a target row id");
    }
    const targetPk = proposal.targetPk;

    // Identifiers are safe: both passed isAppliable() against a static allow-list.
    let value = (proposal.proposedValue as unknown) ?? null;

    // Official photos: the agent proposes a *foreign* image URL (e.g. nass.gov.ng).
    // Pull it into our own storage (resized webp on S3/CDN) BEFORE the tx — never
    // persist a hotlinked URL. Done outside the tx because it does network I/O.
    if (
      proposal.targetTable === "nigerian_officials" &&
      proposal.targetField === "image_url" &&
      typeof value === "string" &&
      value.length > 0 &&
      !this.imageStorage.isStoredUrl(value)
    ) {
      value = (await this.imageStorage.storeOfficialImage(value, targetPk)).url;
    }

    await this.prisma.$transaction(async (tx) => {
      // Drop to the least-privileged role for the live write; resets at tx end.
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");

      await tx.$executeRawUnsafe(
        `UPDATE "${proposal.targetTable}" SET "${proposal.targetField}" = $1 WHERE ${pkClause(proposal.targetTable, 2)}`,
        value,
        targetPk,
      );

      if (COMPLETENESS_FIELDS_BY_TABLE[proposal.targetTable]) {
        await this.recomputeCompleteness(tx, proposal.targetTable, targetPk);
      }

      await tx.changeProposal.update({
        where: { id: proposalId },
        data: { status: "approved", reviewedBy: adminId, reviewedAt: new Date(), appliedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          eventType: "proposal_applied",
          targetType: proposal.targetTable,
          targetId: targetPk,
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

      // Generate a unique SEO slug up front (mirrors the citizen create path) so the new
      // official gets a human-readable /officials/<slug> URL instead of falling back to its UUID.
      const slug = await this.generateUniqueOfficialSlug(tx, entity.official.name, entity.meta?.state);

      const created = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO nigerian_officials (name, slug) VALUES ($1, $2) RETURNING id`,
        entity.official.name, slug,
      );
      const officialId = created[0].id;

      await tx.$executeRawUnsafe(
        `INSERT INTO official_positions
           (official_id, role, ward_code, appointment_type, status, start_date,
            party_acronym, source_type, confidence, review_status, reviewed_by)
         VALUES ($1::uuid, 'councilor', $2, 'elected', 'active', $3::date, $4, $5, $6, 'reviewed', $7)`,
        officialId, pos.wardCode, pos.startDate, party, pos.sourceType, pos.confidence ?? "medium", adminId,
      );

      await this.recomputeCompleteness(tx, "nigerian_officials", officialId);

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

  /**
   * Recompute completeness = (non-null of the table's completeness fields) / count.
   * Table-driven via COMPLETENESS_FIELDS_BY_TABLE; mirrors CompletenessService.
   * The `table` is a static map key (not user input), so it's safe to interpolate.
   */
  private async recomputeCompleteness(tx: any, table: string, rowId: string): Promise<void> {
    const fields = COMPLETENESS_FIELDS_BY_TABLE[table];
    if (!fields) return; // table has no completeness definition; nothing to do
    const cols = fields
      .map((f) => `(CASE WHEN "${f}" IS NOT NULL AND "${f}"::text <> '' THEN 1 ELSE 0 END)`)
      .join(" + ");
    await tx.$executeRawUnsafe(
      `UPDATE "${table}"
         SET "completeness_score" = ROUND(((${cols})::numeric / ${fields.length}), 2)
       WHERE ${pkClause(table, 1)}`,
      rowId,
    );
  }

  /**
   * Unique, human-readable slug for a new official. Mirrors proposals.service's citizen path:
   * slugifyName(name); on collision append the state code, then a numeric suffix. Runs inside
   * the apply tx (enrichment_apply has SELECT on nigerian_officials, so the dup check is allowed).
   */
  private async generateUniqueOfficialSlug(
    tx: { nigerianOfficial: { findMany: (args: any) => Promise<{ slug: string | null }[]> } },
    name: string,
    stateCode?: string,
  ): Promise<string> {
    let base = slugifyName(name);
    if (!base) base = `official-${randomBytes(4).toString("hex")}`;

    const rows = await tx.nigerianOfficial.findMany({
      where: { OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }] },
      select: { slug: true },
    });
    const used = new Set(rows.map((r) => r.slug).filter((s): s is string => !!s));

    if (!used.has(base)) return base;

    const stateSuffix = stateCode ? slugifyName(stateCode) : "";
    if (stateSuffix && !used.has(`${base}-${stateSuffix}`)) return `${base}-${stateSuffix}`;

    let n = 2;
    while (used.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }
}
