import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { RequirePermission } from "@ournigeria/access";
import { AdminGuard } from "./admin.guard";
import { PermissionsGuard } from "./permissions.guard";
import { AdminEvalService } from "./admin-eval.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("ai.manage")
@ApiTags("Admin - Evaluation")
@Controller("admin/eval")
export class AdminEvalController {
  constructor(private service: AdminEvalService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get evaluation overview and per-file stats" })
  async getOverview(@Res() res: Response) {
    try {
      const data = this.service.getOverview();
      return res.json(data);
    } catch (err) {
      console.error("admin eval overview error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("file")
  @ApiOperation({
    summary: "Get evaluation questions and results for a specific file",
  })
  async getFile(@Query("name") name: string, @Res() res: Response) {
    try {
      if (!name) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "name query parameter is required" });
      }
      const data = this.service.getFile(name);
      if (!data) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Evaluation file not found" });
      }
      return res.json(data);
    } catch (err: any) {
      if (err?.status === 400) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: err.message });
      }
      console.error("admin eval file error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
