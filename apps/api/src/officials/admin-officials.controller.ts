import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { z } from "zod";
import { RequirePermission } from "@ournigeria/access";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "../admin/admin.guard";
import { PermissionsGuard } from "../admin/permissions.guard";
import { auditActorFromRequest } from "../audit/audit.service";
import { AdminOfficialsService } from "./admin-officials.service";

const OFFICIAL_TYPES = [
  "elected",
  "appointed",
  "civil_servant",
  "judicial",
  "security",
  "traditional",
  "other",
] as const;

const scalarFields = {
  officialType: z.enum(OFFICIAL_TYPES).nullish(),
  imageUrl: z.string().url().max(500).nullish(),
  email: z.string().email().max(255).nullish(),
  phoneNumber: z.string().max(50).nullish(),
  officeAddress: z.string().max(500).nullish(),
  twitterHandle: z.string().max(100).nullish(),
  facebookUrl: z.string().url().max(500).nullish(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  gender: z.string().max(20).nullish(),
  education: z.string().max(2000).nullish(),
  biography: z.string().max(10_000).nullish(),
};

const createSchema = z.object({
  name: z.string().min(2).max(200),
  ...scalarFields,
});

const updateSchema = z.object({
  reason: z.string().min(3).max(500),
  name: z.string().min(2).max(200).optional(),
  ...scalarFields,
});

const slugSchema = z.object({
  slug: z.string().min(2).max(160),
  reason: z.string().min(3).max(500),
});

const reasonSchema = z.object({ reason: z.string().min(3).max(500) });

function parseOrThrow<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.errors[0].message);
  }
  return parsed.data;
}

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@ApiTags("Admin - Officials")
@Controller("admin/officials")
export class AdminOfficialsController {
  constructor(private readonly service: AdminOfficialsService) {}

  @Post()
  @RequirePermission("officials.create")
  @ApiOperation({ summary: "Create an official directly (pathway: direct)" })
  create(@Req() req: Request, @Body() body: unknown) {
    const data = parseOrThrow(createSchema, body);
    return this.service.create(auditActorFromRequest(req as never), data);
  }

  @Patch(":id")
  @RequirePermission("officials.update")
  @ApiOperation({ summary: "Edit official details (reason required)" })
  update(@Req() req: Request, @Param("id") id: string, @Body() body: unknown) {
    const { reason, ...fields } = parseOrThrow(updateSchema, body);
    return this.service.update(
      auditActorFromRequest(req as never),
      id,
      fields,
      reason,
    );
  }

  @Patch(":id/slug")
  @RequirePermission("officials.slug.update")
  @ApiOperation({ summary: "Change the public slug (old slug 30x-redirects forever)" })
  updateSlug(@Req() req: Request, @Param("id") id: string, @Body() body: unknown) {
    const { slug, reason } = parseOrThrow(slugSchema, body);
    return this.service.updateSlug(
      auditActorFromRequest(req as never),
      id,
      slug,
      reason,
    );
  }

  @Delete(":id")
  @RequirePermission("officials.delete")
  @ApiOperation({ summary: "Soft-delete an official (super admin; reason required)" })
  softDelete(@Req() req: Request, @Param("id") id: string, @Body() body: unknown) {
    const { reason } = parseOrThrow(reasonSchema, body);
    return this.service.softDelete(auditActorFromRequest(req as never), id, reason);
  }

  @Post(":id/restore")
  @RequirePermission("officials.delete")
  @ApiOperation({ summary: "Restore a soft-deleted official" })
  restore(@Req() req: Request, @Param("id") id: string) {
    return this.service.restore(auditActorFromRequest(req as never), id);
  }
}
