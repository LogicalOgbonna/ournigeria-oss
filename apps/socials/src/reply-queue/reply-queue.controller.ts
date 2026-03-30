import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ReplyQueueService } from "./reply-queue.service.js";

@ApiTags("Reply Queue")
@Controller("replies")
export class ReplyQueueController {
  constructor(private readonly service: ReplyQueueService) {}

  @Get()
  @ApiOperation({ summary: "List pending reply candidates" })
  async list(
    @Query("reviewStatus") reviewStatus?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.service.getPending({
      reviewStatus,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post(":id/approve")
  @ApiOperation({ summary: "Approve and publish a reply" })
  async approve(
    @Param("id") id: string,
    @Body("adminId") adminId: string,
  ) {
    return this.service.approve(id, adminId);
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject a reply candidate" })
  async reject(
    @Param("id") id: string,
    @Body("adminId") adminId: string,
  ) {
    return this.service.reject(id, adminId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit a reply draft" })
  async edit(@Param("id") id: string, @Body("content") content: string) {
    return this.service.editAndSave(id, content);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get reply queue statistics" })
  async stats() {
    return this.service.getStats();
  }
}
