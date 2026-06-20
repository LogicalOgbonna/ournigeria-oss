import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PrismaService } from "@ournigeria/database";
import { Public } from "../../auth/decorators/public";
import { AdminGuard } from "../admin.guard";
import { BulkImportService } from "./bulk-import.service";
import { listImporters } from "./importer.registry";
import type { ImportDiff, ImportResult } from "./importer.types";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/** Parse a multer file buffer as JSON, mapping a missing/invalid file to a 400. */
function parseJsonFile(file: Express.Multer.File | undefined): unknown {
  if (!file?.buffer) {
    throw new BadRequestException("no file uploaded");
  }
  try {
    return JSON.parse(file.buffer.toString("utf8"));
  } catch {
    throw new BadRequestException("file is not valid JSON");
  }
}

/**
 * Admin-only HTTP entry for curated bulk imports. A data-team admin uploads a
 * dataset JSON; `preview` returns a dry-run diff, `apply` creates + applies the
 * proposals through the audited enrichment pipeline (via BulkImportService).
 *
 * Resolves under the global "api" prefix → /api/admin/imports. `@Public()` opts
 * out of the global user AuthGuard so AdminGuard (HMAC admin session) governs.
 */
@Public()
@UseGuards(AdminGuard)
@Controller("admin/imports")
export class ImportsController {
  constructor(
    private readonly svc: BulkImportService,
    private readonly prisma: PrismaService,
  ) {}

  /** Each registered importer + its most-recent import_runs row (or null). */
  @Get()
  async list() {
    const runs = await this.prisma.importRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    // findMany is ordered newest-first, so the first row seen per dataset is latest.
    const latestByDataset = new Map<string, (typeof runs)[number]>();
    for (const run of runs) {
      if (!latestByDataset.has(run.dataset)) {
        latestByDataset.set(run.dataset, run);
      }
    }

    return listImporters().map((imp) => ({
      name: imp.name,
      label: imp.label,
      description: imp.description,
      autoApprove: imp.autoApprove,
      latestRun: latestByDataset.get(imp.name) ?? null,
    }));
  }

  /** Validate + diff only. No writes. Unknown dataset → 404, bad shape → 400. */
  @Post(":name/preview")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async preview(
    @Param("name") name: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportDiff> {
    return this.svc.preview(name, parseJsonFile(file));
  }

  /** Create + apply proposals through the audited pipeline; records an import run. */
  @Post(":name/apply")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async apply(
    @Param("name") name: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<ImportResult> {
    // AdminGuard sets request.adminId as a plain string.
    return this.svc.apply(name, parseJsonFile(file), req.adminId);
  }
}
