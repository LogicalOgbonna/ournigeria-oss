import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { z } from "zod";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "./admin.guard";
import { PermissionsGuard } from "./permissions.guard";
import { AuditRevertService } from "./audit-revert.service";
import { auditActorFromRequest } from "../audit/audit.service";

/**
 * 460, not 500: the service prefixes `revert of audit seq <n>: ` before handing
 * the reason to the domain services, whose own reason columns cap at 500.
 */
const bodySchema = z.object({ reason: z.string().max(460).optional() });

/**
 * No static @RequirePermission: the needed permission depends on the reverted
 * event's type — AuditRevertService checks it per action (own-action = same
 * permission; cross-actor additionally requires a reason + fires an ops alert).
 */
@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@ApiTags("Admin - Audit")
@Controller("admin/audit")
export class AdminAuditRevertController {
  constructor(private readonly reverts: AuditRevertService) {}

  @Post(":seq/revert")
  @ApiOperation({ summary: "Revert a diff-invertible audit event" })
  async revert(
    @Req() req: Request,
    @Param("seq", ParseIntPipe) seq: number,
    @Body() body: unknown,
  ) {
    const parsed = bodySchema.parse(body ?? {});
    const adminId = (req as unknown as { adminId: string }).adminId;
    const actor = auditActorFromRequest(req as never);
    return this.reverts.revert(adminId, actor, seq, parsed.reason);
  }
}
