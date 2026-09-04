import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
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
import { AdminConnectionsService } from "./admin-connections.service";
import { AuditService, auditActorFromRequest } from "../audit/audit.service";
import { Public } from "../auth/decorators/public";

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermission("settings.write")
@ApiTags("Admin - Provider Connections")
@Controller("admin/connections")
export class AdminConnectionsController {
  constructor(
    private service: AdminConnectionsService,
    private audit: AuditService,
  ) {}

  /* ---- Static routes first (before :id params) ---- */

  @Get()
  @ApiOperation({ summary: "List all provider connections" })
  async list(
    @Query("type") type: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const connections = await this.service.list(type);
      return res.json({ connections });
    } catch (err) {
      console.error("admin connections list error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post()
  @ApiOperation({ summary: "Create a new provider connection" })
  async create(
    @Body()
    body: {
      name: string;
      type: "llm" | "embedding" | "ocr";
      provider: string;
      baseUrl: string;
      apiKey: string;
      modelId: string;
      modelSmall?: string;
      dimension?: number;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const adminId = (req as any).adminId as string;
      const connection = await this.service.create({
        ...body,
        createdBy: adminId,
      });
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "connection.created",
        targetType: "connection",
        targetId: connection.id,
        metadata: { name: body.name, type: body.type },
      });
      return res.status(HttpStatus.CREATED).json(connection);
    } catch (err) {
      console.error("admin connections create error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post("test")
  @ApiOperation({ summary: "Test a connection config (before saving)" })
  async testConnection(
    @Body()
    body: {
      type: "llm" | "embedding" | "ocr";
      provider: string;
      baseUrl: string;
      apiKey: string;
      modelId: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.testConnection(body);
      return res.json(result);
    } catch (err) {
      console.error("admin connections testConnection error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  /* ---- Parameterized routes ---- */

  @Get(":id")
  @ApiOperation({ summary: "Get a single provider connection" })
  async getById(@Param("id") id: string, @Res() res: Response) {
    try {
      const connection = await this.service.getById(id);
      if (!connection) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Connection not found" });
      }
      return res.json(connection);
    } catch (err) {
      console.error("admin connections getById error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a provider connection" })
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      provider?: string;
      baseUrl?: string;
      apiKey?: string;
      modelId?: string;
      modelSmall?: string;
      dimension?: number;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const connection = await this.service.update(id, body);
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "connection.updated",
        targetType: "connection",
        targetId: id,
        metadata: {},
      });
      return res.json(connection);
    } catch (err) {
      console.error("admin connections update error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a provider connection" })
  async delete(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const deleted = await this.service.delete(id);
      if (!deleted) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Connection not found" });
      }
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "connection.deleted",
        targetType: "connection",
        targetId: id,
        metadata: {},
      });
      return res.json({ success: true });
    } catch (err) {
      console.error("admin connections delete error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post(":id/activate")
  @ApiOperation({ summary: "Activate a connection (makes it the current one)" })
  async activate(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const connection = await this.service.activate(id);
      if (!connection) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Connection not found" });
      }
      await this.audit.log(null, auditActorFromRequest(req as any), {
        action: "connection.activated",
        targetType: "connection",
        targetId: id,
        metadata: {},
      });
      return res.json(connection);
    } catch (err) {
      console.error("admin connections activate error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }

  @Post(":id/test")
  @ApiOperation({ summary: "Test an existing connection by ID" })
  async testById(@Param("id") id: string, @Res() res: Response) {
    try {
      const result = await this.service.testById(id);
      return res.json(result);
    } catch (err) {
      console.error("admin connections testById error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  }
}
