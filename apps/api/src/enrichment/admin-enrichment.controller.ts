import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
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
