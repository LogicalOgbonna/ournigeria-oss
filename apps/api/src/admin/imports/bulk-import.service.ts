import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService, type Prisma } from "@ournigeria/database";
import { EnrichmentApplyService } from "../../enrichment/enrichment-apply.service";
import { getImporter } from "./importer.registry";
import type { DatasetImporter, ImportDiff, ImportResult, ProposalSpec } from "./importer.types";

/**
 * Sentinel target_field for create proposals — matches the convention the
 * enrichment apply pipeline already uses (changeKind "create" dispatches by
 * targetTable; target_field is NOT NULL so it carries this placeholder).
 */
const CREATE_FIELD_SENTINEL = "__create__";

/**
 * Turns a curated dataset into change_proposals and applies them through the
 * EXISTING enrichment apply pipeline (inheriting evidence copy, completeness
 * recompute, and the least-privilege enrichment_apply role), recording an
 * import_runs audit row. This is the only audited write path — no second,
 * un-audited writer.
 */
@Injectable()
export class BulkImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applySvc: EnrichmentApplyService,
  ) {}

  private resolve(name: string): DatasetImporter {
    const importer = getImporter(name);
    if (!importer) throw new NotFoundException(`unknown dataset: ${name}`);
    return importer;
  }

  private runValidate(importer: DatasetImporter, json: unknown): void {
    try {
      importer.validate(json);
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e));
    }
  }

  /** Validate + diff only. No writes. */
  async preview(name: string, json: unknown): Promise<ImportDiff> {
    const importer = this.resolve(name);
    this.runValidate(importer, json);
    return importer.diff(json, this.prisma);
  }

  /**
   * Apply a dataset: for every changed spec, insert a change_proposal (+ its
   * sources) and route it through the audited apply pipeline. Each spec is
   * isolated in its own try/catch so one failure can't abort the batch.
   */
  async apply(name: string, json: unknown, adminId: string): Promise<ImportResult> {
    const importer = this.resolve(name);
    this.runValidate(importer, json);

    // Concurrency guard (plan 60 F7): a proxy timeout + admin retry must not
    // start a second overlapping apply whose diff was computed against
    // pre-first-run state (duplicate rows, split-brain creates). Runs older
    // than 30 minutes are treated as crashed and don't block.
    const staleCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const inFlight = await this.prisma.importRun.findFirst({
      where: { dataset: name, status: "running", startedAt: { gte: staleCutoff } },
      select: { id: true, startedAt: true },
    });
    if (inFlight) {
      throw new BadRequestException(
        `an apply for "${name}" is already running (started ${inFlight.startedAt.toISOString()}) — wait for it to finish, then re-preview before applying again`,
      );
    }

    const diff = await importer.diff(json, this.prisma);

    const run = await this.prisma.importRun.create({
      data: { dataset: name, adminId, status: "running" },
    });
    // Double-check after claiming: if another running row (created before or
    // concurrently with ours) exists, back out — closes the check-then-create
    // race from two admin tabs (review I5).
    const racer = await this.prisma.importRun.findFirst({
      where: { dataset: name, status: "running", id: { not: run.id }, startedAt: { gte: staleCutoff } },
      select: { id: true },
    });
    if (racer) {
      await this.prisma.importRun.update({ where: { id: run.id }, data: { status: "failed", notes: "concurrent apply detected — backed out", finishedAt: new Date() } });
      throw new BadRequestException(`an apply for "${name}" is already running — wait, then re-preview before applying again`);
    }

    let created = 0;
    let updated = 0;
    const errors: { label: string; error: string }[] = [];

    const applyOne = async (spec: ProposalSpec, kind: "create" | "update"): Promise<void> => {
      try {
        const proposal = await this.prisma.changeProposal.create({
          data: {
            targetTable: spec.targetTable,
            targetField: spec.targetField ?? CREATE_FIELD_SENTINEL,
            targetPk: spec.targetPk ?? null,
            proposedValue: spec.proposedValue as Prisma.InputJsonValue,
            changeKind: spec.changeKind,
            confidence: spec.confidence ?? "high",
            reasoning: spec.reasoning ?? `Curated import: ${name}`,
            status: "pending",
            sources: {
              create: spec.sources.map((s) => ({
                url: s.url,
                publisher: s.publisher,
                snippet: s.snippet,
                format: s.format,
                sourceTier: s.sourceTier ?? "web",
                confidence: s.confidence ?? "high",
                retrievedAt: s.retrievedAt ? new Date(s.retrievedAt) : new Date(),
              })),
            },
          },
          select: { id: true },
        });

        // The one audited write path: switches to enrichment_apply internally,
        // copies sources to evidence, recomputes completeness.
        await this.applySvc.apply(proposal.id, adminId);

        if (kind === "create") created++;
        else updated++;
      } catch (e) {
        errors.push({ label: spec.label, error: e instanceof Error ? e.message : String(e) });
      }
    };

    try {
      for (const spec of diff.creates) await applyOne(spec, "create");
      for (const spec of diff.updates) await applyOne(spec, "update");
    } finally {
      // The run row must never stay 'running' (it gates future applies for
      // 30 min) — finish it even if the loop throws unexpectedly.
      await this.prisma.importRun
        .update({
          where: { id: run.id },
          data: {
            status: errors.length ? "failed" : "done",
            createdCount: created,
            updatedCount: updated,
            skippedCount: diff.unchangedCount,
            errorCount: errors.length,
            finishedAt: new Date(),
            notes: errors.length ? errors.slice(0, 5).map((e) => `${e.label}: ${e.error}`).join(" | ") : null,
          },
        })
        .catch(() => {});
    }

    return { runId: run.id, created, updated, skipped: diff.unchangedCount, errors };
  }
}
