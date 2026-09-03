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
import { AdminSystemService } from "./admin-system.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("system.write")
@ApiTags("Admin - System")
@Controller("admin/system")
export class AdminSystemController {
  constructor(private service: AdminSystemService) {}

  @Get("health")
  @ApiOperation({ summary: "Get system health status" })
  async getHealth(@Res() res: Response) {
    try {
      const data = await this.service.getHealth();
      return res.json(data);
    } catch (err) {
      console.error("admin system-health error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("logs")
  @ApiOperation({ summary: "Get recent system logs" })
  async getLogs(
    @Query("level") level?: string,
    @Query("service") service?: string,
    @Query("limit") limit = "100",
    @Query("offset") offset = "0",
    @Res() res?: Response,
  ) {
    try {
      const data = await this.service.getLogs(
        level,
        service,
        Math.min(500, Math.max(1, parseInt(limit))),
        Math.max(0, parseInt(offset)),
      );
      return res!.json(data);
    } catch (err) {
      console.error("admin system-logs error:", err);
      return res!
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("jobs")
  @ApiOperation({ summary: "Get background jobs / ingestion runs" })
  async getJobs(@Res() res: Response) {
    try {
      const data = await this.service.getJobs();
      return res.json({ data });
    } catch (err) {
      console.error("admin system-jobs error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
