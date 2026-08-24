import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService, slugifyName } from "@ournigeria/database";
import { isAppliable, COMPLETENESS_FIELDS_BY_TABLE, pkClause } from "./enrichment.constants";
import { isCreatableCouncilor } from "./councilor.constants";
import { getCreatableEntity } from "./creatable.registry";
import type { CouncilorProposedEntity } from "./agent/profile.types";
import { ImageStorageService } from "../images/image-storage.service";
import { CompletenessService } from "../completeness/completeness.service";

/** All-zero uuid, used as a placeholder target_id for non-uuid-keyed tables. */
const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

@Injectable()
export class EnrichmentApplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: ImageStorageService,
    private readonly completeness: CompletenessService,
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
      // Seat-stranding guard (issue #109): a status downgrade must never leave an
      // occupied seat with zero active holders — the 2026-06-26 reconciliation
      // import orphaned 314 mha seats this way. Runs INSIDE the tx, before the
      // role drop, with FOR UPDATE locks so two concurrent downgrades of a
      // seat's co-holders serialize instead of both passing the count check.
      // The members importer is unaffected: bulk imports apply creates
      // (replacement install) before updates (downgrade), so the replacement's
      // active position already exists at this check.
      if (
        proposal.targetTable === "official_positions" &&
        proposal.targetField === "status" &&
        value !== "active"
      ) {
        const [row] = await tx.$queryRawUnsafe<
          { role: string; constituency_code: string | null; status: string }[]
        >(
          `SELECT role, constituency_code, status FROM official_positions WHERE id = $1::uuid FOR UPDATE`,
          targetPk,
        );
        if (row?.status === "active" && row.constituency_code) {
          const [{ count }] = await tx.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*)::bigint AS count FROM (
               SELECT id FROM official_positions
               WHERE role = $1 AND constituency_code = $2 AND status = 'active'
                 AND (end_date IS NULL OR end_date > now())
                 AND id <> $3::uuid
               FOR UPDATE
             ) locked`,
            row.role,
            row.constituency_code,
            targetPk,
          );
          if (Number(count) === 0) {
            throw new BadRequestException(
              `refusing status '${String(value)}': it would leave seat ${row.role}/${row.constituency_code} with no active holder — install the replacement first (e.g. the state-assembly-members import, which pairs install + downgrade)`,
            );
          }
        }
      }

      // Drop to the least-privileged role for the live write; resets at tx end.
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");

      await tx.$executeRawUnsafe(
        `UPDATE "${proposal.targetTable}" SET "${proposal.targetField}" = $1 WHERE ${pkClause(proposal.targetTable, 2)}`,
        value,
        targetPk,
      );

      // A corrected official name must carry its slug forward, and preserve the
      // old slug as a redirectable alias — same as the citizen correction path.
      // Agents only ever *correct* a name; a succession (new officeholder) is a
      // human review decision, never applied here.
      if (proposal.targetTable === "nigerian_officials" && proposal.targetField === "name") {
        await this.reslugOfficialInTx(tx, targetPk, String(value));
      }

      // The approved fact carries its proposal sources forward as live evidence
      // (Plan 45c): official flat fields key as official_field + field name.
      if (proposal.targetTable === "nigerian_officials") {
        await this.copySourcesToEvidence(tx, proposalId, "official_field", targetPk, proposal.targetField);
      } else if (proposal.targetTable === "official_positions") {
        await this.copySourcesToEvidence(tx, proposalId, "position", targetPk);
      }

      // Inline completeness recompute for tables that use it (parties). Officials
      // are excluded from COMPLETENESS_FIELDS_BY_TABLE — they recompute post-commit
      // via the category-aware CompletenessService below.
      if (COMPLETENESS_FIELDS_BY_TABLE[proposal.targetTable]) {
        await this.recomputeCompleteness(tx, proposal.targetTable, targetPk);
      }

      await tx.changeProposal.update({
        where: { id: proposalId },
        data: { status: "approved", reviewedBy: adminId, reviewedAt: new Date(), appliedAt: new Date() },
      });

      // activity_log.target_id is a uuid column. Most appliable tables are uuid-keyed,
      // but some (e.g. political_parties, keyed by varchar `acronym`) are not — for
      // those we log the nil uuid and carry the real natural key in metadata so the
      // whole apply tx doesn't roll back on a uuid cast error.
      const uuidPk = isUuid(targetPk);
      await tx.activityLog.create({
        data: {
          eventType: "proposal_applied",
          targetType: proposal.targetTable,
          targetId: uuidPk ? targetPk : NIL_UUID,
          metadata: {
            proposalId,
            field: proposal.targetField,
            changeKind: proposal.changeKind,
            ...(uuidPk ? {} : { targetPk }),
          },
        },
      });
    });

    // Post-commit by design (Plan 45c Fix #4): a crashed recompute leaves a
    // stale score that self-heals on the next apply — never a broken apply.
    if (proposal.targetTable === "nigerian_officials") {
      await this.completeness.recompute(targetPk).catch(() => {});
    }
  }

  /**
   * Apply a create proposal as enrichment_apply. Two shapes:
   *  - councilor (legacy bespoke): nigerian_officials + official_positions pair
   *  - registry entities (Plan 45c): one structured fact row, dispatched by
   *    targetTable via CREATABLE_ENTITIES
   */
  private async applyCreate(
    proposal: { id: string; targetTable: string; proposedValue: unknown; confidence: string },
    adminId: string,
  ): Promise<void> {
    if (proposal.targetTable === "nigerian_officials") {
      return this.applyCreateCouncilor(proposal, adminId);
    }

    const entity = getCreatableEntity(proposal.targetTable);
    if (!entity) {
      throw new BadRequestException(`not a creatable entity: ${proposal.targetTable}`);
    }
    const payload = entity.validate(proposal.proposedValue);

    let officialId: string | undefined;
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");

      if (entity.preflight) await entity.preflight(tx, payload);
      const created = await entity.insert(tx, payload, {
        adminId,
        confidence: proposal.confidence ?? "medium",
      });
      officialId = created.officialId;

      // Skip evidence for non-uuid-keyed entities (entity.evidenceEntryType=null,
      // e.g. political_parties keyed by varchar `acronym`) — evidence.entry_id is
      // a uuid column and created.id would be the acronym, which can't cast.
      if (entity.evidenceEntryType) {
        await this.copySourcesToEvidence(tx, proposal.id, entity.evidenceEntryType, created.id);
      }

      await tx.changeProposal.update({
        where: { id: proposal.id },
        data: { status: "approved", reviewedBy: adminId, reviewedAt: new Date(), appliedAt: new Date() },
      });

      // activity_log.target_id is a uuid column. Most creatable entities return a
      // uuid id, but non-uuid-keyed ones (political_parties → acronym) return a
      // natural key — log the nil uuid and carry the real key in metadata so the
      // uuid cast doesn't roll back the whole apply tx.
      const uuidId = isUuid(created.id);
      await tx.activityLog.create({
        data: {
          eventType: "fact_created",
          targetType: proposal.targetTable,
          targetId: uuidId ? created.id : NIL_UUID,
          metadata: {
            proposalId: proposal.id,
            officialId: created.officialId ?? null,
            ...(uuidId ? {} : { targetPk: created.id }),
          },
        },
      });
    });

    if (officialId) {
      await this.completeness.recompute(officialId).catch(() => {});
    }
  }

  /** Legacy councilor create: insert a new official + councilor position. */
  private async applyCreateCouncilor(
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

    let officialId: string | undefined;
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

      // A councilor is an elected official (SIEC LG election), so the person-level
      // official_type is 'elected' — mirrors the assembly-member create path
      // (creatable.registry.ts) and the schema invariant that every official is
      // elected (backfill in migration 20260612030815). chk_official_type permits it.
      const created = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO nigerian_officials (name, slug, official_type) VALUES ($1, $2, 'elected') RETURNING id`,
        entity.official.name, slug,
      );
      officialId = created[0].id;

      const position = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO official_positions
           (official_id, role, ward_code, appointment_type, status, start_date,
            party_acronym, source_type, confidence, review_status, reviewed_by)
         VALUES ($1::uuid, 'councilor', $2, 'elected', 'active', $3::date, $4, $5, $6, 'reviewed', $7)
         RETURNING id`,
        officialId, pos.wardCode, pos.startDate, party, pos.sourceType, pos.confidence ?? "medium", adminId,
      );

      // The councilor's evidence lands on the position row (the verifiable fact).
      // Official completeness is recomputed post-commit via CompletenessService.
      await this.copySourcesToEvidence(tx, proposal.id, "position", position[0].id);

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

    if (officialId) {
      await this.completeness.recompute(officialId).catch(() => {});
    }
  }

  /**
   * Copy a proposal's sources onto the applied fact as live evidence rows
   * (Plan 45c). Runs inside the apply tx as enrichment_apply (INSERT granted
   * in migration 20260612030815). Snapshot capture happens async later (45d) —
   * rows start at snapshot_status='pending'.
   */
  private async copySourcesToEvidence(
    tx: { $executeRawUnsafe(sql: string, ...params: unknown[]): Promise<number> },
    proposalId: string,
    entryType: string,
    entryId: string,
    field: string | null = null,
  ): Promise<void> {
    await tx.$executeRawUnsafe(
      `INSERT INTO evidence
         (entry_type, entry_id, field, url, archive_url, publisher, snippet,
          format, locator, source_tier, confidence, retrieved_at)
       SELECT $1, $2::uuid, $3, url, archive_url, publisher, snippet,
              format, locator, source_tier, confidence, retrieved_at
       FROM proposal_sources WHERE proposal_id = $4::uuid`,
      entryType,
      entryId,
      field,
      proposalId,
    );
  }

  /**
   * Recompute completeness = (non-null of the table's completeness fields) / count.
   * Table-driven via COMPLETENESS_FIELDS_BY_TABLE (parties only — officials use
   * the category-aware CompletenessService). `table` is a static map key (not
   * user input), so it's safe to interpolate.
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
    excludeOfficialId?: string,
  ): Promise<string> {
    let base = slugifyName(name);
    if (!base) base = `official-${randomBytes(4).toString("hex")}`;

    const rows = await tx.nigerianOfficial.findMany({
      // Exclude the official being renamed so its current slug doesn't count as
      // "used" against itself (a light edit shouldn't needlessly get a -2 suffix).
      where: {
        OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }],
        ...(excludeOfficialId ? { id: { not: excludeOfficialId } } : {}),
      },
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

  /**
   * After a name correction, regenerate the official's slug and preserve the old
   * one as a redirectable alias. Runs inside the apply tx as enrichment_apply
   * (granted SELECT/INSERT/UPDATE/DELETE on official_slug_aliases + UPDATE on
   * nigerian_officials). No-op when the corrected name maps to the same slug.
   */
  private async reslugOfficialInTx(tx: any, officialId: string, newName: string): Promise<void> {
    const official = await tx.nigerianOfficial.findUnique({
      where: { id: officialId },
      select: { slug: true },
    });
    const oldSlug: string | null = official?.slug ?? null;
    const stateCode =
      (
        await tx.officialPosition.findFirst({
          where: { officialId, stateCode: { not: null } },
          select: { stateCode: true },
        })
      )?.stateCode ?? undefined;

    const newSlug = await this.generateUniqueOfficialSlug(tx, newName, stateCode, officialId);
    if (oldSlug && newSlug === oldSlug) return;

    // A slug is either a live canonical slug or an alias, never both.
    await tx.officialSlugAlias.deleteMany({ where: { slug: newSlug } });
    await tx.nigerianOfficial.update({ where: { id: officialId }, data: { slug: newSlug } });
    if (oldSlug && oldSlug !== newSlug) {
      await tx.officialSlugAlias.upsert({
        where: { slug: oldSlug },
        update: { officialId },
        create: { slug: oldSlug, officialId },
      });
    }
  }
}
