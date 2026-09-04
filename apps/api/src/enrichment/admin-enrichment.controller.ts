import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { RequirePermission } from "@ournigeria/access";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "../admin/admin.guard";
import { PermissionsGuard } from "../admin/permissions.guard";
import { AuditService, auditActorFromRequest } from "../audit/audit.service";
import { EnrichmentApplyService } from "./enrichment-apply.service";
import { ChangeProposalService } from "./change-proposal.service";
import { ENTITY_ROLE_BUCKETS } from "./entity-role";

const ACTION_VALUES = ["fill", "correction", "create"];
const ENTITY_VALUES = new Set<string>(ENTITY_ROLE_BUCKETS);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** Parse a CSV query param into a deduped list filtered to an allow-list. */
function parseCsv(value: string | undefined, allowed: (v: string) => boolean): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((s) => s.trim()).filter((s) => s && allowed(s)))];
}

@Public()
@Controller("admin/enrichment/proposals")
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("enrichment.review")
export class AdminEnrichmentController {
  constructor(
    private readonly applySvc: EnrichmentApplyService,
    private readonly query: ChangeProposalService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(
    @Query("status") status?: string,
    @Query("action") action?: string,
    @Query("entity") entity?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(limit ?? "", 10) || DEFAULT_LIMIT));
    return this.query.listPaginated({
      status: status ?? "pending",
      actions: parseCsv(action, (v) => ACTION_VALUES.includes(v)),
      entities: parseCsv(entity, (v) => ENTITY_VALUES.has(v)),
      cursor: cursor || undefined,
      limit: parsedLimit,
    });
  }

  /** Overview stats for the admin home — full status breakdown. Declared before `:id`. */
  @Get("stats")
  stats() {
    return this.query.stats();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.query.getWithSources(id);
  }

  /**
   * Bulk review. `approve` reuses the per-item apply path (and its safety guard, so
   * needs_more_sources items error individually); `reject`/`request-more` set status with
   * a shared note. Per-item try/catch — one bad item never aborts the batch.
   */
  @Post("bulk")
  @RequirePermission("enrichment.apply")
  async bulk(
    @Body() body: { ids?: string[]; action?: string; note?: string },
    @Req() req: any,
  ) {
    const actor = auditActorFromRequest(req);
    const ids = body?.ids;
    const action = body?.action;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException("ids must be a non-empty array");
    }
    if (ids.length > 100) {
      throw new BadRequestException("Maximum 100 proposals per bulk action");
    }
    if (action !== "approve" && action !== "reject" && action !== "request-more") {
      throw new BadRequestException("action must be approve | reject | request-more");
    }

    const results: Array<{ id: string; status: "ok" | "error"; error?: string }> = [];
    for (const id of ids) {
      try {
        if (action === "approve") {
          await this.applySvc.apply(id, req.adminId);
        } else {
          // Only un-reviewed proposals may be rejected/bounced — never flip an already-applied
          // proposal to 'rejected' (its data is live), which would desync status from reality.
          // Same-transaction audit: the status flip and its chain event commit together.
          await this.prisma.$transaction(async (tx) => {
            const updated = await tx.changeProposal.updateMany({
              where: { id, status: { in: ["pending", "needs_human", "needs_more_sources"] } },
              data: {
                status: action === "reject" ? "rejected" : "needs_more_sources",
                reviewNote: body.note,
                reviewedBy: req.adminId,
                reviewedAt: new Date(),
              },
            });
            if (updated.count === 0) {
              throw new BadRequestException("proposal not found or not in a reviewable status");
            }
            await this.audit.log(tx, actor, {
              action: action === "reject" ? "enrichment.rejected" : "enrichment.needs_more",
              targetType: "change_proposal",
              targetId: id,
              metadata: { pathway: "enrichment", bulk: true },
            });
          });
        }
        results.push({ id, status: "ok" });
      } catch (e) {
        results.push({ id, status: "error", error: e instanceof Error ? e.message : "failed" });
      }
    }
    return { results };
  }

  @Post(":id/approve")
  @RequirePermission("enrichment.apply")
  async approve(@Param("id") id: string, @Req() req: any) {
    // AdminGuard sets request.adminId as a plain string. Marks req audited —
    // the apply service writes the same-transaction chain event itself.
    auditActorFromRequest(req);
    await this.applySvc.apply(id, req.adminId);
    return { ok: true };
  }

  @Post(":id/reject")
  @RequirePermission("enrichment.apply")
  async reject(@Param("id") id: string, @Body() body: { note?: string }, @Req() req: any) {
    const actor = auditActorFromRequest(req);
    // Same-transaction audit: the rejection and its chain event commit together.
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.changeProposal.update({
        where: { id },
        data: { status: "rejected", reviewNote: body.note, reviewedBy: req.adminId, reviewedAt: new Date() },
      });
      await this.audit.log(tx, actor, {
        action: "enrichment.rejected",
        targetType: "change_proposal",
        targetId: id,
        metadata: { pathway: "enrichment" },
      });
      return result;
    });
  }

  @Post(":id/request-more")
  @RequirePermission("enrichment.apply")
  async requestMore(@Param("id") id: string, @Body() body: { note?: string }, @Req() req: any) {
    const actor = auditActorFromRequest(req);
    // Same-transaction audit: the bounce and its chain event commit together.
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.changeProposal.update({
        where: { id },
        data: { status: "needs_more_sources", reviewNote: body.note, reviewedBy: req.adminId, reviewedAt: new Date() },
      });
      await this.audit.log(tx, actor, {
        action: "enrichment.needs_more",
        targetType: "change_proposal",
        targetId: id,
        metadata: { pathway: "enrichment" },
      });
      return result;
    });
  }
}
