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
import {
  AdminAuthGuard,
  type AuthedRequest,
} from "../platforms/twitter/guards/admin-auth.guard.js";
import {
  DraftAction,
  ReplyQueueService,
} from "./reply-queue.service.js";

@ApiTags("Reply Queue")
@Controller("v1/replies")
@UseGuards(AdminAuthGuard)
export class ReplyQueueController {
  constructor(private readonly service: ReplyQueueService) {}

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
  @ApiOperation({ summary: "Approve and publish a draft" })
  async approve(@Param("id") id: string, @Req() req: AuthedRequest) {
    return this.service.approve(id, req.adminId);
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject a draft" })
  async reject(@Param("id") id: string, @Req() req: AuthedRequest) {
    return this.service.reject(id, req.adminId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit a draft's text" })
  async edit(@Param("id") id: string, @Body("content") content: string) {
    return this.service.editAndSave(id, content);
  }
}
