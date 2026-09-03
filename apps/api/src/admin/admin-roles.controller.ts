import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { z } from "zod";
import { BadRequestException } from "@nestjs/common";
import { RequirePermission } from "@ournigeria/access";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "./admin.guard";
import { PermissionsGuard } from "./permissions.guard";
import { RolesAdminService } from "./roles-admin.service";
import { auditActorFromRequest } from "../audit/audit.service";

const grantSchema = z.object({
  adminId: z.string().uuid(),
  role: z.string().min(1).max(40),
  reason: z.string().max(500).optional(),
});

const revokeSchema = z.object({
  adminId: z.string().uuid(),
  role: z.string().min(1).max(40),
  reason: z.string().min(1).max(500),
});

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@ApiTags("Admin - Roles")
@Controller("admin/roles")
export class AdminRolesController {
  constructor(private readonly roles: RolesAdminService) {}

  @Get()
  @RequirePermission("roles.manage", "admins.manage")
  @ApiOperation({ summary: "Predefined role catalog" })
  catalog() {
    return this.roles.catalog();
  }

  @Get("assignments")
  @RequirePermission("roles.manage", "admins.manage")
  @ApiOperation({ summary: "Role assignments (active + history)" })
  assignments(@Query("adminId") adminId?: string) {
    return this.roles.assignments(adminId || undefined);
  }

  @Post("grant")
  @RequirePermission("roles.manage")
  @ApiOperation({ summary: "Grant a predefined role to an admin" })
  grant(@Req() req: Request, @Body() body: unknown) {
    const parsed = grantSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0].message);
    }
    const adminId = (req as unknown as { adminId: string }).adminId;
    return this.roles.grant(adminId, auditActorFromRequest(req as never), parsed.data);
  }

  @Post("revoke")
  @RequirePermission("roles.manage")
  @ApiOperation({ summary: "Revoke a role from an admin (reason required)" })
  revoke(@Req() req: Request, @Body() body: unknown) {
    const parsed = revokeSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0].message);
    }
    const adminId = (req as unknown as { adminId: string }).adminId;
    return this.roles.revoke(adminId, auditActorFromRequest(req as never), parsed.data);
  }
}
