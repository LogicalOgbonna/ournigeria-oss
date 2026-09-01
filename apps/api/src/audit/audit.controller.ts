import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { RequirePermission } from "@ournigeria/access";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "../admin/admin.guard";
import { PermissionsGuard } from "../admin/permissions.guard";
import { AuditQueryService, type AuditListFilters } from "./audit-query.service";
import { AuditVerifyService } from "./audit-verify.service";
import { AuditService, auditActorFromRequest } from "./audit.service";

function parseFilters(query: Record<string, unknown>): AuditListFilters {
  const s = (k: string): string | undefined =>
    typeof query[k] === "string" && query[k] !== "" ? (query[k] as string) : undefined;
  const n = (k: string): number | undefined => {
    const v = s(k);
    if (!v) return undefined;
    const parsed = parseInt(v, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };
  return {
    actorId: s("actorId"),
    actorType: s("actorType"),
    action: s("action"),
    targetType: s("targetType"),
    targetId: s("targetId"),
    pathway: s("pathway"),
    from: s("from"),
    to: s("to"),
    page: n("page"),
    limit: n("limit"),
  };
}

@Public()
@UseGuards(AdminGuard, PermissionsGuard)
@ApiTags("Admin - Audit")
@Controller("admin/audit")
export class AuditController {
  constructor(
    private readonly queries: AuditQueryService,
    private readonly verifier: AuditVerifyService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission("audit.read")
  @ApiOperation({ summary: "List audit events (filterable)" })
  async list(@Query() query: Record<string, unknown>) {
    return this.queries.list(parseFilters(query));
  }

  @Get("mine")
  @RequirePermission("audit.read.own")
  @ApiOperation({ summary: "List my own audit events" })
  async mine(@Req() req: Request, @Query() query: Record<string, unknown>) {
    const adminId = (req as unknown as { adminId: string }).adminId;
    return this.queries.list({
      ...parseFilters(query),
      actorId: adminId,
      actorType: "staff",
    });
  }

  @Get("status")
  @RequirePermission("audit.read")
  @ApiOperation({ summary: "Chain head, anchor and verification status" })
  async status() {
    const [status, lastVerify] = await Promise.all([
      this.queries.status(),
      Promise.resolve(this.verifier.getLastResult()),
    ]);
    return { ...status, lastVerify };
  }

  @Get("verify")
  @RequirePermission("audit.read")
  @ApiOperation({ summary: "Run chain verification now" })
  async verify(@Query("full") full?: string) {
    return this.verifier.verify(full !== "true");
  }

  @Get("export")
  @RequirePermission("audit.read")
  @ApiOperation({ summary: "CSV export of the current filter (audited)" })
  async export(
    @Req() req: Request,
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const filters = parseFilters(query);
    const { csv, rows } = await this.queries.exportCsv(filters);
    // "Who took a copy of what" is itself a chain-of-trust question (spec §8.4).
    await this.audit.logBestEffort(auditActorFromRequest(req as never), {
      action: "audit.export",
      metadata: { filters: { ...filters }, rows },
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    return res.send(csv);
  }
}
