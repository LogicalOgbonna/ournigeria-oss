import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../guards/admin-auth.guard.js";
import { InboxService } from "../inbox/inbox.service.js";

@ApiTags("Roamer / Inbox")
@Controller("v1/inbox")
@UseGuards(AdminAuthGuard)
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get("status")
  @ApiOperation({ summary: "Reply-inbox poller status" })
  status() {
    return this.inbox.status();
  }

  @Post("start")
  @ApiOperation({ summary: "Start / recover the reply-inbox loop on this node" })
  start() {
    return this.inbox.start();
  }

  @Post("stop")
  @ApiOperation({ summary: "Stop the reply-inbox loop on this node" })
  async stop() {
    await this.inbox.stop();
    return { ok: true };
  }
}
