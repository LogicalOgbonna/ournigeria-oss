import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "../admin/admin.guard";
import { EnrichmentApplyService } from "./enrichment-apply.service";
import { ChangeProposalService } from "./change-proposal.service";

@Public()
@Controller("admin/enrichment/proposals")
@UseGuards(AdminGuard)
export class AdminEnrichmentController {
  constructor(
    private readonly applySvc: EnrichmentApplyService,
    private readonly query: ChangeProposalService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@Query("status") status?: string) {
    return this.query.listByStatus(status ?? "pending");
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
  async bulk(
    @Body() body: { ids?: string[]; action?: string; note?: string },
    @Req() req: any,
  ) {
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
          const updated = await this.prisma.changeProposal.updateMany({
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
        }
        results.push({ id, status: "ok" });
      } catch (e) {
        results.push({ id, status: "error", error: e instanceof Error ? e.message : "failed" });
      }
    }
    return { results };
  }

  @Post(":id/approve")
  async approve(@Param("id") id: string, @Req() req: any) {
    // AdminGuard sets request.adminId as a plain string
    await this.applySvc.apply(id, req.adminId);
    return { ok: true };
  }

  @Post(":id/reject")
  async reject(@Param("id") id: string, @Body() body: { note?: string }, @Req() req: any) {
    return this.prisma.changeProposal.update({
      where: { id },
      data: { status: "rejected", reviewNote: body.note, reviewedBy: req.adminId, reviewedAt: new Date() },
    });
  }

  @Post(":id/request-more")
  async requestMore(@Param("id") id: string, @Body() body: { note?: string }, @Req() req: any) {
    return this.prisma.changeProposal.update({
      where: { id },
      data: { status: "needs_more_sources", reviewNote: body.note, reviewedBy: req.adminId, reviewedAt: new Date() },
    });
  }
}
