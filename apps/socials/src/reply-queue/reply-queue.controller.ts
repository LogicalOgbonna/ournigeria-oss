import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { RequirePermission } from "@ournigeria/access";
import {
  AdminAuthGuard,
  type AuthedRequest,
} from "../platforms/twitter/guards/admin-auth.guard.js";
import { PermissionsGuard } from "../platforms/twitter/guards/permissions.guard.js";
import { AuditWriterService } from "../audit/audit-writer.service.js";
import {
  DraftAction,
  ReplyQueueService,
} from "./reply-queue.service.js";

@ApiTags("Reply Queue")
@Controller("v1/replies")
@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission("socials.review")
export class ReplyQueueController {
  constructor(
    private readonly service: ReplyQueueService,
    private readonly audit: AuditWriterService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List drafts (replies + quotes) by review status" })
  async list(
    @Query("reviewStatus") reviewStatus?: string,
    @Query("postType") postType?: DraftAction,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.service.getPending({
      reviewStatus,
      postType,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get("stats")
  @ApiOperation({ summary: "Aggregate counts for the queue dashboard" })
  async stats() {
    return this.service.getStats();
  }

  @Get("funnel")
  @ApiOperation({ summary: "Pipeline funnel counts (scanned → published)" })
  async funnel() {
    return this.service.getFunnel();
  }

  @Get("funnel/:stage")
  @ApiOperation({ summary: "List tweets/posts at a specific funnel stage" })
  async funnelStage(
    @Param("stage") stage: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.service.getFunnelStage(stage, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Patch("funnel/discovered/:tweetId")
  @ApiOperation({
    summary:
      "Update draft_status on a discovered tweet (null = re-queue for drafter)",
  })
  async setDiscoveredStatus(
    @Param("tweetId") tweetId: string,
    @Body("draftStatus") draftStatus: "skipped" | "error" | null,
  ) {
    return this.service.setDiscoveredDraftStatus(tweetId, draftStatus);
  }

  @Post(":id/approve")
  @RequirePermission("socials.publish")
  @ApiOperation({ summary: "Approve and publish a draft" })
  async approve(@Param("id") id: string, @Req() req: AuthedRequest) {
    const result = await this.service.approve(id, req.adminId);
    await this.audit.log(req.adminId, {
      action: "socials.reply.approved",
      targetType: "social_post",
      targetId: id,
      metadata: { pathway: "direct" },
    });
    return result;
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject a draft" })
  async reject(@Param("id") id: string, @Req() req: AuthedRequest) {
    const result = await this.service.reject(id, req.adminId);
    await this.audit.log(req.adminId, {
      action: "socials.reply.rejected",
      targetType: "social_post",
      targetId: id,
      metadata: { pathway: "direct" },
    });
    return result;
  }

  @Post(":id/mark-posted")
  @RequirePermission("socials.publish")
  @ApiOperation({
    summary:
      "Mark a draft as posted manually (via X Web Intent) without calling the X API",
  })
  async markPosted(
    @Param("id") id: string,
    @Req() req: AuthedRequest,
    @Body("externalId") externalId?: string,
  ) {
    const result = await this.service.markPosted(id, req.adminId, externalId);
    await this.audit.log(req.adminId, {
      action: "socials.reply.posted",
      targetType: "social_post",
      targetId: id,
      metadata: { pathway: "direct" },
    });
    return result;
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit a draft's text" })
  async edit(
    @Param("id") id: string,
    @Body("content") content: string,
    @Req() req: AuthedRequest,
  ) {
    const result = await this.service.editAndSave(id, content);
    await this.audit.log(req.adminId, {
      action: "socials.reply.edited",
      targetType: "social_post",
      targetId: id,
      metadata: { pathway: "direct" },
    });
    return result;
  }
}
