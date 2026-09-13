import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermission } from "@ournigeria/access";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "../admin/admin.guard";
import { PermissionsGuard } from "../admin/permissions.guard";
import { auditActorFromRequest } from "../audit/audit.service";
import { AdminElectionsService } from "./admin-elections.service";
import {
  createSchema,
  gateSchema,
  listQuerySchema,
  parseOrThrow,
  patchSchema,
  reasonSchema,
} from "./admin-elections.schemas";

type AdminReq = Request & { adminId: string };

/**
 * D5 permission split: CRUD needs elections.write (campaign_manager);
 * publish/unpublish/conclude/cancel and the kill switch are visibility acts
 * needing campaigns.review (review_manager). Reads accept either role so a
 * reviewer can see what they are publishing.
 */
@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@ApiTags("Admin - Elections")
@Controller("admin/elections")
export class AdminElectionsController {
  constructor(private readonly svc: AdminElectionsService) {}

  @Get()
  @RequirePermission("elections.write", "campaigns.review")
  @ApiOperation({ summary: "List election events, every status" })
  list(@Query() query: unknown) {
    return this.svc.list(parseOrThrow(listQuerySchema, query));
  }

  // ---------- kill switch (declared before `:id`, Nest matches in order) ----------

  @Post("gate")
  @RequirePermission("campaigns.review")
  @ApiOperation({ summary: "Toggle the elections.gate_enabled kill switch (D10.8)" })
  gate(@Req() req: AdminReq, @Body() body: unknown) {
    return this.svc.setGate(auditActorFromRequest(req), parseOrThrow(gateSchema, body).enabled);
  }

  @Get(":id")
  @RequirePermission("elections.write", "campaigns.review")
  get(@Param("id") id: string) {
    return this.svc.get(id);
  }

  @Post()
  @RequirePermission("elections.write")
  @ApiOperation({ summary: "Create a draft (unpublished) election event" })
  create(@Req() req: AdminReq, @Body() body: unknown) {
    return this.svc.create(auditActorFromRequest(req), parseOrThrow(createSchema, body));
  }

  @Patch(":id")
  @RequirePermission("elections.write")
  @ApiOperation({ summary: "Edit an event; published/status never move here" })
  patch(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.patch(auditActorFromRequest(req), id, parseOrThrow(patchSchema, body));
  }

  @Delete(":id")
  @RequirePermission("elections.write")
  remove(@Req() req: AdminReq, @Param("id") id: string) {
    return this.svc.remove(auditActorFromRequest(req), id);
  }

  // ---------- review verbs ----------

  @Post(":id/publish")
  @RequirePermission("campaigns.review")
  publish(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.publish(auditActorFromRequest(req), req.adminId, id, parseOrThrow(reasonSchema, body).reason);
  }

  @Post(":id/unpublish")
  @RequirePermission("campaigns.review")
  unpublish(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.unpublish(auditActorFromRequest(req), id, parseOrThrow(reasonSchema, body).reason);
  }

  @Post(":id/conclude")
  @RequirePermission("campaigns.review")
  conclude(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.conclude(auditActorFromRequest(req), id, parseOrThrow(reasonSchema, body).reason);
  }

  @Post(":id/cancel")
  @RequirePermission("campaigns.review")
  cancel(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.cancel(auditActorFromRequest(req), id, parseOrThrow(reasonSchema, body).reason);
  }
}
