import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermission } from "@ournigeria/access";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "../admin/admin.guard";
import { PermissionsGuard } from "../admin/permissions.guard";
import { auditActorFromRequest } from "../audit/audit.service";
import { AdminCampaignsService } from "./admin-campaigns.service";
import { AdminCampaignCouncilService } from "./admin-campaign-council.service";
import {
  createSchema,
  endMemberSchema,
  listQuerySchema,
  memberPatchSchema,
  memberSchema,
  noteSchema,
  orderSchema,
  parseOrThrow,
  patchSchema,
  reasonSchema,
  rolePatchSchema,
  roleSchema,
  slugSchema,
} from "./admin-campaigns.schemas";

type AdminReq = Request & { adminId: string };

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@ApiTags("Admin - Campaigns")
@Controller("admin/campaigns")
export class AdminCampaignsController {
  constructor(
    private readonly svc: AdminCampaignsService,
    private readonly council: AdminCampaignCouncilService,
  ) {}

  @Get()
  @RequirePermission("campaigns.read")
  @ApiOperation({ summary: "List tickets, every status" })
  list(@Query() query: unknown) {
    return this.svc.list(parseOrThrow(listQuerySchema, query));
  }

  @Get("queue")
  @RequirePermission("campaigns.review")
  @ApiOperation({ summary: "Tickets awaiting review, oldest request first" })
  queue() {
    return this.svc.queue();
  }

  @Put("order")
  @RequirePermission("campaigns.write")
  @ApiOperation({ summary: "Renumber one race's rail order" })
  order(@Req() req: AdminReq, @Body() body: unknown) {
    return this.svc.order(auditActorFromRequest(req), parseOrThrow(orderSchema, body));
  }

  // ---------- council role catalog (declared before `:id`, Nest matches in order) ----------

  @Get("roles")
  @RequirePermission("campaigns.read")
  @ApiOperation({ summary: "The shared council role catalog" })
  listRoles() {
    return this.council.listRoles();
  }

  @Post("roles")
  @RequirePermission("campaigns.write")
  createRole(@Req() req: AdminReq, @Body() body: unknown) {
    return this.council.createRole(auditActorFromRequest(req), parseOrThrow(roleSchema, body));
  }

  @Patch("roles/:code")
  @RequirePermission("campaigns.write")
  patchRole(@Req() req: AdminReq, @Param("code") code: string, @Body() body: unknown) {
    return this.council.patchRole(auditActorFromRequest(req), code, parseOrThrow(rolePatchSchema, body));
  }

  @Delete("roles/:code")
  @RequirePermission("campaigns.write")
  deleteRole(@Req() req: AdminReq, @Param("code") code: string) {
    return this.council.deleteRole(auditActorFromRequest(req), code);
  }

  @Get(":id")
  @RequirePermission("campaigns.read")
  get(@Param("id") id: string) {
    return this.svc.get(id);
  }

  @Post()
  @RequirePermission("campaigns.write")
  @ApiOperation({ summary: "Create a draft ticket" })
  create(@Req() req: AdminReq, @Body() body: unknown) {
    return this.svc.create(auditActorFromRequest(req), parseOrThrow(createSchema, body));
  }

  @Patch(":id")
  @RequirePermission("campaigns.write")
  patch(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.patch(auditActorFromRequest(req), id, parseOrThrow(patchSchema, body));
  }

  @Patch(":id/slug")
  @RequirePermission("campaigns.write")
  updateSlug(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.updateSlug(auditActorFromRequest(req), id, parseOrThrow(slugSchema, body).slug);
  }

  @Delete(":id")
  @RequirePermission("campaigns.write")
  remove(@Req() req: AdminReq, @Param("id") id: string) {
    return this.svc.remove(auditActorFromRequest(req), id);
  }

  @Post(":id/submit")
  @RequirePermission("campaigns.write")
  submit(@Req() req: AdminReq, @Param("id") id: string) {
    return this.svc.submit(auditActorFromRequest(req), id);
  }

  @Post(":id/approve")
  @RequirePermission("campaigns.review")
  approve(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.approve(auditActorFromRequest(req), req.adminId, id, parseOrThrow(reasonSchema, body).reason);
  }

  @Post(":id/request-changes")
  @RequirePermission("campaigns.review")
  requestChanges(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.requestChanges(auditActorFromRequest(req), id, parseOrThrow(noteSchema, body).note);
  }

  @Post(":id/unpublish")
  @RequirePermission("campaigns.review")
  unpublish(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.unpublish(auditActorFromRequest(req), id, parseOrThrow(reasonSchema, body).reason);
  }

  @Post(":id/conclude")
  @RequirePermission("campaigns.write")
  conclude(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.conclude(auditActorFromRequest(req), id, parseOrThrow(reasonSchema, body).reason);
  }

  @Post(":id/withdraw")
  @RequirePermission("campaigns.review")
  withdraw(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.withdraw(auditActorFromRequest(req), id, parseOrThrow(reasonSchema, body).reason);
  }

  @Post(":id/dissolve")
  @RequirePermission("campaigns.review")
  dissolve(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.svc.dissolve(auditActorFromRequest(req), id, parseOrThrow(reasonSchema, body).reason);
  }

  // ---------- council members ----------

  @Post(":id/council")
  @RequirePermission("campaigns.write")
  addMember(@Req() req: AdminReq, @Param("id") id: string, @Body() body: unknown) {
    return this.council.addMember(auditActorFromRequest(req), id, parseOrThrow(memberSchema, body));
  }

  @Patch(":id/council/:memberId")
  @RequirePermission("campaigns.write")
  patchMember(@Req() req: AdminReq, @Param("id") id: string, @Param("memberId") memberId: string, @Body() body: unknown) {
    return this.council.patchMember(auditActorFromRequest(req), id, memberId, parseOrThrow(memberPatchSchema, body));
  }

  @Post(":id/council/:memberId/end")
  @RequirePermission("campaigns.write")
  endMember(@Req() req: AdminReq, @Param("id") id: string, @Param("memberId") memberId: string, @Body() body: unknown) {
    return this.council.endMember(auditActorFromRequest(req), id, memberId, parseOrThrow(endMemberSchema, body));
  }

  @Delete(":id/council/:memberId")
  @RequirePermission("campaigns.write")
  removeMember(@Req() req: AdminReq, @Param("id") id: string, @Param("memberId") memberId: string) {
    return this.council.removeMember(auditActorFromRequest(req), id, memberId);
  }
}
