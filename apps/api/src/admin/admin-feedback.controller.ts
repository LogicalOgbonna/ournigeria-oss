import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { AdminGuard } from "./admin.guard";
import { AdminFeedbackService } from "./admin-feedback.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard)
@Controller("admin/feedback")
export class AdminFeedbackController {
  constructor(private service: AdminFeedbackService) {}

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
  async updateFeedback(
    @Param("id") id: string,
    @Body() body: { status?: string; adminNotes?: string },
    @Res() res: Response,
  ) {
    try {
      const updated = await this.service.updateFeedback(id, body);
      return res.json(updated);
    } catch (err) {
      console.error("admin update-feedback error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Delete(":id")
  async deleteFeedback(@Param("id") id: string, @Res() res: Response) {
    try {
      await this.service.deleteFeedback(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("admin delete-feedback error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
