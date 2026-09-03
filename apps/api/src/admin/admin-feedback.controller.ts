import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { RequirePermission } from "@ournigeria/access";
import { AdminGuard } from "./admin.guard";
import { PermissionsGuard } from "./permissions.guard";
import { AdminFeedbackService } from "./admin-feedback.service";
import { AuditService, auditActorFromRequest } from "../audit/audit.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("feedback.read")
@Controller("admin/feedback")
export class AdminFeedbackController {
  constructor(
    private service: AdminFeedbackService,
    private audit: AuditService,
  ) {}

  @Get("stats")
  async getStats(@Res() res: Response) {
    try {
      const stats = await this.service.getStats();
      return res.json(stats);
    } catch (err) {
      console.error("admin feedback-stats error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get()
  async listFeedback(
    @Query("page") page = "1",
    @Query("limit") limit = "25",
    @Query("status") status?: string,
    @Query("category") category?: string,
    @Res() res?: Response,
  ) {
    try {
      const p = Math.max(1, parseInt(page));
      const l = Math.min(100, Math.max(1, parseInt(limit)));
      const data = await this.service.listFeedback(
        p,
        l,
        status || undefined,
        category || undefined,
      );
      return res!.json(data);
    } catch (err) {
      console.error("admin list-feedback error:", err);
      return res!
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get(":id")
  async getFeedback(@Param("id") id: string, @Res() res: Response) {
    try {
      const feedback = await this.service.getFeedback(id);
      if (!feedback) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Feedback not found" });
      }
      return res.json(feedback);
    } catch (err) {
      console.error("admin get-feedback error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Patch(":id")
  @RequirePermission("feedback.write")
  async updateFeedback(
    @Param("id") id: string,
    @Body() body: { status?: string; adminNotes?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const updated = await this.service.updateFeedback(id, body);
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "feedback.updated",
        targetType: "feedback",
        targetId: id,
        metadata: {},
      });
      return res.json(updated);
    } catch (err) {
      console.error("admin update-feedback error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Delete(":id")
  @RequirePermission("feedback.write")
  async deleteFeedback(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.service.deleteFeedback(id);
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "feedback.deleted",
        targetType: "feedback",
        targetId: id,
      });
      return res.json({ success: true });
    } catch (err) {
      console.error("admin delete-feedback error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
