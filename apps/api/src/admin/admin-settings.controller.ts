import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AdminGuard } from "./admin.guard";
import { AdminSettingsService } from "./admin-settings.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard)
@ApiTags("Admin - Settings")
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(private service: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get all settings grouped by category" })
  async getAll(@Res() res: Response) {
    try {
      const settings = await this.service.getAll();
      return res.json({ settings });
    } catch (err) {
      console.error("admin settings getAll error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get("env")
  @ApiOperation({ summary: "Get read-only environment variables" })
  async getEnvVars(@Res() res: Response) {
    try {
      const envVars = this.service.getReadOnlyEnvVars();
      return res.json({ envVars });
    } catch (err) {
      console.error("admin settings getEnvVars error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("test-connection")
  @ApiOperation({ summary: "Test LLM or embedding provider connectivity" })
  async testConnection(
    @Body() body: { type: "llm" | "embedding"; config: Record<string, string> },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.testConnection(body.type, body.config);
      return res.json(result);
    } catch (err) {
      console.error("admin settings testConnection error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Put("bulk")
  @ApiOperation({ summary: "Bulk upsert multiple settings" })
  async bulkUpsert(
    @Body() body: { settings: { key: string; value: string }[] },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const adminId = (req as any).adminId as string;
      await this.service.bulkUpsert(body.settings, adminId);
      return res.json({ success: true });
    } catch (err) {
      console.error("admin settings bulkUpsert error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Get(":key")
  @ApiOperation({ summary: "Get a single setting by key" })
  async getByKey(@Param("key") key: string, @Res() res: Response) {
    try {
      const setting = await this.service.getByKey(key);
      if (!setting) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Setting not found" });
      }
      return res.json(setting);
    } catch (err) {
      console.error("admin settings getByKey error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Put(":key")
  @ApiOperation({ summary: "Upsert a single setting" })
  async upsert(
    @Param("key") key: string,
    @Body() body: { value: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const adminId = (req as any).adminId as string;
      const setting = await this.service.upsert(key, body.value, adminId);
      return res.json(setting);
    } catch (err) {
      console.error("admin settings upsert error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
