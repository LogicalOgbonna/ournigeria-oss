import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { RequirePermission } from "@ournigeria/access";
import { AdminGuard } from "./admin.guard";
import { PermissionsGuard } from "./permissions.guard";
import { AdminConversationsService } from "./admin-conversations.service";
import { AuditService, auditActorFromRequest } from "../audit/audit.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("conversations.read")
@ApiTags("Admin - Conversations")
@Controller("admin/conversations")
export class AdminConversationsController {
  constructor(
    private service: AdminConversationsService,
    private audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all conversations (paginated)" })
  async listConversations(
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("q") search?: string,
    @Res() res?: Response,
  ) {
    try {
      const p = Math.max(1, parseInt(page));
      const l = Math.min(100, Math.max(1, parseInt(limit)));
      const data = await this.service.listConversations(
        p,
        l,
        search || undefined,
      );
      return res!.json(data);
    } catch (err) {
      console.error("admin list-conversations error:", err);
      return res!
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get conversation with messages" })
  async getConversation(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const conversation = await this.service.getConversation(id);
      if (!conversation) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Conversation not found" });
      }
      void this.audit.logBestEffort(auditActorFromRequest(req as any), {
        action: "conversation.viewed",
        targetType: "conversation",
        targetId: id,
      });
      return res.json(conversation);
    } catch (err) {
      console.error("admin get-conversation error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
