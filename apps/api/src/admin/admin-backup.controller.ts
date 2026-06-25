import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AdminGuard } from "./admin.guard";
import { AdminBackupService, BackupTypeInput } from "./admin-backup.service";
import { Public } from "../auth/decorators/public";

// JSON can't serialize BigInt — stringify sizeBytes.
function serialize(job: Record<string, unknown> | null) {
  if (!job) return job;
  return { ...job, sizeBytes: job.sizeBytes == null ? null : String(job.sizeBytes) };
}

@Public()
@UseGuards(AdminGuard)
@ApiTags("Admin - Backups")
@Controller("admin/backups")
export class AdminBackupController {
  constructor(private readonly service: AdminBackupService) {}

  @Post()
  @ApiOperation({ summary: "Trigger a database backup" })
  async create(
    @Body("type") type: BackupTypeInput,
    @Req() req: Request & { adminId?: string },
    @Res() res: Response,
  ) {
    if (type !== "FULL" && type !== "RELATIONAL") {
      throw new BadRequestException("type must be FULL or RELATIONAL");
    }
    try {
      const job = await this.service.createBackup(type, req.adminId);
      return res.status(HttpStatus.ACCEPTED).json(serialize(job));
    } catch (err) {
      if ((err as Error).message?.includes("already running")) {
        return res.status(HttpStatus.CONFLICT).json({ error: (err as Error).message });
      }
      throw err;
    }
  }

  @Get()
  @ApiOperation({ summary: "List backups" })
  async list(@Res() res: Response) {
    const jobs = await this.service.list();
    return res.json(jobs.map((j) => serialize(j as unknown as Record<string, unknown>)));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one backup" })
  async get(@Param("id") id: string, @Res() res: Response) {
    const job = await this.service.get(id);
    if (!job) return res.status(HttpStatus.NOT_FOUND).json({ error: "Not found" });
    return res.json(serialize(job as unknown as Record<string, unknown>));
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Get a presigned download URL" })
  async download(@Param("id") id: string, @Res() res: Response) {
    try {
      const url = await this.service.getDownloadUrl(id);
      return res.json({ url });
    } catch (err) {
      if ((err as Error).message?.includes("not available")) {
        return res.status(HttpStatus.CONFLICT).json({ error: (err as Error).message });
      }
      throw err;
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a backup" })
  async remove(@Param("id") id: string, @Res() res: Response) {
    try {
      await this.service.deleteBackup(id);
      return res.json({ ok: true });
    } catch (err) {
      // S3 removal failed (e.g. missing s3:DeleteObject permission) — report it
      // instead of pretending the delete succeeded; the row stays undeleted.
      return res
        .status(HttpStatus.BAD_GATEWAY)
        .json({ error: `Failed to delete backup from storage: ${(err as Error).message}` });
    }
  }
}
